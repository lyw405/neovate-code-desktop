import React, { useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  FolderIcon,
  GitBranchIcon,
  PlusSignIcon,
  DeleteIcon,
  SettingsIcon,
  InformationCircleIcon,
  CalendarIcon,
  ClockIcon,
  DatabaseIcon,
  CloudIcon,
} from '@hugeicons/core-free-icons';
import type { RepoData, WorkspaceData } from '../client/types/entities';
import { useStore } from '../store';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from './ui/accordion';
import {
  Dialog,
  DialogPopup,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Button } from './ui/button';

export const RepoSidebar = ({
  repos,
  selectedRepoPath,
  selectedWorkspaceId,
  onSelectRepo,
  onSelectWorkspace,
}: {
  repos: RepoData[];
  selectedRepoPath: string | null;
  selectedWorkspaceId: string | null;
  onSelectRepo: (path: string | null) => void;
  onSelectWorkspace: (id: string | null) => void;
}) => {
  const allRepoIds = repos.map((repo) => repo.path);
  const workspaces = useStore((state) => state.workspaces);
  const deleteRepo = useStore((state) => state.deleteRepo);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRepoForDialog, setSelectedRepoForDialog] =
    useState<RepoData | null>(null);

  const handleRepoInfoClick = (repo: RepoData, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRepoForDialog(repo);
    setDialogOpen(true);
  };

  const handleDeleteRepo = () => {
    if (selectedRepoForDialog) {
      deleteRepo(selectedRepoForDialog.path);
      setDialogOpen(false);
      setSelectedRepoForDialog(null);
    }
  };

  const handleNewWorkspace = (repoPath: string) => {
    console.log(`Create new workspace for ${repoPath}`);
  };

  return (
    <div
      className="flex flex-col h-full w-64"
      style={{
        backgroundColor: 'var(--bg-surface)',
        color: 'var(--text-primary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      <RepoSidebar.Header />

      <div className="flex-1 overflow-y-auto">
        <Accordion defaultValue={allRepoIds}>
          {repos.map((repo) => (
            <AccordionItem key={repo.path} value={repo.path}>
              <AccordionTrigger className="px-3 py-2 hover:bg-opacity-50">
                <div className="flex items-center gap-2 flex-1">
                  <HugeiconsIcon
                    icon={FolderIcon}
                    size={18}
                    strokeWidth={1.5}
                  />
                  <span className="font-medium text-sm">{repo.name}</span>
                  <span
                    className="ml-auto text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {repo.workspaceIds.length}
                  </span>
                  <button
                    className="p-1 rounded hover:bg-opacity-70"
                    onClick={(e) => handleRepoInfoClick(repo, e)}
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <HugeiconsIcon
                      icon={InformationCircleIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              </AccordionTrigger>

              <AccordionPanel>
                <div className="ml-4 space-y-1">
                  <div
                    className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded hover:bg-opacity-50 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onClick={() => handleNewWorkspace(repo.path)}
                  >
                    <HugeiconsIcon
                      icon={PlusSignIcon}
                      size={16}
                      strokeWidth={1.5}
                    />
                    <span className="text-sm">New workspace</span>
                  </div>

                  {repo.workspaceIds.map((workspaceId) => {
                    const workspace = workspaces[workspaceId];
                    if (!workspace) return null;

                    const isSelected = selectedWorkspaceId === workspaceId;
                    const changesCount =
                      workspace.gitState.pendingChanges.length;

                    return (
                      <div
                        key={workspaceId}
                        className="flex items-center gap-2 px-3 py-2 cursor-pointer rounded transition-colors"
                        style={
                          isSelected
                            ? { backgroundColor: 'var(--bg-base)' }
                            : {}
                        }
                        onClick={() => onSelectWorkspace(workspaceId)}
                      >
                        <HugeiconsIcon
                          icon={GitBranchIcon}
                          size={16}
                          strokeWidth={1.5}
                        />
                        <span className="flex-1 text-sm">
                          {workspace.branch}
                        </span>
                        {changesCount > 0 && (
                          <span
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: '#fef3c7',
                              color: '#92400e',
                            }}
                          >
                            {changesCount}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <RepoSidebar.Footer />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogPopup>
          <DialogHeader>
            <DialogTitle>Repository Information</DialogTitle>
            <DialogDescription>{selectedRepoForDialog?.name}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-sm">
            <InfoRow
              icon={FolderIcon}
              label="Path"
              value={selectedRepoForDialog?.path || ''}
            />
            <InfoRow
              icon={GitBranchIcon}
              label="Workspaces"
              value={`${selectedRepoForDialog?.workspaceIds.length || 0} worktrees`}
            />
            <InfoRow
              icon={CloudIcon}
              label="Remote URL"
              value="https://github.com/user/repo.git"
            />
            <InfoRow icon={ClockIcon} label="Last Commit" value="2 hours ago" />
            <InfoRow
              icon={DatabaseIcon}
              label="Repository Size"
              value="12.5 MB"
            />
            <InfoRow
              icon={CalendarIcon}
              label="Created"
              value={new Date().toLocaleDateString()}
            />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteRepo}
              className="gap-2"
            >
              <HugeiconsIcon icon={DeleteIcon} size={16} strokeWidth={1.5} />
              Delete Repository
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <HugeiconsIcon
        icon={icon}
        size={16}
        strokeWidth={1.5}
        style={{ color: 'var(--text-secondary)', marginTop: '2px' }}
      />
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium mb-0.5"
          style={{ color: 'var(--text-secondary)' }}
        >
          {label}
        </div>
        <div
          className="text-sm break-all"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

RepoSidebar.Header = function Header() {
  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <h2 className="text-base font-semibold">Repositories</h2>
    </div>
  );
};

RepoSidebar.Footer = function Footer() {
  return (
    <div
      className="px-3 py-2 flex gap-2"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <button
        className="p-2 rounded hover:bg-opacity-70 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <HugeiconsIcon icon={PlusSignIcon} size={18} strokeWidth={1.5} />
      </button>
      <button
        className="p-2 rounded hover:bg-opacity-70 transition-colors"
        style={{ color: 'var(--text-secondary)' }}
      >
        <HugeiconsIcon icon={SettingsIcon} size={18} strokeWidth={1.5} />
      </button>
    </div>
  );
};
