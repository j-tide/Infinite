import type { PropsWithChildren } from 'react';
import { cn } from '../../../../lib/cn';
import type { NodeKind } from '../../types';

interface NodeCardProps extends PropsWithChildren {
  kind: NodeKind;
  selected?: boolean;
  generating?: boolean;
}

export function NodeCard({
  kind,
  selected,
  generating,
  children,
}: NodeCardProps) {
  return (
    <article
      className={cn(
        'overflow-visible rounded-node border text-node-text',
        kind === 'generator'
          ? 'w-80 bg-node-generator'
          : 'w-70 bg-node',
        selected
          ? 'border-node-selected'
          : kind === 'generator'
            ? 'border-node-generator-border'
            : 'border-node-border',
        generating
          ? 'shadow-node-generating'
          : selected
            ? 'shadow-node-selected'
            : 'shadow-node',
      )}
      data-testid={`${kind}-node`}
    >
      {children}
    </article>
  );
}
