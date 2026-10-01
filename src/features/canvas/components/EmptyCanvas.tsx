import { ArrowRight, ChevronRight, Plus, Sparkles, Type } from 'lucide-react';
import { SAMPLE_ASSETS } from '../../../domain';
import { useCanvasStore } from '../../../store';

export function EmptyCanvas({ onAddPrompt }: { onAddPrompt(): void }) {
  const isEmpty = useCanvasStore(state => state.doc.nodes.length === 0);
  if (!isEmpty) return null;
  return (
        <div className="empty-canvas">
          <div className="empty-illustration" aria-hidden="true"><div className="illustration-orbit" /><div className="mini-card mini-image"><img src={SAMPLE_ASSETS[0].src} alt="" /><div><span /><span /></div></div><div className="mini-connector" /><div className="mini-card mini-prompt"><Type size={16} /><span /><span /><span /></div><div className="mini-spark"><Sparkles size={27} /></div><span className="orbit-point one" /><span className="orbit-point two" /></div>
          <span className="empty-eyebrow">A SPACE FOR YOUR NEXT IDEA</span><h1>让想象，<span>无限延伸</span></h1><p>放入图片，写下灵感。<br />连接它们，让下一次创作在这里发生。</p><button className="empty-action" onClick={onAddPrompt}><Plus size={17} />添加第一条提示词<ArrowRight size={16} /></button><div className="empty-flow"><span>添加节点</span><ChevronRight size={12} /><span>连接输入</span><ChevronRight size={12} /><span>开始创作</span></div>
        </div>
  );
}
