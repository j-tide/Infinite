import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Image as ImageIcon, Sparkles } from 'lucide-react';
import { cn } from '../../../../lib/cn';
import { useCanvasStore } from '../../store/canvasStore';
import type { CanvasNode } from '../../types';
import { NodeCard } from './NodeCard';
import { NodeFooter } from './NodeFooter';
import { NodeHeading } from './NodeHeading';

export function ImageNode({ id, data, selected }: NodeProps<CanvasNode>) {
  const asset = useCanvasStore((state) => state.doc.assets[data.assetId ?? '']);
  const generated = asset?.origin === 'generated';

  return (
    <NodeCard kind="image" selected={selected}>
      <NodeHeading id={id} label={data.label} kind="image" />
      <div className="p-3">
        {asset ? (
          <>
            <div
              className="relative overflow-hidden rounded-field bg-node-image-surface"
              style={{ aspectRatio: `${asset.width}/${asset.height}` }}
            >
              <img
                src={asset.src}
                alt={asset.name}
                draggable={false}
                className="block h-full w-full object-cover select-none"
              />
              <span
                className={cn(
                  'absolute bottom-2 left-2 flex items-center gap-1 rounded-badge border border-node-origin-border bg-node-origin px-1.5 py-1 text-[8px] backdrop-blur-[7px]',
                  generated
                    ? 'text-node-origin-generated'
                    : 'text-node-origin-text',
                )}
              >
                {generated ? <Sparkles size={10} /> : <ImageIcon size={10} />}
                {generated ? 'Mock 生成结果' : '内置示例'}
              </span>
            </div>
            <div className="mx-px mt-2.5 mb-px flex items-center justify-between text-[9px] text-node-metadata">
              <span>{asset.name}</span>
              <span className="text-[8px] text-node-metadata-muted">
                {asset.width} × {asset.height}
              </span>
            </div>
            {generated && (
              <div className="mt-2 flex justify-between text-[8px] text-node-asset">
                资产 {asset.id.slice(0, 8)}
                <span className="text-node-asset-reuse">可继续作为输入</span>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-45 flex-col items-center justify-center gap-2.5 text-[11px] text-node-image-missing">
            <ImageIcon size={24} />
            <span>图片资源缺失</span>
          </div>
        )}
      </div>
      <NodeFooter kind="image" />
      <Handle
        id="output"
        type="source"
        position={Position.Right}
        className="image-handle"
      />
    </NodeCard>
  );
}
