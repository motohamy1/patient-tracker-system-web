// One visit's workflow surface (ticket 07-05; VIS-01).
//
// Server Component: reads the visit under org RLS, then hands it to the
// workflow client island. A visit RLS hides renders the no-leak denial state;
// a failed read renders the §7 error copy with a wired retry.
import { Lock } from 'lucide-react';
import Link from 'next/link';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { Pill } from '@/components/primitives/Pill';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { VisitWorkflow } from '@/components/visits/VisitWorkflow';
import { InvoiceControl } from '@/components/payments/InvoiceControl';
import { CAN_AUTHOR_CLINICAL, CAN_MANAGE_BILLING, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { getVisit, type VisitRecord } from '@/lib/visits/queries';
import { getSessionForVisit } from '@/lib/telehealth/queries';
import { SESSION_STATUS_LABELS, SESSION_STATUS_TOKEN } from '@/lib/telehealth/status';
import { visitIdSchema } from '@/lib/visits/schemas';

export const dynamic = 'force-dynamic';

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ patientId: string; visitId: string }>;
}) {
  const { patientId, visitId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedPatient = patientIdSchema.safeParse(patientId);
  const parsedVisit = visitIdSchema.safeParse(visitId);

  let visit: VisitRecord | null = null;
  let failed = false;
  if (parsedPatient.success && parsedVisit.success) {
    try {
      visit = await getVisit(resolution.orgId, parsedVisit.data);
    } catch {
      failed = true;
    }
  }

  const canAuthorClinical = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);
  // Phase 18: billing is front-desk and owner work (CAN_MANAGE_BILLING
  // mirrors 0017's write policies); a nurse or a patient never sees the
  // control at all.
  const canManageBilling = runsCapability(resolution.role, CAN_MANAGE_BILLING);

  // Phase 17: a telehealth appointment carries its consultation entry here —
  // the status, and the link into the consultation surface. The workflow
  // below stays the single stage/documentation path (one encounter model).
  let sessionStatus: string | null = null;
  if (visit !== null && visit.visitType === 'telehealth' && parsedVisit.success) {
    try {
      const session = await getSessionForVisit(resolution.orgId, parsedVisit.data);
      sessionStatus = session?.status ?? null;
    } catch {
      sessionStatus = null;
    }
  }

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="visits" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          {failed ? (
            <StateVariant surface="this visit" retryHref={`/provider/patients/${patientId}/visits`} />
          ) : visit === null ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this visit"
              body="Ask your organization owner for access to patient records."
            />
          ) : (
            <>
              {visit.visitType === 'telehealth' ? (
                <Surface variant="surface" className="flex flex-wrap items-center justify-between gap-md">
                  <span className="flex flex-col gap-xs">
                    <h2 className="text-label leading-label font-semibold text-text-primary">Telehealth consultation</h2>
                    <span className="text-label leading-label text-text-secondary">
                      {sessionStatus === null
                        ? 'Not started yet — start it from the consultation surface.'
                        : 'The consultation and its documentation live on the consultation surface.'}
                    </span>
                  </span>
                  <span className="flex items-center gap-sm">
                    {sessionStatus !== null ? (
                      <Pill
                        tone={SESSION_STATUS_TOKEN[sessionStatus as keyof typeof SESSION_STATUS_TOKEN]}
                        label={SESSION_STATUS_LABELS[sessionStatus as keyof typeof SESSION_STATUS_LABELS]}
                      />
                    ) : null}
                    <Link
                      href={`/provider/consultations/${visit.id}`}
                      className="text-label leading-label text-text-primary hover:text-text-secondary"
                    >
                      Open consultation
                    </Link>
                  </span>
                </Surface>
              ) : null}
              {canManageBilling ? (
                <Surface variant="surface" className="flex flex-wrap items-center justify-between gap-md">
                  <span className="flex flex-col gap-xs">
                    <h2 className="text-label leading-label font-semibold text-text-primary">Consultation fee</h2>
                    <span className="text-label leading-label text-text-secondary">
                      Issue the invoice for this visit. It appears on the earnings overview and the patient&apos;s
                      billing surface.
                    </span>
                  </span>
                  <InvoiceControl patientId={visit.patientId} visitId={visit.id} insetFill={INSET_FILL} />
                </Surface>
              ) : null}
              <VisitWorkflow
                visit={visit}
                canAuthorClinical={canAuthorClinical}
                insetFill={INSET_FILL}
              />
            </>
          )}
        </div>
      </Surface>
    </>
  );
}
