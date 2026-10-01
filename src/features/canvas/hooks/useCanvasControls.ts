import { useReactFlow, type Edge } from '@xyflow/react';
import type { CanvasNode } from '../../../domain';
import { useCanvasStore } from '../../../store';

export function useCanvasControls() {
  const flow = useReactFlow<CanvasNode, Edge>();
  const zoom = useCanvasStore(state => Math.round(state.doc.viewport.zoom * 100));
  const hasNodes = useCanvasStore(state => state.doc.nodes.length > 0);

  return {
    zoom,
    hasNodes,
    zoomIn: () => { void flow.zoomIn({ duration: 150 }); },
    zoomOut: () => { void flow.zoomOut({ duration: 150 }); },
    fitView: () => { void flow.fitView({ padding: .16, maxZoom: 1, duration: 250 }); },
  };
}
