// src/components/security/AuditTable.tsx — the D-15 audit read surface
// (03-UI-SPEC.md §8.7).
//
// Renders heading "Audit log" and a plain data list: timestamp at label size
// with tabular-nums, actor, action verb, entity label. No payload or PII is
// dumped into a row. Row separation uses borderSubtle row lines ONLY — the one
// sanctioned border use (INV-15). Rows sit on bg-surface; there are no
// colored badges, no charts, and the only filter is a plain CompactControl
// search (client-local state inside AuditBrowser — the strip of client JS stays
// exactly one piece).
//
// Server Component for the frame; the interactive filter is a single client
// component (AuditBrowser) so the rows and the heading stay server-rendered.
import { CompactControl } from '@/components/primitives/CompactControl';
import { EmptyState } from '@/components/primitives/EmptyState';
import { AuditBrowser } from './audit-browser';

export type AuditRow = {
  id: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  org_id: string | null;
  created_at: string;
};

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <div className="flex flex-col gap-md">
      <h1 className="text-heading font-semibold leading-heading text-text-primary">Audit log</h1>
      {rows.length === 0 ? (
        <EmptyState
          title="No audit entries yet"
          body="Actions on memberships and invites are recorded here automatically."
        />
      ) : (
        <AuditBrowser rows={rows} />
      )}
    </div>
  );
}
