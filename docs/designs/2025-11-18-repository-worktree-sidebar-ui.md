# Repository Worktree Sidebar UI

**Date:** 2025-11-18

## Context

The RepoSidebar component needs to be redesigned to better support git worktree management. The current implementation uses a basic folder tree with manual expand/collapse logic. The goal is to create a more intuitive interface that:

- Shows repositories with their associated worktrees (implemented via git worktree)
- Displays git state information (branch name, changes count) for each worktree
- Provides repository management features (view info, delete)
- Uses a modern accordion-based UI with flat styling and professional icons

The hierarchy is: **Repository** → **Worktrees** (where 1 repo = n worktrees, each worktree represents a different git branch)

## Discussion

### Data Model Clarification
- Repository = a git repo at a specific path
- Workspace = git worktree implementation (separate working directory for different branches)
- Relationship: One repository contains multiple worktrees
- Data source: Zustand store with `repositories` and `workspaces` from store.tsx

### UI Requirements
1. **Default expand**: All repositories should be expanded by default to show their worktrees
2. **New workspace positioning**: "New workspace" button should appear at the TOP of each repo's worktree list (not bottom)
3. **Repository info dialog**: Clicking the repository header should open a dialog showing:
   - Repository name and path
   - Current branch and remote URL
   - Last commit information
   - Repository size
   - Creation date
   - Delete button
4. **Flat visual style**: Remove heavy borders/shadows, use HugeIcons library consistently

### Worktree Display Format
Each worktree item shows:
- Branch name
- Changes count (e.g., "main • 5 changes")
- Git branch icon from HugeIcons

### New Workspace Creation
Quick create pattern: Clicking "New Workspace" immediately creates a worktree with auto-generated name/path (no configuration dialog)

## Approach

**Selected: Accordion-Based Architecture (Approach A)**

Replace the manual expand/collapse implementation with `@base-ui-components/react/accordion` for better accessibility and cleaner state management. This approach provides:

- Familiar accordion pattern with built-in animations
- Simple state management (default expanded state)
- Consistent with existing UI component library
- Easy to maintain and extend

### UI Components Used
- **Accordion**: `@base-ui-components/react/accordion` for repo expand/collapse
- **Dialog**: `@base-ui-components/react/dialog` for repository info modal
- **Icons**: `@hugeicons/react` with `@hugeicons/core-free-icons`
- **Badges**: Custom badge components for counts

## Architecture

### Component Structure

```
RepoSidebar
├─ Header ("Repositories" title)
├─ Accordion (defaultValue=[all repo paths])
│   └─ AccordionItem (per repository)
│       ├─ AccordionTrigger
│       │   └─ RepoHeader (with info button)
│       │       ├─ FolderIcon
│       │       ├─ Repository name
│       │       ├─ Worktree count badge
│       │       └─ Info button (opens dialog)
│       └─ AccordionPanel
│           ├─ NewWorkspace (positioned at TOP)
│           └─ WorkspaceList
│               └─ WorkspaceItem
│                   ├─ GitBranchIcon
│                   ├─ Branch name
│                   └─ Changes count badge
└─ Footer (add repo, settings)

Dialog (Repository Info)
├─ DialogHeader (title + repo name)
├─ DialogContent
│   ├─ InfoRow (Path with FolderIcon)
│   ├─ InfoRow (Current Branch with GitBranchIcon)
│   ├─ InfoRow (Remote URL with CloudIcon)
│   ├─ InfoRow (Last Commit with ClockIcon)
│   ├─ InfoRow (Size with DatabaseIcon)
│   └─ InfoRow (Created with CalendarIcon)
└─ DialogFooter
    ├─ Cancel button
    └─ Delete button (with DeleteIcon)
```

### Data Flow

**State Management:**
```tsx
// Accordion state - default all expanded
const defaultOpenRepos = repos.map(repo => repo.path);

// Dialog state
const [dialogOpen, setDialogOpen] = useState(false);
const [selectedRepo, setSelectedRepo] = useState<RepoData | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

// Derived data
const getWorkspacesForRepo = (repoId: string) => 
  workspaces.filter(ws => ws.repositoryId === repoId);

const getChangesCount = (workspaceId: string) => {
  const workspace = workspaces.find(ws => ws.id === workspaceId);
  return workspace?.gitState.pendingChanges.length || 0;
};
```

**Data Source:**
```tsx
// From Zustand store
const repositories = useSessionStore(state => state.repositories);
const workspaces = useSessionStore(state => state.workspaces);
```

### Key Interactions

1. **Accordion Toggle**: AccordionTrigger expands/collapses worktree list
2. **Info Button**: Separate info icon button within trigger opens repo dialog using `event.stopPropagation()` to prevent accordion toggle
3. **New Workspace**: Top button auto-creates worktree with generated config, calls backend API
4. **Delete Repository**: Shows confirmation, calls Zustand action, closes dialog on success

### Styling Approach

**Flat Visual Design:**
- Minimal borders: `border-bottom: '1px solid var(--border-subtle)'`
- Subtle backgrounds for hierarchy differentiation
- Clean hover states: `hover:bg-[var(--bg-base)]`
- Consistent spacing: Repo items `py-3 px-4`, Worktree items `py-2 px-6` (indented)

**Color Scheme:**
```tsx
// Repository items
backgroundColor: 'var(--bg-surface)'

// Badges
changes count: bg-amber-100 text-amber-800
worktree count: bg-blue-100 text-blue-800
```

**HugeIcons Usage:**
- `FolderIcon` - repositories
- `GitBranchIcon` - worktrees
- `PlusSignIcon` - new workspace button
- `DeleteIcon` - delete action in dialog
- `CloudIcon`, `ClockIcon`, `DatabaseIcon`, `CalendarIcon` - repo info details

### Error Handling

- **New Workspace Creation**: Toast notification on failure, spinner during creation
- **Delete Repository**: Disable button during deletion (`isDeleting` state), show error toast if fails
- **Missing Data**: Empty state component if no repositories exist
- **Git Info Loading**: Skeleton/loading state for repo details in dialog

### Implementation Notes

1. **Replace expandedFolders state**: Use Accordion's `defaultValue` prop instead of manual Set-based state
2. **Event handling**: Use `stopPropagation()` on info button to prevent accordion toggle when opening dialog
3. **Icon migration**: Replace all inline SVG components with HugeIcons imports
4. **Worktree order**: Render `NewWorkspace` component BEFORE mapping over workspace items
5. **Dialog data**: Fetch additional repo metadata (last commit, size, creation date) when opening dialog - may require new store selectors or API calls
