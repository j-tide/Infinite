import { Minus, MousePointer2, Plus, Scan } from 'lucide-react';
import { useCanvasControls } from '../hooks/useCanvasControls';

export function CanvasControls() {
  const { zoom, hasNodes, zoomIn, zoomOut, fitView } = useCanvasControls();
  return (
        <div className="canvas-controls"><span className="cursor-mode" title="拖动空白平移"><MousePointer2 size={18} /></span><span className="control-divider" /><button aria-label="缩小画布" title="缩小" onClick={zoomOut}><Minus size={17} /></button><span className="zoom-value">{zoom}%</span><button aria-label="放大画布" title="放大" onClick={zoomIn}><Plus size={17} /></button><span className="control-divider" /><button aria-label="适配画布" title="适配画布" disabled={!hasNodes} onClick={fitView}><Scan size={18} /></button></div>
  );
}
