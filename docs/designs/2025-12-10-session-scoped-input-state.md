# Session-Scoped Input State

## Overview

Move input state from a global singleton to session-scoped storage in the main store, allowing each session to preserve its own input draft, cursor position, and settings.

## Data Model

### Per-Session State (`inputBySession`)

Add to `store.tsx`:

```typescript
type PlanMode = 'normal' | 'plan' | 'brainstorm';
type ThinkingLevel = null | 'low' | 'medium' | 'high';

interface SessionInputState {
  value: string;
  cursorPosition: number;
  historyIndex: number | null;
  draftInput: string;
  planMode: PlanMode;
  thinking: ThinkingLevel;
  pastedTextMap: Record<string, string>;
  pastedImageMap: Record<string, string>;
}

const defaultSessionInputState: SessionInputState = {
  value: '',
  cursorPosition: 0,
  historyIndex: null,
  draftInput: '',
  planMode: 'normal',
  thinking: null,
  pastedTextMap: {},
  pastedImageMap: {},
};
```

### Per-Workspace State (`historyByWorkspace`)

```typescript
historyByWorkspace: Record<WorkspaceId, string[]>;
```

Command history is shared across sessions within the same workspace.

## Store Changes

### StoreState Additions

```typescript
interface StoreState {
  // ... existing fields ...
  
  // Session-scoped input state
  inputBySession: Record<SessionId, SessionInputState>;
  
  // Workspace-scoped history
  historyByWorkspace: Record<WorkspaceId, string[]>;
}
```

### StoreActions Additions

```typescript
interface StoreActions {
  // ... existing actions ...
  
  // Session input helpers
  getSessionInput: (sessionId: string) => SessionInputState;
  setSessionInput: (sessionId: string, state: Partial<SessionInputState>) => void;
  resetSessionInput: (sessionId: string) => void;
  
  // Workspace history helpers
  addToWorkspaceHistory: (workspaceId: string, input: string) => void;
  getWorkspaceHistory: (workspaceId: string) => string[];
}
```

### Implementation

```typescript
getSessionInput: (sessionId: string): SessionInputState => {
  const { inputBySession } = get();
  return inputBySession[sessionId] || defaultSessionInputState;
},

setSessionInput: (sessionId: string, state: Partial<SessionInputState>) => {
  set((prev) => ({
    inputBySession: {
      ...prev.inputBySession,
      [sessionId]: {
        ...(prev.inputBySession[sessionId] || defaultSessionInputState),
        ...state,
      },
    },
  }));
},

resetSessionInput: (sessionId: string) => {
  set((prev) => ({
    inputBySession: {
      ...prev.inputBySession,
      [sessionId]: defaultSessionInputState,
    },
  }));
},

addToWorkspaceHistory: (workspaceId: string, input: string) => {
  set((prev) => ({
    historyByWorkspace: {
      ...prev.historyByWorkspace,
      [workspaceId]: [...(prev.historyByWorkspace[workspaceId] || []), input],
    },
  }));
},

getWorkspaceHistory: (workspaceId: string): string[] => {
  const { historyByWorkspace } = get();
  return historyByWorkspace[workspaceId] || [];
},
```

## Hook Changes

### `useInputState.ts`

Update signature to accept sessionId and workspaceId:

```typescript
export function useInputState(
  sessionId: string | null,
  workspaceId: string | null,
) {
  const {
    getSessionInput,
    setSessionInput,
    resetSessionInput,
    addToWorkspaceHistory,
    getWorkspaceHistory,
  } = useStore();

  const sessionInput = sessionId ? getSessionInput(sessionId) : defaultSessionInputState;
  const history = workspaceId ? getWorkspaceHistory(workspaceId) : [];

  const state: InputState = {
    value: sessionInput.value,
    cursorPosition: sessionInput.cursorPosition,
    mode: getInputMode(sessionInput.value),
  };

  const setValue = useCallback(
    (newValue: string) => {
      if (sessionId) {
        setSessionInput(sessionId, { value: newValue });
      }
    },
    [sessionId, setSessionInput],
  );

  const setCursorPosition = useCallback(
    (pos: number) => {
      if (sessionId) {
        setSessionInput(sessionId, { cursorPosition: pos });
      }
    },
    [sessionId, setSessionInput],
  );

  const reset = useCallback(() => {
    if (sessionId) {
      resetSessionInput(sessionId);
    }
  }, [sessionId, resetSessionInput]);

  // Additional getters/setters for planMode, thinking, etc.
  const planMode = sessionInput.planMode;
  const thinking = sessionInput.thinking;
  const historyIndex = sessionInput.historyIndex;
  const draftInput = sessionInput.draftInput;
  const pastedTextMap = sessionInput.pastedTextMap;
  const pastedImageMap = sessionInput.pastedImageMap;

  const setPlanMode = useCallback(/* ... */);
  const setThinking = useCallback(/* ... */);
  // ... other setters

  return {
    state,
    setValue,
    setCursorPosition,
    reset,
    planMode,
    thinking,
    history,
    historyIndex,
    draftInput,
    pastedTextMap,
    pastedImageMap,
    // ... setters
  };
}
```

## Migration

### Remove `inputStore.ts`

After migration, `src/renderer/store/inputStore.ts` can be deleted as all state moves to the main store.

### Update Consumers

Components using `useInputState()` need to pass the current session and workspace IDs:

```typescript
// Before
const { state, setValue } = useInputState();

// After
const { selectedSessionId, selectedWorkspaceId } = useStore();
const { state, setValue } = useInputState(selectedSessionId, selectedWorkspaceId);
```

## Behavior

1. **Session Switch:** When user switches sessions, their draft input is preserved. Returning to a session restores the exact input state.

2. **New Session:** New sessions start with `defaultSessionInputState`.

3. **History:** History persists per-workspace, so all sessions in a workspace share command history.

4. **No Session Selected:** When `sessionId` is null, returns default state and setters are no-ops.

## Files to Modify

1. `src/renderer/store.tsx` - Add inputBySession, historyByWorkspace, and helpers
2. `src/renderer/hooks/useInputState.ts` - Update to use main store
3. `src/renderer/store/inputStore.ts` - Delete after migration
4. Consumer components - Pass sessionId/workspaceId to useInputState
