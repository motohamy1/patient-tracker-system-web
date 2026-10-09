// Allergies — the patient's allergy record (ALG-01; ticket 10-04).
//
// Server Component, force-dynamic. Allergies are visible to every staff role
// at the data layer (0009's SELECT policy); authors may record and resolve.
// Provenance is shown: source + verification labels and the noting date — an
// AI-extracted allergy can never read as clinician-verified.
import { Lock } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { NewAllergyControl, ResolveAllergyControl } from '@/components/allergies/AllergyControls';
import { CAN_AUTHOR_CLINICAL, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listAllergies, type AllergyRecord } from '@/lib/allergies/queries';
import {
  ALLERGY_SEVERITY_LABELS,
  ALLERGY_SEVERITY_TOKEN,
  ALLERGY_STATUS_LABELS,
  CLINICAL_SOURCE_LABELS,
  VERIFICATION_LABELS,
  type AllergyStatus,
} from '@/lib/allergies/status';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

function statusTone(status: AllergyStatus): 'critical' | 'neutral' {
  return status === 'active' ? 'critical' : 'neutral';
}

function provenance(allergy: AllergyRecord): string {
  return `${VERIFICATION_LABELS[allergy.verification]} · ${CLINICAL_SOURCE_LABELS[allergy.source]} · noted ${allergy.notedAt.slice(0, 10)}`;
}

export default async function AllergiesPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let allergies: AllergyRecord[] = [];
  let failed = false;
  if (parsedId.success) {
    try {
      allergies = await listAllergies(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  const canAuthor = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="allergies" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">Allergies</h1>
            {canAuthor && parsedId.success && !failed ? (
              <NewAllergyControl patientId={parsedId.data} insetFill={INSET_FILL} />
            ) : null}
          </div>

          {failed ? (
            <StateVariant surface="allergies" retryHref={tabHref(patientId, 'allergies')} />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's allergies"
              body="Ask your organization owner for access to patient records."
            />
          ) : allergies.length === 0 ? (
            <EmptyState
              title="No allergies yet"
              body="Recorded allergies will appear here as they are added."
            />
          ) : (
            <ul className="flex flex-col gap-md" aria-label="Allergies">
              {allergies.map((allergy) => (
                <li key={allergy.id}>
                  <Surface variant="surface" className="flex flex-col gap-md">
                    <div className="flex flex-wrap items-center justify-between gap-md">
                      <span className="flex min-w-0 flex-col gap-xs">
                        <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                          {allergy.allergen}
                        </span>
                        <span className="text-label leading-label text-text-secondary">
                          {allergy.reaction ?? 'Reaction not specified'}
                        </span>
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          {provenance(allergy)}
                        </span>
                      </span>
                      <span className="flex items-center gap-md">
                        {allergy.severity !== null ? (
                          <Pill
                            tone={ALLERGY_SEVERITY_TOKEN[allergy.severity]}
                            label={ALLERGY_SEVERITY_LABELS[allergy.severity]}
                          />
                        ) : null}
                        <Pill tone={statusTone(allergy.status)} label={ALLERGY_STATUS_LABELS[allergy.status]} />
                        {canAuthor && allergy.status === 'active' ? (
                          <ResolveAllergyControl allergyId={allergy.id} allergen={allergy.allergen} />
                        ) : null}
                      </span>
                    </div>
                  </Surface>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Surface>
    </>
  );
}
