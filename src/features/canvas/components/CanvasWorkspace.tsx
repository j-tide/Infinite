import type { PropsWithChildren, ReactNode, RefObject } from 'react';
import { CanvasControls } from './CanvasControls';
import { CanvasFooter, CanvasInstructions } from './CanvasFooter';
import { CanvasSurface } from './CanvasSurface';
import { CanvasToolbar } from './CanvasToolbar';

interface CanvasWorkspaceProps extends PropsWithChildren {
  canvasRef: RefObject<HTMLDivElement | null>;
  emptyState: ReactNode;
}

export function CanvasWorkspace({ canvasRef, emptyState, children }: CanvasWorkspaceProps) {
  return <main className="canvas-workspace">
    <CanvasToolbar />
    <CanvasSurface canvasRef={canvasRef}>
      {emptyState}
      <CanvasControls />
      <CanvasInstructions />
      {children}
    </CanvasSurface>
    <CanvasFooter />
  </main>;
}
