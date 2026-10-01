import { Layers3, Sparkles } from 'lucide-react';
import type { CanvasCreationActions } from '../../canvas/hooks/useCanvasCreation';
import { CreationTools } from './CreationTools';
import { SampleLibrary } from './SampleLibrary';

export function WorkspaceSidebar({
  creation,
}: {
  creation: CanvasCreationActions;
}) {
  return (
    <aside className="flex min-h-0 flex-col border-r border-border bg-sidebar px-4.5 pt-6.25 compact:px-3.5 narrow:px-2.5 narrow:pt-4.5">
      <div className="mx-1.25 mb-3.75 flex items-center justify-between text-[9px] tracking-[1.8px] text-sidebar-caption">
        <span>WORKSPACE</span>
        <span className="rounded-badge border border-version-border bg-version px-1.25 py-0.5 text-[9px] tracking-normal text-version-text">
          P0
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-[8px] border border-workspace-active-border bg-workspace-active p-3 text-[12px] text-workspace-active-text">
        <Layers3 size={17} />
        <span>无限画布</span>
        <span className="ml-auto size-1.25 rounded-full bg-accent" />
      </div>
      <div className="mx-1.25 mb-3.25 mt-6.75 flex justify-between text-[12px] text-section-text">
        <span>创作工具</span>
        <span className="text-[10px] text-section-muted">添加到画布</span>
      </div>
      <CreationTools creation={creation} />
      <div className="mt-6 h-px bg-sidebar-rule" />
      <div className="mx-1.25 mb-3.25 mt-5.75 flex justify-between text-[12px] text-section-text">
        <span>灵感素材</span>
        <span className="text-[10px] text-section-muted">内置示例</span>
      </div>
      <SampleLibrary onAddImage={creation.addImage} />
      <div className="min-h-4.5 flex-1" />
      <div className="relative mb-6 rounded-panel border border-note-border bg-[linear-gradient(130deg,var(--color-note-start),var(--color-note-end))] px-3.5 pb-3.75 pt-4.5 narrow:px-2.25 narrow:py-3.25">
        <span className="absolute right-3.5 top-4.5 text-note-icon narrow:hidden">
          <Sparkles size={16} />
        </span>
        <strong className="text-[12px] font-medium text-note-heading narrow:text-[10px]">
          让灵感，自由生长。
        </strong>
        <p className="mb-4.25 mt-2.25 text-[10px] leading-[1.8] text-note-text">
          图片、文字与想象力，
          <br />
          都能在这里找到连接。
        </p>
        <span className="flex items-center gap-1.5 text-[8px] tracking-[1px] text-note-tag">
          <span className="size-1.25 rounded-full bg-note-tag" />
          MOCK 创作演示
        </span>
      </div>
      <div className="-mx-4.5 flex items-center justify-between border-t border-sidebar-footer-border px-5.75 py-3.5 text-[8px] tracking-[1px] text-sidebar-footer-text narrow:-mx-2.5 narrow:p-3">
        <span>INFINITE CANVAS</span>
        <span>v0.1</span>
      </div>
    </aside>
  );
}
