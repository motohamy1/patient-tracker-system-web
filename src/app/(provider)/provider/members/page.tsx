// /provider/members — the first data-backed workspace surface (D-01/D-02, 03-UI-SPEC §8.3).
//
// Server-side role resolution first, then the CAN_MANAGE_MEMBERSHIP gate:
// provider_doctor and admin_owner reach the surface (the membership rows are
// read through the security-definer `list_org_members`, which re-derives the
// actor from app.user_id), every other signed-in role is sent to their own
// workspace — the D-12 redirect shape, applied exactly once here. RLS is
// inert on the single-owner Neon connection: the explicit `org_id` predicates
// below (and inside the definer function) are the org-scoping enforcement.
// Role data never crosses to the client beyond the membership row's display
// strings.
import { redirect } from 'next/navigation';
import { Surface } from '@/components/primitives';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { EmptyState } from '@/components/primitives/EmptyState';
import { runsCapability, CAN_MANAGE_MEMBERSHIP } from '@/lib/auth/capabilities';
import { PROVIDER_WORKSPACE_PATH, redirectForRole } from '@/lib/auth/redirect';
import { getSessionUser } from '@/lib/auth/session';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { withAppUser } from '@/lib/db/client';
import { getSql } from '@/lib/db/neon';
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

  const user = await getSessionUser();
  if (!user) return null;

  let rows: MemberRow[] = [];
  let failed = false;
  try {
    const members = await withAppUser(user.id, async (tx) => {
      const { rows: payloadRows } = await tx.query<{ payload: MemberRow[] | null }>(
        'select public.list_org_members($1) as payload',
        [resolution.orgId],
      );
      return payloadRows[0]?.payload ?? [];
    });
    rows = members.filter((row) => typeof row?.id === 'string');
  } catch {
    failed = true;
  }

  let orgName = '';
  if (!failed) {
    try {
      const sql = getSql();
      const orgs = (await sql`
        select name from public.organizations where id = ${resolution.orgId}
      `) as unknown as { name: string }[];
      orgName = orgs[0]?.name ?? '';
    } catch {
      orgName = '';
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-xl p-xl">
      <div className="flex flex-col gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">Members</h1>

        {failed ? (
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
