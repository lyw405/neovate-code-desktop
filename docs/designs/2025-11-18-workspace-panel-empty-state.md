# Workspace Panel Empty State

**Date:** 2025-11-18

## Context

The current `WorkspacePanel` component displays a simple text message when no workspace is selected. This needs to be upgraded to use the polished `Empty` component from the UI library to provide better visual hierarchy and user guidance. Additionally, the empty state should be context-aware, showing different messages depending on whether the user has no repositories at all versus having repositories but no selected workspace.

## Discussion

### User Guidance Level
Three options were explored for what actions the empty state should guide users toward:
- Passive guidance (just prompt to select from sidebar)
- Active guidance with action buttons
- Educational + actionable approach

**Decision:** Chose passive guidance - simply prompting users to select an existing workspace from the sidebar, keeping the UI focused and simple.

### Context Awareness
Explored whether to differentiate between different scenarios:
- No differentiation (always same message)
- Different messages based on whether repos exist
- Keep it minimal with no decoration

**Decision:** Show context-aware messages:
- If no repos exist → "Add a repository first to get started"
- If repos exist but no workspace selected → "Select a workspace from the sidebar"

### Visual Style
Three presentation styles were considered:
- Minimal (icon + text using Empty component)
- Friendly with illustrations/graphics
- Match existing design patterns from other components

**Decision:** Minimal approach using `EmptyMedia` with `variant="icon"` + title + description.

### Implementation Approach
Three architectural approaches were evaluated:

1. **Pass repos data to WorkspacePanel** - Add repos prop so component can check state
2. **Check in MainLayout, pass a flag** - Parent determines state and passes type
3. **Compound component pattern** - Create WorkspacePanel.EmptyState

**Decision:** Approach 2 - MainLayout determines the empty state type and passes it as a prop, maintaining clean separation of concerns.

## Approach

The solution uses a prop-driven approach where `MainLayout` analyzes the application state (repos count and workspace selection) and passes an `emptyStateType` to `WorkspacePanel`. This keeps the logic centralized in the parent while allowing the child component to focus purely on rendering the appropriate UI.

The Empty component from the UI library provides consistent styling and layout, with context-specific content (icon, title, description) shown based on the empty state type.

## Architecture

### MainLayout Changes

Add logic to determine the empty state type:

```typescript
const emptyStateType = !workspace 
  ? (repos.length === 0 ? 'no-repos' : 'no-workspace')
  : null;
```

Pass the new prop to WorkspacePanel:

```typescript
<WorkspacePanel
  workspace={selectedWorkspace}
  emptyStateType={emptyStateType}
  onSendMessage={onSendMessage}
/>
```

### WorkspacePanel Changes

**Type Updates:**
- Add `emptyStateType: 'no-repos' | 'no-workspace' | null` to component props

**Imports:**
- Add Empty component imports: `Empty`, `EmptyMedia`, `EmptyHeader`, `EmptyTitle`, `EmptyDescription` from `@/components/ui/empty`

**Rendering:**
Replace the current simple empty div (lines 95-106) with the Empty component structure:

```tsx
<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      {/* Context-specific icon */}
    </EmptyMedia>
    <EmptyTitle>{/* Context-specific title */}</EmptyTitle>
    <EmptyDescription>{/* Context-specific description */}</EmptyDescription>
  </EmptyHeader>
</Empty>
```

**Content by State:**

**'no-repos' state:**
- Icon: FolderIcon (new component)
- Title: "No Repositories Yet"
- Description: "Add a repository to start working with workspaces and branches"

**'no-workspace' state:**
- Icon: BranchIcon (existing component)
- Title: "No Workspace Selected"
- Description: "Select a workspace from the sidebar to start coding"

**Icon Implementation:**
- Create a new `FolderIcon` component following the existing icon pattern
- Size: 16x16 to match existing icons
- Use `currentColor` for fill to respect theming
- Add to the icons section at the bottom of WorkspacePanel.tsx

**Styling:**
- Let the Empty component handle layout and spacing
- Use inline styles with CSS variables for colors (var(--text-primary), var(--text-secondary))
- Maintain consistency with existing theme system

### Data Flow

1. MainLayout receives repos and workspace state
2. MainLayout determines emptyStateType based on state
3. MainLayout passes emptyStateType to WorkspacePanel
4. WorkspacePanel renders appropriate Empty component content
5. If workspace exists, normal workspace view is shown (emptyStateType ignored)

### Edge Cases

- When workspace exists, emptyStateType is ignored and normal view is rendered
- Component remains fully controlled by parent state
- No internal state changes needed in WorkspacePanel for empty state logic

### Files to Modify

1. `src/renderer/components/MainLayout.tsx` - Add empty state determination logic
2. `src/renderer/components/WorkspacePanel.tsx` - Add Empty component and conditional rendering

