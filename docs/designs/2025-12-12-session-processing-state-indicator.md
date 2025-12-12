# Session Processing State Indicator in Sidebar

**Date:** 2025-12-12

## Context

The sidebar currently displays session items with a static Comment01Icon and relative timestamp. Users need visual feedback when a session is actively processing a request or has encountered an error. The store already tracks session processing state (`sessionProcessing[sessionId]`) with statuses: `idle`, `processing`, and `failed`.

## Discussion

**Initial Question:** Where should the loading indicator appear?
- Options considered: session row, workspace row, or both
- Decision: Show on the session row itself for direct, per-session feedback

**Icon Placement Approaches:**
- Replace timestamp with spinner (minimal)
- Add spinner before session icon (informative)
- Add spinner after session name (clear hierarchy)
- **Selected:** Replace the session icon (Comment01Icon) with a Spinner component

**Error State Enhancement:**
- When a session fails, the session name text color should turn red to indicate the error state
- Failed sessions show the normal Comment01Icon (not the spinner)

## Approach

Replace the session icon with a spinner during processing and change the session name color to red on error. This provides clear, inline visual feedback without disrupting the sidebar layout.

**Visual States:**
- **Idle**: Comment01Icon, normal text color (var(--text-tertiary) or var(--text-primary) when selected)
- **Processing**: Spinner component (animated), normal text color
- **Failed**: Comment01Icon, red text color (#ef4444)

## Architecture

### Components Modified
- `src/renderer/components/RepoSidebar.tsx`

### Data Flow
```
store.sessionProcessing[sessionId].status → RepoSidebar session row → Conditional rendering
```

### Implementation Details

**Store Integration:**
- Use existing `getSessionProcessing` selector from store
- No store modifications required - infrastructure already exists

**RepoSidebar Changes:**
1. Import `Spinner` component from `./ui/spinner`
2. Import `getSessionProcessing` from store
3. For each session row in the session list map:
   - Call `getSessionProcessing(session.sessionId)` to get processing state
   - Check `status` field

**Conditional Icon Rendering:**
```tsx
const processing = getSessionProcessing(session.sessionId);
const isProcessing = processing.status === 'processing';

<HugeiconsIcon
  icon={isProcessing ? null : Comment01Icon}
  size={14}
  strokeWidth={1.5}
/>
{isProcessing && <Spinner className="size-3.5" />}
```

**Conditional Text Color:**
```tsx
const isFailed = processing.status === 'failed';
const textColor = isFailed 
  ? '#ef4444' 
  : (isSessionSelected ? 'var(--text-primary)' : 'var(--text-tertiary)');
```

### Technical Notes
- `Spinner` component is already implemented using Lucide's `Loader2Icon` with CSS animation
- Processing state updates happen automatically through store's `setSessionProcessing` calls during message sending
- No changes needed to `store.tsx` - all necessary state management already exists
