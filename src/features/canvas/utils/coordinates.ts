import type { Viewport, XYPosition } from '@xyflow/react'

export function screenToWorld(position: XYPosition, viewport: Viewport): XYPosition {
  return { x: (position.x - viewport.x) / viewport.zoom, y: (position.y - viewport.y) / viewport.zoom }
}
