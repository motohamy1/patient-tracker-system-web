// /provider/members — the first data-backed workspace surface (D-01/D-02, 03-UI-SPEC §8.3).
//
// Server-side role resolution first, then the CAN_MANAGE_MEMBERSHIP gate:
// provider_doctor and admin_owner reach the surface (revision-r2 memberships
// SELECT policy), every other signed-in role is sent to their own workspace —
// the D-12 redirect shape, applied exactly once here. Role data never crosses
// to the client beyond the membership row's display strings.
import { redirect } from 'next/navigation';
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { EmptyState } from '@/components/primitives/EmptyState';
import { runsCapability, CAN_MANAGE_MEMBERSHIP } from '@/lib/auth/capabilities';
import { PROVIDER_WORKSPACE_PATH, redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { createClient } from '@/lib/supabase/server';
import { InviteCreator } from './invite-creator';
import { MembersList } from './members-list';

export const dynamic = 'force-dynamic';

export type MemberRow = {
  id: string;
  user_id?: string;
  role: string;
  email: string | null;
  created_at?: string;
};

export default async function MembersPage() {
  const resolution = await resolveWorkspaceRole('provider');
  redirectForRole('provider', resolution);

  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_MANAGE_MEMBERSHIP)) {
    redirect(PROVIDER_WORKSPACE_PATH);
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc('list_org_members', {
    p_org_id: resolution.orgId,
  });

  const rows = (error || !data ? [] : (data as MemberRow[])).filter(
    (row) => typeof row?.id === 'string',
  );

  let orgName = '';
  if (!error) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', resolution.orgId)
      .maybeSingle();
    orgName = org?.name ?? '';
  }

  return (
    <div className="flex flex-1 flex-col gap-xl p-xl">
      <div className="flex flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Members</h1>

        {error ? (
          <EmptyState
            title="Couldn't load members"
            body="Check your connection and try again."
            action={{ label: 'Try again', href: '/provider/members' }}
          />
        ) : rows.length <= 1 ? (
          <EmptyState
            title="No members yet"
            body="Staff and patients join through an invite you create here."
            action={{ label: 'Create invite link', href: '#invite-creator' }}
          />
        ) : (
          <MembersList rows={rows} />
        )}
      </div>

      <section id="invite-creator" className="flex flex-col gap-md">
        <InviteCreator orgId={resolution.orgId} orgName={orgName} insetFill={INSET_FILL} />
      </section>
    </div>
  );
}
