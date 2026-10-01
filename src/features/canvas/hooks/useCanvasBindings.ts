import type { Connection, Edge } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { isValidConnection } from '../../../domain';
import { useCanvasStore } from '../../../store';

export function useCanvasBindings() {
  const doc = useCanvasStore(state => state.doc);
  const actions = useCanvasStore(useShallow(state => ({
    onNodesChange: state.onNodesChange,
    onEdgesChange: state.onEdgesChange,
    connect: state.connect,
    setViewport: state.setViewport,
  })));

  function clearSelection() {
    actions.onNodesChange(doc.nodes.filter(node => node.selected).map(node => ({ id: node.id, type: 'select', selected: false })));
    actions.onEdgesChange(doc.edges.filter(edge => edge.selected).map(edge => ({ id: edge.id, type: 'select', selected: false })));
  }

  return { doc, actions, clearSelection, validateConnection: (connection: Connection | Edge) => isValidConnection(doc, connection) };
}
