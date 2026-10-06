// The patient-workspace frame (D-01, D-02).
//
// This layout hosts ONLY the workspace frame: it never re-renders the rail or
// the provider top bar, because those come from the parent `(provider)` layout.
//
// The tab bar is NOT rendered here. An App Router layout cannot read its child
// segment, and this phase forbids middleware and any client-side path/role read
// (D-03); the tab bar's active item therefore has to come from the route that
// knows its own slug. Each workspace route renders `WorkspaceTopBar` with its
// own `activeSlug`, so the active tab is correct on first paint for every tab
// and the bare workspace URL (which redirects) is never a dead end.
import type { ReactNode } from 'react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 flex-col bg-canvas">{children}</div>;
}
