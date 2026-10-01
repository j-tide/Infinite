import type { PropsWithChildren, RefObject } from 'react';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  type Edge,
} from '@xyflow/react';
import type { CanvasNode } from '../types';
import { nodeTypes } from '../../../components/CanvasNodes';
import { useCanvasBindings } from '../hooks/useCanvasBindings';

interface CanvasSurfaceProps extends PropsWithChildren {
  canvasRef: RefObject<HTMLDivElement | null>;
}

export function CanvasSurface({ canvasRef, children }: CanvasSurfaceProps) {
  const { doc, actions, validateConnection, clearSelection } =
    useCanvasBindings();
  return (
    <div
      ref={canvasRef}
      className="relative isolate min-h-0 flex-1"
      data-testid="canvas-surface"
    >
      <ReactFlow<CanvasNode, Edge>
        nodes={doc.nodes}
        edges={doc.edges}
        nodeTypes={nodeTypes}
        onNodesChange={actions.onNodesChange}
        onEdgesChange={actions.onEdgesChange}
        onConnect={actions.connect}
        isValidConnection={validateConnection}
        viewport={doc.viewport}
        onViewportChange={actions.setViewport}
        minZoom={0.25}
        maxZoom={2}
        panOnDrag={[0, 1, 2]}
        zoomOnScroll
        panOnScroll={false}
        zoomOnDoubleClick={false}
        nodeDragThreshold={0}
        selectionOnDrag={false}
        selectionKeyCode={null}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={null}
        defaultEdgeOptions={{
          type: 'default',
          style: { stroke: 'var(--color-edge)', strokeWidth: 2 },
          interactionWidth: 22,
        }}
        onPaneClick={clearSelection}
        colorMode="dark"
        aria-label="无限创作画布"
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="var(--color-canvas-grid)"
          gap={24}
          size={1}
        />
      </ReactFlow>
      {children}
    </div>
  );
}
