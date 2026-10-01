import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useCanvasStore } from '../../store/canvasStore';
import type { CanvasNode } from '../../types';
import { NodeCard } from './NodeCard';
import { NodeFooter } from './NodeFooter';
import { NodeHeading } from './NodeHeading';

export function PromptNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const updateNode = useCanvasStore((state) => state.updateNode);
  const text = data.text ?? '';

  return (
    <NodeCard kind="prompt" selected={selected}>
      <NodeHeading id={id} label={data.label} kind="prompt" />
      <div className="p-3.5">
        <label
          className="mt-px mb-2.5 block text-[9px] text-node-field-caption"
          htmlFor={`prompt-${id}`}
        >
          描述你的想象
        </label>
        <textarea
          id={`prompt-${id}`}
          aria-label="提示词内容"
          className="nodrag nopan nowheel block max-h-75 min-h-29.5 w-full resize-y rounded-field border border-node-prompt-border bg-node-prompt-surface p-2.5 font-[family-name:inherit] text-[11px] leading-[1.8] text-node-prompt-text placeholder:text-node-prompt-placeholder"
          placeholder="例如：紫色暮光下的山谷，柔和的光线，梦幻的氛围……"
          value={text}
          onChange={(event) => updateNode(id, { text: event.target.value })}
        />
        <div className="mt-2.25 flex justify-between gap-2.5 text-[8px] text-node-prompt-meta">
          <span>连接到生成节点，赋予画面新意</span>
          <span>{text.length}</span>
        </div>
      </div>
      <NodeFooter kind="prompt" />
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        className="prompt-handle"
      />
    </NodeCard>
  );
}
