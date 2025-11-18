// @ts-nocheck
import { useStore } from './store';
import { Button } from './components/ui/button';

const TestComponent = () => {
  const {
    selectedRepoPath,
    selectedWorkspaceId,
    selectedSessionId,
    selectRepo,
    selectWorkspace,
    selectSession,
  } = useStore();

  const handleClearSelections = () => {
    selectRepo(null);
    selectWorkspace(null);
    selectSession(null);
    console.log('Cleared all selections');
  };

  return (
    <div
      style={{
        padding: '16px',
        borderTop: '2px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>
        Test Controls
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Button onClick={handleClearSelections} variant="outline" size="sm">
          Clear All Selections
        </Button>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Repo: {selectedRepoPath || 'none'} | Workspace:{' '}
          {selectedWorkspaceId || 'none'} | Session:{' '}
          {selectedSessionId || 'none'}
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
