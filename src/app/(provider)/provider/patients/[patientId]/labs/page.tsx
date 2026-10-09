// Labs — the patient's lab orders and their structured results (LAB-01;
// ticket 09-05).
//
// Server Component, force-dynamic. Orders render as milestones with a semantic
// status Pill and their results beneath (analyte, value+unit, reference range,
// flag through the closed tint family). Ordering and resulting controls render
// only for clinical authors; the actions re-check server-side.
import { Lock } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { NewLabOrderControl, RecordLabResultControl } from '@/components/labs/LabControls';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import {
  listLabOrders,
  listLabResults,
  type LabOrderRecord,
  type LabResultRecord,
} from '@/lib/labs/queries';
import {
  LAB_FLAG_LABELS,
  LAB_FLAG_TOKEN,
  LAB_ORDER_STATUS_LABELS,
  LAB_ORDER_STATUS_TOKEN,
} from '@/lib/labs/status';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

function resultLine(result: LabResultRecord): string {
  const parts: string[] = [];
  if (result.value !== null) {
    parts.push(`${result.value}${result.unit ? ` ${result.unit}` : ''}`);
  }
  if (result.referenceRange !== null) parts.push(`ref ${result.referenceRange}`);
  if (result.documentName !== null) parts.push(result.documentName);
  return parts.join(' · ');
}

export default async function LabsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let orders: LabOrderRecord[] = [];
  let results: LabResultRecord[] = [];
  let failed = false;
  if (parsedId.success) {
    try {
      orders = await listLabOrders(resolution.orgId, parsedId.data);
      results = await listLabResults(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  const canAuthor = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="labs" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">Labs</h1>
            {canAuthor && parsedId.success && !failed ? (
              <NewLabOrderControl patientId={parsedId.data} insetFill={INSET_FILL} />
            ) : null}
          </div>

          {failed ? (
            <StateVariant surface="labs" retryHref={tabHref(patientId, 'labs')} />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's labs"
              body="Ask your organization owner for access to patient records."
            />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No labs yet"
              body="Lab orders and their results will appear here as they are recorded."
            />
          ) : (
            <ul className="flex flex-col gap-md" aria-label="Lab orders">
              {orders.map((order) => {
                const mine = results.filter((result) => result.orderId === order.id);
                return (
                  <li key={order.id}>
                    <Surface variant="surface" className="flex flex-col gap-md">
                      <div className="flex flex-wrap items-center justify-between gap-md">
                        <span className="flex min-w-0 flex-col gap-xs">
                          <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                            {order.name}
                          </span>
                          <span className="text-label leading-label text-text-secondary tabular-nums">
                            ordered {order.orderedAt.slice(0, 10)}
                          </span>
                        </span>
                        <span className="flex items-center gap-md">
                          <Pill
                            tone={LAB_ORDER_STATUS_TOKEN[order.status]}
                            label={LAB_ORDER_STATUS_LABELS[order.status]}
                          />
                          {canAuthor && order.status === 'ordered' ? (
                            <RecordLabResultControl
                              orderId={order.id}
                              orderName={order.name}
                              insetFill={INSET_FILL}
                            />
                          ) : null}
                        </span>
                      </div>

                      {mine.length > 0 ? (
                        <ul className="flex flex-col gap-sm">
                          {mine.map((result) => (
                            <li key={result.id} className="flex items-center justify-between gap-md">
                              <span className="flex min-w-0 flex-col gap-xs">
                                <span className="text-body leading-body text-text-primary">
                                  {result.analyte}
                                </span>
                                <span className="text-label leading-label text-text-secondary tabular-nums">
                                  {resultLine(result)}
                                </span>
                              </span>
                              {result.flag !== null ? (
                                <Pill
                                  tone={LAB_FLAG_TOKEN[result.flag]}
                                  label={LAB_FLAG_LABELS[result.flag]}
                                />
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </Surface>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Surface>
    </>
  );
}
