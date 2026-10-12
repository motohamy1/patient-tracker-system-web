// /provider/admin/audit — the D-15 admin audit surface.
//
// Server-side resolution ONLY. `resolveWorkspaceRole('admin')` reads verified
// claims + DB membership; `redirectForRole('admin', ...)` applies the D-12
// redirect exactly once — a nurse, doctor, receptionist, patient or
// unaffiliated principal never reaches this query, and never learns the page
// exists beyond being somewhere else (never a denial-page render for them).
// The `CAN_RETRIEVE_AUDIT` capability check is the D-15 belt behind the
// layout's redirectForRole: only `admin_owner` holds it (capabilities.ts).
// The page is force-dynamic: an authenticated route is never cached (RESEARCH
// Pitfall 11). The audit_log fetch carries an explicit `org_id` predicate —
// RLS is inert on the single-owner Neon connection, so app-layer org scoping
// is the enforcement (migration 0003's admin_owner policy was translated into
// the capability gate above) — and rows are capped at a sane page size
// (pagination is a later-phase ask).
import { redirect } from 'next/navigation';
import { AuditTable, type AuditRow } from '@/components/security/AuditTable';
import { EmptyState } from '@/components/primitives/EmptyState';
import { runsCapability, CAN_RETRIEVE_AUDIT } from '@/lib/auth/capabilities';
import { ownWorkspaceTarget, redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { getSql } from '@/lib/db/neon';

export const dynamic = 'force-dynamic';

const AUDIT_PAGE_SIZE = 50;

export default async function AdminAuditPage() {
  const resolution = await resolveWorkspaceRole('admin');
  redirectForRole('admin', resolution);

  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_RETRIEVE_AUDIT)) {
    redirect(ownWorkspaceTarget(resolution.role));
    return null;
  }

  let rows: AuditRow[] = [];
  let failed = false;
  try {
    const sql = getSql();
    rows = (await sql`
      select id, actor, action, entity, entity_id, org_id, created_at
      from public.audit_log
      where org_id = ${resolution.orgId}
      order by created_at desc
      limit ${AUDIT_PAGE_SIZE}
    `) as unknown as AuditRow[];
  } catch {
    failed = true;
  }

  return (
    <div className="flex flex-1 flex-col gap-xl p-xl">
      {failed ? (
        <EmptyState
          title="Couldn't load audit log"
          body="Check your connection and try again."
          action={{ label: 'Try again', href: '/provider/admin/audit' }}
        />
      ) : (
        <AuditTable rows={rows} />
      )}
    </div>
  );
}
