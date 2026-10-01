import { useRef } from 'react';
import { useReactFlow, type Edge } from '@xyflow/react';
import { useShallow } from 'zustand/react/shallow';
import { SAMPLE_ASSETS } from '../constants';
import type { CanvasNode, NodeKind } from '../types';
import { useCanvasStore } from '../store/canvasStore';
import { findNodePlacement } from '../utils/placement';

export interface CanvasCreationActions {
  addImage(sampleId?: string): void;
  addPrompt(): void;
  addGenerator(): void;
}

export function useCanvasCreation() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const flow = useReactFlow<CanvasNode, Edge>();
  const actions = useCanvasStore(useShallow(state => ({
    addImage: state.addImage,
    addPrompt: state.addPrompt,
    addGenerator: state.addGenerator,
  })));

  function placement(kind: NodeKind) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const initial = flow.screenToFlowPosition({
      x: rect.left + (kind === 'generator' ? Math.min(430, rect.width * .49) : 60),
      y: rect.top + (kind === 'prompt' ? Math.min(420, rect.height * .55) : 110),
    });
    return findNodePlacement(useCanvasStore.getState().doc.nodes, kind, initial);
  }

  return {
    canvasRef,
    addImage: (sampleId = SAMPLE_ASSETS[0].id) => { actions.addImage(sampleId, placement('image')); },
    addPrompt: () => { actions.addPrompt(placement('prompt')); },
    addGenerator: () => { actions.addGenerator(placement('generator')); },
  };
}
