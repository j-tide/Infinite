import { LoaderCircle, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { useCanvasStore } from '../store/canvasStore';

export function CanvasToolbar() {
  const nodeCount = useCanvasStore((state) => state.doc.nodes.length);
  const edgeCount = useCanvasStore((state) => state.doc.edges.length);
  const selected = useCanvasStore(
    (state) =>
      state.doc.nodes.some((node) => node.selected) ||
      state.doc.edges.some((edge) => edge.selected),
  );
  const activeTasks = useCanvasStore(
    (state) =>
      state.doc.tasks.filter(
        (task) => task.status === 'queued' || task.status === 'running',
      ).length,
  );
  const deleteSelection = useCanvasStore((state) => state.deleteSelection);
  return (
    <div className="flex h-13.5 shrink-0 items-center justify-between border-b border-toolbar-border bg-toolbar px-6.25 narrow:px-3.25">
      <div className="flex items-center gap-2.25 text-[11px] text-canvas-label">
        <span className="inline-block size-1.25 shrink-0 rounded-full bg-positive" />
        自由创作
        <span className="ml-2.5 flex gap-2.25 text-[10px] text-canvas-count narrow:hidden">
          {nodeCount} 个节点<span>·</span>
          {edgeCount} 条连接
        </span>
      </div>
      <div className="flex items-center gap-3.5">
        {activeTasks > 0 && (
          <span className="flex items-center gap-1.5 text-[10px] text-task-active">
            <LoaderCircle size={13} className="animate-spinning" />
            {activeTasks} 个任务运行中
          </span>
        )}
        {selected && (
          <Button
            variant="danger"
            size="compact"
            aria-label="删除所选"
            onClick={deleteSelection}
          >
            <Trash2 size={14} />
            删除所选
          </Button>
        )}
        <span className="rounded-badge border border-mock-border px-1.75 py-0.75 text-[9px] text-mock-text narrow:hidden">
          Mock 模式
        </span>
      </div>
    </div>
  );
}
