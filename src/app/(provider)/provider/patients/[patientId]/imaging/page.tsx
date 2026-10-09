// Imaging — the patient's imaging orders and their impressions (LAB-02;
// ticket 09-05). The linked document's filename is surfaced when present; the
// media itself is not rendered here (no image viewer — §27).
import { Lock } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { NewImagingOrderControl, RecordImagingResultControl } from '@/components/imaging/ImagingControls';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import {
  listImagingOrders,
  listImagingResults,
  type ImagingOrderRecord,
  type ImagingResultRecord,
} from '@/lib/imaging/queries';
import {
  IMAGING_ORDER_STATUS_LABELS,
  IMAGING_ORDER_STATUS_TOKEN,
} from '@/lib/imaging/status';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

function orderLabel(order: ImagingOrderRecord): string {
  return order.bodySite !== null ? `${order.modality} (${order.bodySite})` : order.modality;
}

export default async function ImagingPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let orders: ImagingOrderRecord[] = [];
  let results: ImagingResultRecord[] = [];
  let failed = false;
  if (parsedId.success) {
    try {
      orders = await listImagingOrders(resolution.orgId, parsedId.data);
      results = await listImagingResults(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  const canAuthor = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="imaging" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">Imaging</h1>
            {canAuthor && parsedId.success && !failed ? (
              <NewImagingOrderControl patientId={parsedId.data} insetFill={INSET_FILL} />
            ) : null}
          </div>

          {failed ? (
            <StateVariant surface="imaging" retryHref={tabHref(patientId, 'imaging')} />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's imaging"
              body="Ask your organization owner for access to patient records."
            />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No imaging yet"
              body="Imaging orders and their reports will appear here as they are recorded."
            />
          ) : (
            <ul className="flex flex-col gap-md" aria-label="Imaging orders">
              {orders.map((order) => {
                const mine = results.filter((result) => result.orderId === order.id);
                return (
                  <li key={order.id}>
                    <Surface variant="surface" className="flex flex-col gap-md">
                      <div className="flex flex-wrap items-center justify-between gap-md">
                        <span className="flex min-w-0 flex-col gap-xs">
                          <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                            {orderLabel(order)}
                          </span>
                          <span className="text-label leading-label text-text-secondary tabular-nums">
                            ordered {order.orderedAt.slice(0, 10)}
                          </span>
                        </span>
                        <span className="flex items-center gap-md">
                          <Pill
                            tone={IMAGING_ORDER_STATUS_TOKEN[order.status]}
                            label={IMAGING_ORDER_STATUS_LABELS[order.status]}
                          />
                          {canAuthor && order.status === 'ordered' ? (
                            <RecordImagingResultControl
                              orderId={order.id}
                              label={orderLabel(order)}
                              insetFill={INSET_FILL}
                            />
                          ) : null}
                        </span>
                      </div>

                      {mine.length > 0 ? (
                        <ul className="flex flex-col gap-sm">
                          {mine.map((result) => (
                            <li key={result.id} className="flex flex-col gap-xs">
                              <span className="text-body leading-body text-text-primary">
                                {result.impression}
                              </span>
                              <span className="text-label leading-label text-text-secondary tabular-nums">
                                {result.resultedAt.slice(0, 10)}
                                {result.documentName !== null ? ` · ${result.documentName}` : ''}
                              </span>
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
