import { useState } from 'react';
import { WorkspaceLayout } from '../../components/layout/WorkspaceLayout';
import { CanvasWorkspace } from '../../features/canvas/components/CanvasWorkspace';
import { EmptyCanvas } from '../../features/canvas/components/EmptyCanvas';
import { useCanvasCreation } from '../../features/canvas/hooks/useCanvasCreation';
import { HelpPanel } from '../../features/workspace/components/HelpPanel';
import { NoticeToast } from '../../features/workspace/components/NoticeToast';
import { StorageErrorBanner } from '../../features/workspace/components/StorageErrorBanner';
import { WorkspaceHeader } from '../../features/workspace/components/WorkspaceHeader';
import { WorkspaceSidebar } from '../../features/workspace/components/WorkspaceSidebar';

export function WorkspacePage() {
  const creation = useCanvasCreation();
  const [helpOpen, setHelpOpen] = useState(false);
  const toggleHelp = () => setHelpOpen((open) => !open);
  const closeHelp = () => setHelpOpen(false);

  return (
    <WorkspaceLayout>
      <WorkspaceHeader helpOpen={helpOpen} onToggleHelp={toggleHelp} />
      <WorkspaceSidebar creation={creation} />
      <CanvasWorkspace
        canvasRef={creation.canvasRef}
        emptyState={<EmptyCanvas onAddPrompt={creation.addPrompt} />}
      >
        <HelpPanel open={helpOpen} onClose={closeHelp} />
        <NoticeToast />
      </CanvasWorkspace>
      <StorageErrorBanner />
    </WorkspaceLayout>
  );
}
