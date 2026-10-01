import { CircleHelp, X } from 'lucide-react';
import { useCanvasStore } from '../../canvas/store/canvasStore';

export function NoticeToast() {
  const notice = useCanvasStore(state => state.notice);
  const clearNotice = useCanvasStore(state => state.clearNotice);
  if (!notice) return null;
  return (
        <div className="notice-toast" role="alert"><CircleHelp size={16} /><span>{notice}</span><button aria-label="关闭提示" onClick={clearNotice}><X size={14} /></button></div>
  );
}
