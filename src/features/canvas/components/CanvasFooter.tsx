import { ArrowDownRight, Command } from 'lucide-react';

export function CanvasInstructions() {
  return (
    <div className="pointer-events-none absolute bottom-3.5 right-4.75 flex items-center gap-1.75 text-[9px] text-instruction compact:bottom-2 compact:left-4.5 compact:right-auto compact:text-[8px] narrow:hidden">
      <Command size={12} />
      <span>拖动空白平移</span>
      <span>·</span>
      <span>滚轮缩放</span>
      <span>·</span>
      <span>拖动端口连接</span>
    </div>
  );
}

export function CanvasFooter() {
  return (
    <footer className="flex h-7.5 shrink-0 items-center justify-between border-t border-footer-border px-5.75 text-[8px] text-footer-text narrow:px-2.5 narrow:text-[7px]">
      <span className="flex items-center gap-1.75">
        <span className="inline-block size-1 shrink-0 rounded-full bg-footer-positive" />{' '}
        所有图片资源均保存在项目内
      </span>
      <span className="flex items-center gap-1.75 narrow:hidden">
        连接你的灵感
        <ArrowDownRight size={12} />
      </span>
    </footer>
  );
}
