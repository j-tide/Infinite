import { ArrowDownRight, Command } from 'lucide-react';

export function CanvasInstructions() {
  return (
        <div className="canvas-instruction"><Command size={12} /><span>拖动空白平移</span><span>·</span><span>滚轮缩放</span><span>·</span><span>拖动端口连接</span></div>
  );
}

export function CanvasFooter() {
  return (
      <footer className="canvas-footer"><span><span className="live-dot" /> 所有图片资源均保存在项目内</span><span>连接你的灵感<ArrowDownRight size={12} /></span></footer>
  );
}
