# Session Thinking Config Initialization

**Date:** 2025-12-11

## Context

The thinking toggle feature (Ctrl+T) allows users to cycle through thinking levels (low/medium/high/null). However, not all models support extended thinking. The goal is to:

1. Fetch model info when a session is selected to determine if the model supports thinking
2. Initialize `thinking: 'low'` if the model has `thinkingConfig`
3. Disable the Ctrl+T toggle and hide the Thinking Toggle button if the model doesn't support thinking
4. Update this state when the user changes the model in ChatInput

## Discussion

### Fetch Scope
**Question:** Where should the model info fetching occur?
- Option A: Workspace mount (fetch once, apply to all sessions)
- Option B: Session selection (fetch per-session)

**Decision:** Session selection - fetch model info when `selectedSessionId` changes, initialize thinking per-session.

### State Design
**Question:** How to track whether thinkingConfig is available?
- Option A: Add `thinkingEnabled: boolean` to `SessionInputState` in store
- Option B: Prop drilling from WorkspacePanel to ChatInput
- Option C: Separate `thinkingConfigBySession` map in store

**Decision:** Store in `SessionInputState` - keeps thinking toggle state co-located with other input state. This state should also be updated when model is changed in ChatInput.

### UI Behavior
When `thinkingEnabled` is false:
- Hide the Thinking Toggle button entirely
- Ctrl+T shortcut does nothing

## Approach

1. Add `thinkingEnabled: boolean` to `SessionInputState` (default: `false`)
2. On session selection, call `session.getModel` with `includeModelInfo: true`
3. Check `modelInfo.thinkingConfig` - if present, set `thinkingEnabled: true` and `thinking: 'low'`
4. On model change in ChatInput, re-fetch model info and update `thinkingEnabled`
5. Conditionally render Thinking Toggle button based on `thinkingEnabled`
6. Guard Ctrl+T handler with `thinkingEnabled` check

## Architecture

### Data Model Changes

**store.tsx** - Add to `SessionInputState`:
```typescript
export interface SessionInputState {
  // ... existing fields
  thinkingEnabled: boolean;
}

const defaultSessionInputState: SessionInputState = {
  // ... existing defaults
  thinkingEnabled: false,
};
```

### Files to Modify

| File | Change |
|------|--------|
| `store.tsx` | Add `thinkingEnabled: boolean` to `SessionInputState`, default `false` |
| `useInputState.ts` | Expose `thinkingEnabled` in return object |
| `WorkspacePanel.tsx` | Add `useEffect` to fetch `session.getModel` with `includeModelInfo: true` on session selection |
| `useInputHandlers.ts` | Guard Ctrl+T handler with `thinkingEnabled` check |
| `ChatInput.tsx` | Conditionally render Thinking Toggle button; update `thinkingEnabled` in `handleModelChange` |

### Data Flow

```
Session Selected
       │
       ▼
WorkspacePanel fetches session.getModel(includeModelInfo: true)
       │
       ▼
Check modelInfo.thinkingConfig
       │
       ├── Has thinkingConfig ──► thinkingEnabled: true, thinking: 'low'
       │
       └── No thinkingConfig ──► thinkingEnabled: false, thinking: null
```

```
Model Changed in ChatInput
       │
       ▼
session.config.set (save new model)
       │
       ▼
session.getModel(includeModelInfo: true)
       │
       ▼
Update thinkingEnabled + reset thinking based on new model's thinkingConfig
```

### Edge Cases

- **New session:** Defaults to `thinkingEnabled: false` until model info is fetched
- **Model without thinking support:** `thinkingEnabled: false`, `thinking: null`, button hidden
- **Model with thinking support:** `thinkingEnabled: true`, `thinking: 'low'`, button visible
