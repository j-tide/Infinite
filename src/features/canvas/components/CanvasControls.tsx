import { Minus, MousePointer2, Plus, Scan } from 'lucide-react';
import type { ComponentProps } from 'react';
import { IconButton } from '../../../components/ui/IconButton';
import { useCanvasControls } from '../hooks/useCanvasControls';

function ControlButton(props: ComponentProps<typeof IconButton>) {
  return (
    <IconButton
      size="canvas"
      className="text-controls-text hover:bg-controls-hover hover:text-controls-hover-text"
      {...props}
    />
  );
}

export function CanvasControls() {
  const { zoom, hasNodes, zoomIn, zoomOut, fitView } = useCanvasControls();
  return (
    <div className="absolute bottom-7 left-1/2 z-5 flex -translate-x-1/2 items-center gap-1.5 rounded-control border border-controls-border bg-controls px-2.25 py-1.75 shadow-controls backdrop-blur-[12px]">
      <span
        className="grid h-7.25 w-7.5 place-items-center rounded-field bg-cursor-active text-cursor-active-text"
        title="拖动空白平移"
      >
        <MousePointer2 size={18} />
      </span>
      <span className="mx-0.75 h-4.5 w-px bg-control-divider" />
      <ControlButton label="缩小画布" title="缩小" onClick={zoomOut}>
        <Minus size={17} />
      </ControlButton>
      <span className="w-8.75 select-none text-center text-[10px] text-zoom-text">
        {zoom}%
      </span>
      <ControlButton label="放大画布" title="放大" onClick={zoomIn}>
        <Plus size={17} />
      </ControlButton>
      <span className="mx-0.75 h-4.5 w-px bg-control-divider" />
      <ControlButton
        label="适配画布"
        title="适配画布"
        disabled={!hasNodes}
        onClick={fitView}
      >
        <Scan size={18} />
      </ControlButton>
    </div>
  );
}
