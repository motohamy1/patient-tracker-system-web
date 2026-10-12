// Hospitalization — the patient's inpatient stays (the ninth workspace tab,
// added for the patient-detail reference whose tab row enumerates it).
//
// The schema has no `hospitalizations` table yet, so this route is a §7 empty
// state that NAMES what will appear rather than a fabricated list (§27, D-18).
// It is deliberately not wired to a query: inventing a table read that cannot
// succeed would ship a dead surface, and an empty state that states the fact is
// the honest interim.
//
// Server Component, force-dynamic — the same cache posture as every other
// workspace route (§12): an authenticated patient workspace is never cached or
// ISR-served across principals.
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';

export const dynamic = 'force-dynamic';

export default async function HospitalizationPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  // The id is validated before it is used to build the retry href, so a
  // malformed segment never reaches a query and never reaches the render
  // (ASVS V5, T-02-52).
  const parsedId = patientIdSchema.safeParse(patientId);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="hospitalization" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <h1 className="text-heading font-semibold leading-heading text-text-primary">
            Hospitalization
          </h1>

          {!parsedId.success ? (
            <StateVariant
              surface="hospitalization"
              retryHref={`/provider/patients/${patientId}/hospitalization`}
            />
          ) : (
            <EmptyState
              title="No hospitalizations yet"
              body="Inpatient stays and discharge records will appear here as care progresses."
            />
          )}
        </div>
      </Surface>
    </>
  );
}
