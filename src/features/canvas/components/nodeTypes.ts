import type { ComponentType } from 'react';
import type { NodeProps } from '@xyflow/react';
import type { CanvasNode, NodeKind } from '../types';
import { GeneratorNode } from './nodes/GeneratorNode';
import { ImageNode } from './nodes/ImageNode';
import { PromptNode } from './nodes/PromptNode';

export const nodeTypes = {
  image: ImageNode,
  prompt: PromptNode,
  generator: GeneratorNode,
} satisfies Record<NodeKind, ComponentType<NodeProps<CanvasNode>>>;
