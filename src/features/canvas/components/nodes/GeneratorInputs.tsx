import type { PropsWithChildren } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Check, Image as ImageIcon, Type } from 'lucide-react';
import { cn } from '../../../../lib/cn';
import type { CanvasInputs } from '../../types';

interface InputSlotProps extends PropsWithChildren {
  kind: 'image' | 'prompt';
  connected: boolean;
}

function InputSlot({ kind, connected, children }: InputSlotProps) {
  const Icon = kind === 'image' ? ImageIcon : Type;
  return (
    <div
      className={cn(
        'relative rounded-field border bg-node-input p-2.5',
        connected ? 'border-node-input-connected' : 'border-node-input-border',
      )}
    >
      <Handle
        id={kind}
        type="target"
        position={Position.Left}
        className={cn(
          'left-[-18px]!',
          kind === 'image' ? 'image-handle' : 'prompt-handle',
        )}
      />
      <div className="flex items-center gap-1.25 text-[9px] text-node-input-label">
        <Icon size={12} />
        {kind === 'image' ? '参考图片' : '提示词'}
        <span
          className={cn(
            'ml-auto text-[7px]',
            connected
              ? 'text-node-input-connected-label'
              : 'text-node-input-disconnected',
          )}
        >
          {connected ? '已连接' : '未连接'}
        </span>
      </div>
      {children}
    </div>
  );
}

interface GeneratorInputsProps {
  inputs: CanvasInputs;
}

export function GeneratorInputs({ inputs }: GeneratorInputsProps) {
  return (
    <div className="grid gap-2.25">
      <InputSlot kind="image" connected={!!inputs.image}>
        {inputs.image ? (
          <div className="mt-2.25 flex items-center gap-2.25 text-[9px] text-node-connected-image">
            <img
              src={inputs.image.src}
              alt={`输入 ${inputs.image.name}`}
              className="h-7.5 w-9.25 rounded-badge object-cover"
            />
            <span>{inputs.image.name}</span>
            <Check size={12} className="ml-auto text-node-connected-check" />
          </div>
        ) : (
          <div className="mt-2.5 text-[10px] text-node-input-placeholder">
            连接一个图片节点
          </div>
        )}
      </InputSlot>
      <InputSlot kind="prompt" connected={inputs.prompt !== undefined}>
        <p className="nowheel nodrag nopan m-0 mt-2.25 max-h-11.75 overflow-auto text-[10px] leading-[1.6] [word-break:break-word] whitespace-pre-wrap text-node-connected-prompt">
          {inputs.prompt ||
            (inputs.prompt !== undefined
              ? '请输入提示词内容'
              : '连接一个提示词节点')}
        </p>
      </InputSlot>
    </div>
  );
}
