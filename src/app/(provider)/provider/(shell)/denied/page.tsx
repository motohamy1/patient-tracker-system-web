// The deep-route permission-denial surface (D-12/D-13, UX-02, 03-UI-SPEC §8.4).
//
// This route exists ONLY for deep routes inside a provider-group visitor's own
// role group: the cross-role cases never land here (the (provider) layout slot
// resolves the role and redirects the visitor to their own workspace first, so
// by the time this page renders the resolution is signed-in within the group).
//
// The copy is the UI-SPEC §Copywriting contract, written once: a calm no-leak
// EmptyState — the title states no access, the single body line names the
// CAPABILITY level that is lacked, and nothing is ever said about whether the
// denied resource exists (D-13). The action owns a wired destination: the
// visitor's own resolved workspace (D-12), rendered only when an own workspace
// target exists — a dead enabled button never ships (D-24).
//
// The route is force-dynamic: an authenticated workspace route is never
// statically cached or ISR-served — serving one principal's resolution to
// another would be the §12/§25 violation (RESEARCH Pitfall 11).
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';
import { ownWorkspaceTarget } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

export const dynamic = 'force-dynamic';

export default async function ProviderDeniedPage() {
  const resolution = await resolveWorkspaceRole('provider');

  return (
    <div className="flex flex-1 items-center justify-center p-xl">
      <EmptyState
        icon={Lock}
        title="You don't have access to this workspace"
        body="Ask your organization owner for provider access."
        action={
          resolution.kind === 'signed-in'
            ? { label: 'Go to your workspace', href: ownWorkspaceTarget(resolution.role) }
            : undefined
        }
      />
    </div>
  );
}
