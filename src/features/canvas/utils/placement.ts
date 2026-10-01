import type { XYPosition } from '@xyflow/react';
import type { CanvasNode, NodeKind } from '../types';

/** Find free space in world coordinates without changing the existing placement rules. */
export function findNodePlacement(nodes: CanvasNode[], kind: NodeKind, initial: XYPosition): XYPosition {
  const position = { ...initial };
  const width = kind === 'generator' ? 320 : 280;
  const height = kind === 'generator' ? 490 : kind === 'prompt' ? 250 : 340;

  for (let attempt = 0; attempt < 100; attempt++) {
    const occupied = nodes.some(node => {
      const otherWidth = node.measured?.width ?? (node.type === 'generator' ? 320 : 280);
      const otherHeight = node.measured?.height ?? (node.type === 'generator' ? 490 : 340);
      return position.x < node.position.x + otherWidth + 28 && position.x + width + 28 > node.position.x
        && position.y < node.position.y + otherHeight + 28 && position.y + height + 28 > node.position.y;
    });
    if (!occupied) return position;
    position.y += 80;
  }
  return position;
}
