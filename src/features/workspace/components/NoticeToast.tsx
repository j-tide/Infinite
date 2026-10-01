import { CircleHelp, X } from 'lucide-react';
import { IconButton } from '../../../components/ui/IconButton';
import { useCanvasStore } from '../../canvas/store/canvasStore';

export function NoticeToast() {
  const notice = useCanvasStore((state) => state.notice);
  const clearNotice = useCanvasStore((state) => state.clearNotice);
  if (!notice) return null;
  return (
    <div
      className="absolute left-1/2 top-3.75 z-30 flex max-w-[85%] -translate-x-1/2 items-center gap-2.5 rounded-[8px] border border-notice-border bg-notice px-3.75 py-3 text-[11px] text-notice-text shadow-notice"
      role="alert"
    >
      <CircleHelp size={16} />
      <span>{notice}</span>
      <IconButton
        size="xs"
        className="ml-2 text-close-icon"
        label="关闭提示"
        onClick={clearNotice}
      >
        <X size={14} />
      </IconButton>
    </div>
  );
}
