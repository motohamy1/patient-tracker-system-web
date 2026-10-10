// /provider/earnings — the provider's earnings overview (Phase 18, ticket
// 18-03; PAY-01/03).
//
// A profile-level route (like /provider/messages and /provider/consultations)
// — never a tab on the locked 8-tab workspace navigation, and never a
// financial figure on the clinical timeline (PAY-04). Every figure is derived
// server-side from the invoice/payment rows; nothing is stored, nothing is
// claimed client-side.
import { Surface } from '@/components/primitives';
import { StateVariant } from '@/components/state/StateVariant';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { EarningsView } from '@/components/payments/EarningsView';
import { CAN_MANAGE_BILLING, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { getEarningsOverview } from '@/lib/payments/queries';
import { listPatients } from '@/lib/patients/queries';

export const dynamic = 'force-dynamic';

export default async function ProviderEarningsPage() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  let overview: Awaited<ReturnType<typeof getEarningsOverview>> | null = null;
  let failed = false;
  try {
    overview = await getEarningsOverview(resolution.orgId);
  } catch {
    failed = true;
  }

  let patients: Array<{ id: string; name: string }> = [];
  if (!failed) {
    try {
      const page = await listPatients({ orgId: resolution.orgId, limit: 24, shown: 0 });
      patients = page.rows.map((row) => ({ id: row.id, name: `${row.firstName} ${row.lastName}` }));
    } catch {
      patients = [];
    }
  }

  const canManage = runsCapability(resolution.role, CAN_MANAGE_BILLING);

  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <h1 className="text-heading font-semibold leading-heading text-text-primary">Earnings</h1>
          <p className="text-label leading-label text-text-secondary">
            Invoices, payments and consultation fees · {canManage ? 'You can issue and manage invoices.' : 'Read-only for your role.'}
          </p>
        </div>

        {failed || overview === null ? (
          <StateVariant surface="earnings" retryHref="/provider/earnings" />
        ) : (
          <EarningsView overview={overview} patients={patients} canManage={canManage} insetFill={INSET_FILL} />
        )}
      </div>
    </Surface>
  );
}
