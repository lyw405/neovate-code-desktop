# Local JSX Slash Commands

## Overview

Add support for client-side (local-jsx type) slash commands that can render React components and access the Zustand store directly. The first implementation is `/clear` which clears the current session and creates a new one.

## Data Structures

### Store State Additions

```typescript
// In StoreState interface
slashCommandJSXBySession: Record<SessionId, React.ReactNode | null>;
```

### Store Action Additions

```typescript
// In StoreActions interface
setSlashCommandJSX: (sessionId: string, jsx: React.ReactNode | null) => void;
clearSessionAndCreate: () => Promise<{ sessionId: string }>;
```

## File Structure

```
src/renderer/slash-commands/
├── index.ts          # Barrel export with command array
├── clear.tsx         # /clear command implementation
```

## Implementation

### 1. Command Definition (`src/renderer/slash-commands/clear.tsx`)

```tsx
import React, { useEffect } from 'react';
import { useStore } from '../store';
import type { LocalJSXCommand } from '../slashCommand';

export const clearCommand: LocalJSXCommand = {
  name: 'clear',
  description: 'Clear session and create new one',
  type: 'local-jsx',
  async call(onDone) {
    return React.createElement(() => {
      const clearSessionAndCreate = useStore((s) => s.clearSessionAndCreate);
      useEffect(() => {
        clearSessionAndCreate().then(({ sessionId }) => {
          onDone(`Messages cleared, new session id: ${sessionId}`);
        });
      }, []);
      return null;
    });
  },
};
```

### 2. Registry (`src/renderer/slash-commands/index.ts`)

```typescript
import type { LocalJSXCommand } from '../slashCommand';
import { clearCommand } from './clear';

export const localJSXCommands: LocalJSXCommand[] = [clearCommand];
```

### 3. Store Changes (`src/renderer/store.tsx`)

**State:**
```typescript
slashCommandJSXBySession: Record<SessionId, React.ReactNode | null>;
```

**Actions:**
```typescript
setSlashCommandJSX: (sessionId: string, jsx: React.ReactNode | null) => void;
clearSessionAndCreate: () => Promise<{ sessionId: string }>;
```

**sendMessage isLocalJSX Logic:**
```typescript
import { localJSXCommands } from './slash-commands';

// In sendMessage, before backend command check:
const localCommand = localJSXCommands.find(c => c.name === parsed.command);
if (localCommand) {
  const jsx = await localCommand.call(
    async (result: string | null) => {
      set((state) => ({
        slashCommandJSXBySession: {
          ...state.slashCommandJSXBySession,
          [sessionId]: null,
        },
      }));
      if (result) {
        const { addMessage } = get();
        addMessage(sessionId, {
          role: 'user',
          content: [{ type: 'text', text: result }],
        } as any);
      }
    },
    {} as any,
    parsed.args,
  );
  set((state) => ({
    slashCommandJSXBySession: {
      ...state.slashCommandJSXBySession,
      [sessionId]: jsx,
    },
  }));
  return;
}
```

**clearSessionAndCreate Implementation:**
```typescript
clearSessionAndCreate: async () => {
  const { selectedSessionId, clearSession, createSession } = get();
  if (selectedSessionId) {
    clearSession(selectedSessionId);
  }
  const newSessionId = createSession();
  return { sessionId: newSessionId };
},
```

### 4. WorkspacePanel Rendering

After ChatInput in WorkspacePanel.tsx:
```tsx
const slashCommandJSXBySession = useStore((state) => state.slashCommandJSXBySession);
const slashCommandJSX = selectedSessionId 
  ? slashCommandJSXBySession[selectedSessionId] 
  : null;

// In JSX, after ChatInput:
{slashCommandJSX}
```

## Flow

1. User types `/clear` in ChatInput and submits
2. `sendMessage` parses command, finds `clearCommand` in `localJSXCommands`
3. Calls `clearCommand.call(onDone, context, args)` which returns a React component
4. Component is stored in `slashCommandJSXBySession[sessionId]`
5. WorkspacePanel renders the component
6. Component's useEffect calls `clearSessionAndCreate()`
7. When complete, `onDone(result)` is called:
   - Clears the JSX from state (`slashCommandJSXBySession[sessionId] = null`)
   - Optionally adds a user message with the result

## Adding New Commands

To add a new local-jsx command:

1. Create `src/renderer/slash-commands/yourcommand.tsx`:
```tsx
import React from 'react';
import { useStore } from '../store';
import type { LocalJSXCommand } from '../slashCommand';

export const yourCommand: LocalJSXCommand = {
  name: 'yourcommand',
  description: 'Description of your command',
  type: 'local-jsx',
  async call(onDone, context, args) {
    return React.createElement(() => {
      // Use hooks, render UI, call onDone when finished
      return <div>Your UI here</div>;
    });
  },
};
```

2. Add to `src/renderer/slash-commands/index.ts`:
```typescript
import { yourCommand } from './yourcommand';
export const localJSXCommands: LocalJSXCommand[] = [clearCommand, yourCommand];
```
