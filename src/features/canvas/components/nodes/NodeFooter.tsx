import { ArrowUpRight } from 'lucide-react';
import { cn } from '../../../../lib/cn';

interface NodeFooterProps {
  kind: 'image' | 'prompt';
}

export function NodeFooter({ kind }: NodeFooterProps) {
  return (
    <footer className="flex items-center justify-between border-t border-node-footer-border px-3.5 py-2.5 text-[8px] text-node-footer">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            'block size-1.25 rounded-full',
            kind === 'image' ? 'bg-node-image-port' : 'bg-node-prompt',
          )}
        />
        {kind === 'image' ? '图片输出' : '提示词输出'}
      </span>
      <ArrowUpRight size={12} />
    </footer>
  );
}
