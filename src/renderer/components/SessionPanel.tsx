import React, { createContext, useContext, useState } from 'react';
import type { SessionData, Message } from '../client/types/entities';
import { Button } from '@/components/ui/button';

// Define the context type
interface SessionContextType {
  session: SessionData | null;
  messages: Message[];
  inputValue: string;
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  setInputValue: (value: string) => void;
}

// Create the context
const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Custom hook to use the context
export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within SessionPanel');
  }
  return context;
}

// Main component
export const SessionPanel = ({
  session,
  onSendMessage,
}: {
  session: SessionData | null;
  onSendMessage: (content: string) => Promise<void>;
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onSendMessage(content);
      setInputValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: SessionContextType = {
    session,
    messages: session?.messages || [],
    inputValue,
    isLoading,
    sendMessage,
    setInputValue,
  };

  return (
    <SessionContext.Provider value={contextValue}>
      <div
        className="flex flex-col h-full"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <SessionPanel.Header />
        <SessionPanel.TabBar />
        <SessionPanel.WorkspaceInfo />
        <SessionPanel.Messages />
        <SessionPanel.ChatInput />
      </div>
    </SessionContext.Provider>
  );
};

// Compound components
SessionPanel.Header = function Header() {
  const { session } = useSessionContext();

  return (
    <div
      className="p-4"
      style={{ borderBottom: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            {session
              ? `Session ${session.id.substring(0, 8)}`
              : 'No Session Selected'}
          </h2>
          <p className="text-sm" style={{ color: '#666' }}>
            {session ? `Workspace: ${session.workspaceId.substring(0, 8)}` : ''}
          </p>
        </div>
        <Button variant="default" size="sm">
          Open in Editor
        </Button>
      </div>
    </div>
  );
};

SessionPanel.TabBar = function TabBar() {
  return (
    <div
      className="flex"
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <SessionPanel.Tab isActive>Chat</SessionPanel.Tab>
      <SessionPanel.Tab>Files</SessionPanel.Tab>
      <SessionPanel.Tab>Terminal</SessionPanel.Tab>
    </div>
  );
};

SessionPanel.Tab = function Tab({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive?: boolean;
}) {
  return (
    <div
      className="px-4 py-2 text-sm cursor-pointer"
      style={
        isActive
          ? { borderBottom: '2px solid #0070f3', color: 'var(--text-primary)' }
          : { color: '#666' }
      }
    >
      {children}
    </div>
  );
};

SessionPanel.WorkspaceInfo = function WorkspaceInfo() {
  const { session } = useSessionContext();

  if (!session) return null;

  return (
    <div
      className="p-3 text-sm"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div
        className="flex items-center"
        style={{ color: 'var(--text-primary)' }}
      >
        <BranchIcon />
        <span className="ml-2">main</span>
        <span className="mx-2">•</span>
        <span style={{ color: '#666' }}>Created 2 hours ago</span>
        <span className="ml-auto flex items-center">
          <StatusIcon />
          <span className="ml-1">Active</span>
        </span>
      </div>
    </div>
  );
};

SessionPanel.Messages = function Messages() {
  const { messages } = useSessionContext();

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 ? (
        <div className="text-center mt-8" style={{ color: '#999' }}>
          No messages yet. Start a conversation!
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <SessionPanel.Message key={message.id} message={message} />
          ))}
        </div>
      )}
    </div>
  );
};

SessionPanel.Message = function Message({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className="max-w-[80%] rounded-lg p-3"
        style={{
          backgroundColor: isUser ? '#0070f3' : 'var(--bg-surface)',
          color: isUser ? 'white' : 'var(--text-primary)',
        }}
      >
        <div className="flex items-center mb-1">
          <span className="text-xs font-semibold">
            {message.role === 'user'
              ? 'You'
              : message.role === 'assistant'
                ? 'Assistant'
                : 'System'}
          </span>
          <span
            className="text-xs ml-2"
            style={{ color: isUser ? 'rgba(255,255,255,0.7)' : '#666' }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
      </div>
    </div>
  );
};

SessionPanel.ChatInput = function ChatInput() {
  const { inputValue, setInputValue, sendMessage, isLoading } =
    useSessionContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <div
      className="p-4"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      <form onSubmit={handleSubmit} className="flex">
        <div className="flex-1 relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="w-full rounded-lg px-4 py-2 pr-12 focus:outline-none focus:ring-2"
            style={{
              backgroundColor: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
            }}
            disabled={isLoading}
          />
          <SessionPanel.Toolbar />
        </div>
        <SessionPanel.SendButton />
      </form>
    </div>
  );
};

SessionPanel.Toolbar = function Toolbar() {
  return (
    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex">
      <button
        type="button"
        className="p-1 hover:opacity-70"
        style={{ color: '#666' }}
        title="Attach file"
      >
        <AttachIcon />
      </button>
    </div>
  );
};

SessionPanel.SendButton = function SendButton() {
  const { inputValue, isLoading } = useSessionContext();

  const canSend = inputValue.trim() && !isLoading;

  return (
    <button
      type="submit"
      disabled={!canSend}
      className="ml-2 px-4 py-2 rounded-lg"
      style={
        canSend
          ? { backgroundColor: '#0070f3', color: 'white' }
          : { backgroundColor: '#e0e0e0', color: '#999', cursor: 'not-allowed' }
      }
    >
      {isLoading ? <SpinnerIcon /> : <SendIcon />}
    </button>
  );
};

// Icons
function BranchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M5 3a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 1a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM5 6h10v1H5V6z"
      />
    </svg>
  );
}

function StatusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5" fill="#10B981" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path
        fill="currentColor"
        d="M6 3v6a3 3 0 1 0 6 0V3a1 1 0 1 0-2 0v6a1 1 0 1 1-2 0V3a3 3 0 1 0-2 0v6a3 3 0 1 0 6 0V3"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16">
      <path fill="currentColor" d="M1 8l14-6-6 14-4-10L1 8z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className="animate-spin">
      <circle
        cx="8"
        cy="8"
        r="6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="8 8"
      />
    </svg>
  );
}
