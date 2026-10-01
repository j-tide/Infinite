import {
  Check,
  ChevronRight,
  CircleHelp,
  Infinity as InfinityIcon,
  LoaderCircle,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';
import { useCanvasStore } from '../../canvas/store/canvasStore';

interface WorkspaceHeaderProps {
  helpOpen: boolean;
  onToggleHelp(): void;
}

export function WorkspaceHeader({
  helpOpen,
  onToggleHelp,
}: WorkspaceHeaderProps) {
  const saveStatus = useCanvasStore((state) => state.saveStatus);
  return (
    <header className="col-span-full z-10 flex items-center gap-5.5 border-b border-border bg-header px-6.5 compact:gap-3.75 narrow:gap-2.75 narrow:px-3.5">
      <a
        className="flex w-51 items-center gap-2.75 text-[26px] font-bold tracking-[-1px] compact:w-43 narrow:w-32.75 narrow:text-[22px]"
        href="/"
        aria-label="Infinite 首页"
      >
        <span className="grid size-9 place-items-center rounded-[11px] bg-accent text-brand-ink narrow:size-7.25">
          <InfinityIcon size={27} strokeWidth={2.4} />
        </span>
        <span>
          infinite<span className="text-accent">.</span>
        </span>
      </a>
      <div className="h-5.5 w-px bg-separator narrow:hidden" />
      <div className="flex items-center gap-3 whitespace-nowrap text-[13px] narrow:gap-0.75 narrow:text-[11px]">
        <span>灵感实验室</span>
        <ChevronRight size={14} className="text-icon-muted" />
        <span className="text-muted narrow:hidden">创作画布</span>
      </div>
      <span className="rounded-[5px] border border-badge-border px-1.75 py-0.75 text-[10px] tracking-[0.5px] text-badge-text compact:hidden">
        本地项目
      </span>
      <div className="ml-auto flex items-center gap-5.5 compact:gap-3 narrow:gap-2.5">
        <span
          data-testid="save-status"
          className={cn(
            'flex items-center gap-1.75 whitespace-nowrap text-[11px] narrow:text-[9px]',
            saveStatus === 'error' ? 'text-error' : 'text-save-text',
          )}
          role="status"
        >
          {saveStatus === 'saved' ? (
            <Check size={14} className="text-save-positive" />
          ) : saveStatus === 'saving' ? (
            <LoaderCircle size={14} className="animate-spinning" />
          ) : (
            <span className="size-1.5 rounded-full bg-error" />
          )}
          {saveStatus === 'saved'
            ? '已保存'
            : saveStatus === 'saving'
              ? '保存中'
              : '保存失败'}
        </span>
        <Button
          variant="secondary"
          size="xs"
          className={helpOpen ? 'bg-panel-hover!' : undefined}
          onClick={onToggleHelp}
          aria-label="操作指南"
        >
          <CircleHelp size={16} />
          <span className="narrow:hidden">操作指南</span>
        </Button>
        <span className="grid size-7.25 place-items-center rounded-full border border-avatar-border bg-avatar text-[12px] font-semibold text-avatar-text narrow:hidden">
          I
        </span>
      </div>
    </header>
  );
}
