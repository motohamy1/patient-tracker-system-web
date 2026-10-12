// One appointment's consultation surface (Phase 17, ticket 17-03; TH-01).
//
// Server Component: reads the visit and its session under org RLS, then hands
// them to the consultation island. A visit RLS hides renders the no-leak
// denial state; a failed read renders the §7 error copy with a wired retry.
import { Lock } from 'lucide-react';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { ConsultationRoom } from '@/components/telehealth/ConsultationRoom';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { getConsultationContext, getSessionForVisit } from '@/lib/telehealth/queries';
import { visitIdSchema } from '@/lib/visits/schemas';

export const dynamic = 'force-dynamic';

export default async function ProviderConsultationPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedVisit = visitIdSchema.safeParse(visitId);

  let context: Awaited<ReturnType<typeof getConsultationContext>> = null;
  let failed = false;
  if (parsedVisit.success) {
    try {
      context = await getConsultationContext(resolution.orgId, parsedVisit.data);
    } catch {
      failed = true;
    }
  }

  let session = null;
  if (context !== null && parsedVisit.success) {
    try {
      session = await getSessionForVisit(resolution.orgId, parsedVisit.data);
    } catch {
      session = null;
    }
  }

  const canAuthorClinical = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
        {failed ? (
          <StateVariant surface="this consultation" retryHref="/provider/consultations" />
        ) : context === null ? (
          <EmptyState
            icon={Lock}
            title="You don't have access to this consultation"
            body="Ask your organization owner for access to patient records."
          />
        ) : (
          <ConsultationRoom
            visitId={context.visitId}
            patientId={context.patientId}
            patientName={context.patientName}
            sessionStatus={session?.status ?? null}
            transport={session?.transport ?? 'not_configured'}
            joinToken={session?.joinToken ?? null}
            reason={context.reason}
            documentation={context.documentation}
            canAuthorClinical={canAuthorClinical}
            insetFill={INSET_FILL}
          />
        )}
      </div>
    </Surface>
  );
}
