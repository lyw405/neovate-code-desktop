import { useEffect, useRef, useState } from 'react';
import type { ElectronAPI } from '../../shared/types';
import { useStore } from '../store';
import { toastManager } from './ui';
import { Input } from './ui/input';

interface CloneInputProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloneStart?: (progress: number, taskId: string) => void;
  onCloneComplete?: () => void;
}

export const CloneInput = ({
  open,
  onOpenChange,
  onCloneStart,
  onCloneComplete,
}: CloneInputProps) => {
  const [gitUrl, setGitUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const progressHandlerRef = useRef<
    | ((data: { taskId: string; percent: number; message: string }) => void)
    | null
  >(null);
  const currentTaskIdRef = useRef<string | null>(null);
  const {
    request,
    addRepo,
    addWorkspace,
    onEvent: subscribeToEvent,
  } = useStore();

  // Focus input when opened and reset state when closed
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      // Reset form state when dialog closes
      setGitUrl('');
      setIsCloning(false);
    }
  }, [open]);

  // Clean up event listener only when component truly unmounts (not when dialog closes)
  // Note: With store.onEvent, we can't manually remove handlers
  // But taskId filtering ensures old handlers don't interfere
  useEffect(() => {
    return () => {
      console.log(
        '[Clone] Component unmounting, handlers will be cleaned up automatically',
      );
    };
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isCloning) {
        onOpenChange(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isCloning, onOpenChange]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const url = gitUrl.trim();
    console.log('[Clone] Start clone:', url);
    if (!url || isCloning) return;

    // Validate Git URL format
    const isValidGitUrl =
      url.startsWith('http://') ||
      url.startsWith('https://') ||
      url.startsWith('git@') ||
      url.endsWith('.git');

    if (!isValidGitUrl) {
      toastManager.add({
        title: 'Invalid URL',
        description: 'Please enter a valid Git repository URL',
        type: 'error',
      });
      return;
    }

    // Prompt for clone location
    const electron = window.electron as ElectronAPI | undefined;
    if (!electron?.selectCloneLocation) {
      toastManager.add({
        title: 'Error',
        description: 'Directory selection is not available',
        type: 'error',
      });
      return;
    }

    const cloneLocation = await electron.selectCloneLocation();
    if (!cloneLocation) {
      return;
    }

    // Generate unique task ID for this clone operation
    const taskId = `clone-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    currentTaskIdRef.current = taskId;
    console.log('[Clone] Generated taskId:', taskId);

    // CRITICAL: Define progress handler outside try block
    // This ensures proper cleanup in finally block
    const handleProgress = (data: {
      taskId: string;
      percent: number;
      message: string;
    }) => {
      console.log('[Clone] Progress event received:', data);
      if (data.taskId === taskId) {
        const percent = Math.round(data.percent || 0);
        console.log('[Clone] Progress update for current task:', percent, '%');
        onCloneStart?.(percent, taskId);
      } else {
        console.log(
          '[Clone] Ignored progress for different task:',
          data.taskId,
        );
      }
    };

    // CRITICAL: Subscribe to progress events using store.onEvent
    // This ensures we subscribe to the correct MessageBus instance
    // Remove old handler if exists
    if (progressHandlerRef.current) {
      console.log('[Clone] Removing old progress handler');
      // Note: We can't remove handlers with the current implementation
      // So we rely on taskId filtering to ignore old events
    }

    // CRITICAL: Subscribe to progress events BEFORE starting clone
    // This ensures we don't miss early progress events
    console.log('[Clone] Subscribing to progress events via store.onEvent');
    try {
      subscribeToEvent<{
        taskId: string;
        percent: number;
        message: string;
      }>('git.clone.progress', handleProgress);

      // Store handler in ref (though we can't manually remove it)
      progressHandlerRef.current = handleProgress;
      console.log('[Clone] Successfully subscribed to progress events');
    } catch (error) {
      console.error('[Clone] Failed to subscribe to progress events:', error);
    }

    try {
      // Start showing progress immediately
      console.log('[Clone] Starting clone process');
      setIsCloning(true);
      onCloneStart?.(0, taskId);
      console.log('[Clone] Initial progress set to 0%');

      // Close the input dialog to keep UI clean
      onOpenChange(false);

      // Clone the repository with timeout
      const clonePromise = request('git.clone', {
        url,
        destination: cloneLocation,
        taskId,
      });

      // Set a reasonable timeout (35 minutes, slightly longer than backend's 30min)
      // This ensures the backend timeout triggers first with proper error handling
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => {
            reject(new Error('Clone operation timed out after 35 minutes'));
          },
          35 * 60 * 1000,
        );
      });

      const cloneResponse = await Promise.race([clonePromise, timeoutPromise]);
      console.log('[Clone] Clone response received:', cloneResponse.success);
      console.log('[Clone] Clone response error:', cloneResponse.error);
      console.log(
        '[Clone] Clone response full:',
        JSON.stringify(cloneResponse),
      );

      if (!cloneResponse.success || !cloneResponse.data) {
        // Check if the error is from user cancellation
        const errorMsg = cloneResponse.error || '';
        if (errorMsg.includes('cancelled by user')) {
          console.log('[Clone] Operation cancelled, skipping error toast');
          return;
        }

        toastManager.add({
          title: 'Clone Failed',
          description: cloneResponse.error || 'Failed to clone repository',
          type: 'error',
        });
        return;
      }

      const clonePath = cloneResponse.data.clonePath;

      // Get repository info
      const repoInfoResponse = await request('project.getRepoInfo', {
        cwd: clonePath,
      });

      if (!repoInfoResponse.success || !repoInfoResponse.data?.repoData) {
        toastManager.add({
          title: 'Error',
          description:
            repoInfoResponse.error || 'Could not load repository information',
          type: 'error',
        });
        return;
      }

      const repoData = repoInfoResponse.data.repoData;

      // Add the repository to the store
      addRepo(repoData);

      // Fetch and add workspaces for this repository
      try {
        const workspacesResponse = await request('project.workspaces.list', {
          cwd: clonePath,
        });

        if (workspacesResponse.success && workspacesResponse.data?.workspaces) {
          for (const workspace of workspacesResponse.data.workspaces) {
            addWorkspace(workspace);
          }
        }
      } catch (workspaceError) {
        console.error('Failed to load workspaces:', workspaceError);
      }

      // Show success toast
      console.log('[Clone] Clone completed successfully');
      toastManager.add({
        title: 'Repository cloned',
        description: `Successfully cloned ${repoData.name}`,
        type: 'success',
      });
    } catch (error) {
      console.error('[Clone] Error:', error);

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Skip error toast if user cancelled
      if (errorMessage.includes('cancelled by user')) {
        console.log('[Clone] Operation cancelled, skipping error toast');
        return;
      }

      let userFriendlyMessage = errorMessage;
      if (errorMessage.includes('Git is not installed')) {
        userFriendlyMessage =
          'Git is not installed. Please install Git from https://git-scm.com/';
      } else if (errorMessage.includes('timed out')) {
        userFriendlyMessage =
          'Clone operation timed out. The repository might be too large or the connection is slow. Please try again.';
      } else if (
        errorMessage.includes('Authentication failed') ||
        errorMessage.includes('fatal: could not read')
      ) {
        // SSH or HTTPS authentication issues
        if (url.startsWith('git@')) {
          userFriendlyMessage =
            'SSH authentication failed. Please ensure you have:\n' +
            '1. SSH key configured (~/.ssh/id_rsa or id_ed25519)\n' +
            '2. SSH key added to your Git provider (GitHub/GitLab)';
        } else {
          userFriendlyMessage =
            'Authentication failed. This is a private repository.\n' +
            "Please use SSH URL with configured SSH keys, or use 'git clone' in terminal to enter credentials.";
        }
      } else if (
        errorMessage.includes('Permission denied') ||
        errorMessage.includes('publickey')
      ) {
        userFriendlyMessage =
          'SSH key not found or not authorized. Please:\n' +
          '1. Generate SSH key: ssh-keygen -t ed25519\n' +
          '2. Add public key to your Git provider\n' +
          'Or use HTTPS URL for public repositories.';
      }

      toastManager.add({
        title: 'Clone Failed',
        description: userFriendlyMessage,
        type: 'error',
      });
    } finally {
      // Note: Event handlers use taskId filtering, so old handlers won't interfere
      // with new clone operations. No manual cleanup needed.
      console.log(
        '[Clone] Cleaning up - taskId filter will ignore future events',
      );

      // Reset cloning state and notify completion
      console.log('[Clone] Resetting cloning state');
      setIsCloning(false);
      currentTaskIdRef.current = null;
      onCloneComplete?.();
    }
  };

  // Don't unmount component while cloning is in progress
  // This ensures event listeners remain active
  if (!open && !isCloning) return null;

  // Only show UI when dialog is open and not cloning
  const showUI = open && !isCloning;

  return (
    <>
      {showUI && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 animate-in fade-in duration-200"
            onClick={() => !isCloning && onOpenChange(false)}
          />

          {/* Input container */}
          <div className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 animate-in slide-in-from-top-4 fade-in duration-200">
            <form onSubmit={handleSubmit}>
              <div className="bg-popover border rounded-lg shadow-lg overflow-hidden">
                <Input
                  ref={inputRef}
                  type="text"
                  value={gitUrl}
                  onChange={(e) => setGitUrl(e.target.value)}
                  placeholder="Enter Git repository URL (e.g., https://github.com/user/repo.git)"
                  disabled={isCloning}
                  className="border-0 rounded-none text-sm h-11 px-4 focus-visible:ring-0 shadow-none"
                />
                <div
                  className="px-4 py-2 text-xs border-t flex items-center justify-between"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  <span>
                    Press{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
                      Enter
                    </kbd>{' '}
                    to select location and clone
                  </span>
                  <span>
                    <kbd className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 font-mono">
                      Esc
                    </kbd>{' '}
                    to close
                  </span>
                </div>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};
