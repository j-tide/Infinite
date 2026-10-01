import { ArrowRight, ChevronRight, Plus, Sparkles, Type } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { SAMPLE_ASSETS } from '../constants';
import { useCanvasStore } from '../store/canvasStore';

export function EmptyCanvas({ onAddPrompt }: { onAddPrompt(): void }) {
  const isEmpty = useCanvasStore((state) => state.doc.nodes.length === 0);
  if (!isEmpty) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-[47%] w-100 max-w-[80%] -translate-x-1/2 -translate-y-1/2 text-center narrow:w-75">
      <div
        className="relative mx-auto mb-8 h-43.75 w-63.75 narrow:mb-2.5 narrow:scale-85"
        aria-hidden="true"
      >
        <div className="absolute -inset-y-7 inset-x-1 rotate-[-25deg] rounded-[50%] border border-orbit-border" />
        <div className="absolute rounded-[8px] border border-illustration-border bg-illustration-card shadow-illustration left-2.5 top-5.75 h-28 w-31.5 rotate-[-10deg] p-1.5">
          <img
            src={SAMPLE_ASSETS[0].src}
            alt=""
            className="h-19.5 w-full rounded-badge object-cover"
          />
          <div className="mt-2.25 flex gap-1.25">
            <span className="h-0.75 w-7.25 rounded-[3px] bg-illustration-line" />
            <span className="h-0.75 w-3.5 rounded-[3px] bg-illustration-short-line" />
          </div>
        </div>
        <div className="absolute left-29.75 top-12.5 h-14.5 w-18.5 rounded-tr-[35px] border border-dashed border-connector border-b-0 border-l-0" />
        <div className="absolute rounded-[8px] border border-illustration-border bg-illustration-card shadow-illustration right-1.5 top-12.75 h-20.5 w-28.5 rotate-[9deg] p-3.25 text-left">
          <Type size={16} className="mb-2 text-illustration-prompt-icon" />
          <span className="mb-1.5 block h-0.75 w-18.75 rounded-[3px] bg-illustration-prompt-line" />
          <span className="mb-1.5 block h-0.75 w-15.25 rounded-[3px] bg-illustration-prompt-line" />
          <span className="mb-1.5 block h-0.75 w-9.75 rounded-[3px] bg-illustration-prompt-muted" />
        </div>
        <div className="absolute left-27.75 top-27.25 grid size-11 rotate-[-8deg] place-items-center rounded-[12px] border border-spark-border bg-[linear-gradient(135deg,var(--color-spark-start),var(--color-spark-end))] text-spark-ink shadow-spark">
          <Sparkles size={27} />
        </div>
        <span className="absolute size-1.25 rounded-full bg-orbit-point right-1.75 top-3" />
        <span className="absolute size-1.25 rounded-full bg-orbit-point bottom-0.25 left-10 bg-orbit-point-alt!" />
      </div>
      <span className="text-[8px] tracking-[2px] text-empty-eyebrow">
        A SPACE FOR YOUR NEXT IDEA
      </span>
      <h1 className="mb-4.25 mt-3.5 text-[28px] font-medium tracking-[1px] text-empty-heading compact:text-[25px] narrow:text-[21px]">
        让想象，<span className="text-empty-accent">无限延伸</span>
      </h1>
      <p className="mb-6.25 mt-0 text-[12px] leading-[1.85] text-empty-text narrow:text-[11px]">
        放入图片，写下灵感。
        <br />
        连接它们，让下一次创作在这里发生。
      </p>
      <Button
        size="sm"
        className="pointer-events-auto shadow-empty-action hover:-translate-y-px"
        onClick={onAddPrompt}
      >
        <Plus size={17} />
        添加第一条提示词
        <ArrowRight size={16} />
      </Button>
      <div className="mt-6 flex items-center justify-center gap-3 text-[9px] text-empty-flow narrow:gap-1.5 narrow:text-[8px]">
        <span>添加节点</span>
        <ChevronRight size={12} className="text-empty-flow-icon" />
        <span>连接输入</span>
        <ChevronRight size={12} className="text-empty-flow-icon" />
        <span>开始创作</span>
      </div>
    </div>
  );
}
