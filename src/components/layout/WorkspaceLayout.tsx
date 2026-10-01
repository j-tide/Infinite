import type { PropsWithChildren } from 'react';

export function WorkspaceLayout({ children }: PropsWithChildren) {
  return <div className="app-shell">{children}</div>;
}
