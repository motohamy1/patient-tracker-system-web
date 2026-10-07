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
// Pitfall 11). The audit_log fetch is admin_owner-only RLS (migration 0003),
// and rows are capped at a sane page size (pagination is a later-phase ask).
import { redirect } from 'next/navigation';
import { AuditTable, type AuditRow } from '@/components/security/AuditTable';
import { EmptyState } from '@/components/primitives/EmptyState';
import { runsCapability, CAN_RETRIEVE_AUDIT } from '@/lib/auth/capabilities';
import { ownWorkspaceTarget, redirectForRole } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { createClient } from '@/lib/supabase/server';

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

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, actor, action, entity, entity_id, org_id, created_at')
    .eq('org_id', resolution.orgId)
    .order('created_at', { ascending: false })
    .limit(AUDIT_PAGE_SIZE);

  const rows: AuditRow[] = (error || !data ? [] : data) as AuditRow[];

  return (
    <div className="flex flex-1 flex-col gap-xl p-xl">
      {error ? (
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
