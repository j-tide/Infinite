import { Image as ImageIcon, Sparkles, Trash2, Type } from 'lucide-react';
import { IconButton } from '../../../../components/ui/IconButton';
import { cn } from '../../../../lib/cn';
import { useCanvasStore } from '../../store/canvasStore';
import type { NodeKind } from '../../types';

interface NodeHeadingProps {
  id: string;
  label: string;
  kind: NodeKind;
}

const icons = { image: ImageIcon, prompt: Type, generator: Sparkles };
const iconColors = {
  image: 'text-node-image',
  prompt: 'text-node-prompt',
  generator: 'text-node-generator-icon',
};

export function NodeHeading({ id, label, kind }: NodeHeadingProps) {
  const deleteNode = useCanvasStore((state) => state.deleteNode);
  const Icon = icons[kind];

  return (
    <header
      className={cn(
        'node-heading flex h-12 cursor-grab items-center gap-2.25 rounded-t-node border-b px-3.75 py-3.25 active:cursor-grabbing',
        kind === 'generator'
          ? 'border-node-generator-heading-border bg-node-generator-heading'
          : 'border-node-heading-border bg-node-heading',
      )}
    >
      <span className={cn('flex', iconColors[kind])}>
        <Icon size={15} />
      </span>
      <strong className="text-[11px] font-medium">{label}</strong>
      <IconButton
        label={`删除${label}`}
        title="删除节点"
        className="nodrag nopan ml-auto text-node-delete hover:bg-node-delete-hover hover:text-node-delete-hover-text"
        onClick={() => deleteNode(id)}
      >
        <Trash2 size={13} />
      </IconButton>
    </header>
  );
}
