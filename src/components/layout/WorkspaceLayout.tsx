import type { PropsWithChildren } from 'react';

export function WorkspaceLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid h-dvh min-h-150 grid-cols-[252px_minmax(0,1fr)] grid-rows-[72px_minmax(0,1fr)] overflow-hidden compact:grid-cols-[220px_minmax(0,1fr)] narrow:grid-cols-[172px_minmax(0,1fr)]">
      {children}
    </div>
  );
}
