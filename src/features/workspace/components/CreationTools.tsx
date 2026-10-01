import { ImagePlus, Plus, Sparkles, Type, type LucideIcon } from 'lucide-react';
import { cn } from '../../../lib/cn';
import type { CanvasCreationActions } from '../../canvas/hooks/useCanvasCreation';

interface CreationToolProps {
  label: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: 'image' | 'prompt' | 'generator';
  onClick(): void;
}
const iconTones = {
  image: 'bg-image-tool text-image-tool-text',
  prompt: 'bg-prompt-tool text-prompt-tool-text',
  generator: 'bg-generator-tool-icon text-generator-tool-text',
};

function CreationTool({
  label,
  title,
  description,
  icon: Icon,
  tone,
  onClick,
}: CreationToolProps) {
  const generator = tone === 'generator';
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        'flex items-center gap-2.5 rounded-panel border px-2.5 py-3 text-left hover:-translate-y-px hover:border-tool-hover-border narrow:gap-1.75 narrow:px-1.75 narrow:py-2.5',
        generator
          ? 'border-generator-tool-border bg-generator-tool hover:bg-generator-tool-hover'
          : 'border-tool-border bg-tool hover:bg-tool-hover',
      )}
    >
      <span
        className={cn(
          'grid h-9 w-8.5 place-items-center rounded-button narrow:h-7.5 narrow:w-6.5',
          iconTones[tone],
        )}
      >
        <Icon size={20} />
      </span>
      <span>
        <strong className="mb-1 block text-[12px] font-medium narrow:text-[10px]">
          {title}
        </strong>
        <small className="text-[10px] text-caption narrow:text-[8px]">
          {description}
        </small>
      </span>
      <Plus
        size={15}
        className={cn(
          'ml-auto narrow:w-3',
          generator ? 'text-generator-tool-plus' : 'text-tool-plus',
        )}
      />
    </button>
  );
}

export function CreationTools({
  creation,
}: {
  creation: CanvasCreationActions;
}) {
  return (
    <div className="grid gap-2.25">
      <CreationTool
        label="添加图片节点"
        title="图片"
        description="从一张参考图开始"
        icon={ImagePlus}
        tone="image"
        onClick={() => creation.addImage()}
      />
      <CreationTool
        label="添加提示词节点"
        title="提示词"
        description="写下你的创作灵感"
        icon={Type}
        tone="prompt"
        onClick={creation.addPrompt}
      />
      <CreationTool
        label="添加生成节点"
        title="图片生成"
        description="连接输入，探索新可能"
        icon={Sparkles}
        tone="generator"
        onClick={creation.addGenerator}
      />
    </div>
  );
}
