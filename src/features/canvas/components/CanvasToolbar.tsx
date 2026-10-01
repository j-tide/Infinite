import { LoaderCircle, Trash2 } from 'lucide-react';
import { useCanvasStore } from '../../../store';

export function CanvasToolbar() {
  const nodeCount = useCanvasStore(state => state.doc.nodes.length);
  const edgeCount = useCanvasStore(state => state.doc.edges.length);
  const selected = useCanvasStore(state => state.doc.nodes.some(node => node.selected) || state.doc.edges.some(edge => edge.selected));
  const activeTasks = useCanvasStore(state => state.doc.tasks.filter(task => task.status === 'queued' || task.status === 'running').length);
  const deleteSelection = useCanvasStore(state => state.deleteSelection);
  return (
      <div className="canvas-toolbar"><div className="canvas-crumb"><span className="live-dot" />自由创作<span className="canvas-count">{nodeCount} 个节点<span>·</span>{edgeCount} 条连接</span></div><div className="toolbar-right">{activeTasks > 0 && <span className="active-task"><LoaderCircle size={13} className="spinning" />{activeTasks} 个任务运行中</span>}{selected && <button className="selection-delete" aria-label="删除所选" onClick={deleteSelection}><Trash2 size={14} />删除所选</button>}<span className="toolbar-mock">Mock 模式</span></div></div>
  );
}
