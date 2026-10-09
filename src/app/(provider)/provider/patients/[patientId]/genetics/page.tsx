// Genetics — the patient's genetic findings behind the sensitive-category
// gate (ALG-02/ALG-03; ticket 10-04).
//
// Server Component, force-dynamic. CAN_VIEW_GENETICS (the capability mirror of
// 0009's genetics SELECT policy) is resolved BEFORE any query: a role without
// it sees the no-leak denial state and no query is issued — the UI cannot
// imply "no findings exist" for a record it may not read. RLS remains the
// enforcement; this mirror only makes the denial truthful.
import { Lock } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { NewGeneticFindingControl } from '@/components/genetics/GeneticsControls';
import { CAN_AUTHOR_CLINICAL, CAN_VIEW_GENETICS, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import { listGeneticFindings, type GeneticFindingRecord } from '@/lib/genetics/queries';
import { CLINICAL_SOURCE_LABELS, VERIFICATION_LABELS } from '@/lib/allergies/status';
import {
  GENETIC_KIND_LABELS,
  GENETIC_SIGNIFICANCE_LABELS,
  GENETIC_SIGNIFICANCE_TOKEN,
} from '@/lib/genetics/status';

export const dynamic = 'force-dynamic';

function findingTitle(finding: GeneticFindingRecord): string {
  const parts = [finding.gene, finding.variant].filter(
    (value): value is string => value !== null && value !== '',
  );
  return parts.length > 0 ? parts.join(' ') : GENETIC_KIND_LABELS[finding.kind];
}

export default async function GeneticsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const canView = runsCapability(resolution.role, CAN_VIEW_GENETICS);
  const canAuthor = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);
  const parsedId = patientIdSchema.safeParse(patientId);

  let findings: GeneticFindingRecord[] = [];
  let failed = false;
  // No query for a role without visibility — the denial is truthful and the
  // data layer would return nothing anyway (0009's SELECT policy).
  if (canView && parsedId.success) {
    try {
      findings = await listGeneticFindings(resolution.orgId, parsedId.data);
    } catch {
      failed = true;
    }
  }

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="genetics" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          <div className="flex flex-wrap items-center justify-between gap-md">
            <h1 className="text-heading font-semibold leading-heading text-text-primary">Genetics</h1>
            {canView && canAuthor && parsedId.success && !failed ? (
              <NewGeneticFindingControl patientId={parsedId.data} insetFill={INSET_FILL} />
            ) : null}
          </div>

          {!canView ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's genetics"
              body="Ask your organization owner for access to sensitive records."
            />
          ) : failed ? (
            <StateVariant
              surface="genetics"
              retryHref={`/provider/patients/${patientId}/genetics`}
            />
          ) : !parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to this patient's genetics"
              body="Ask your organization owner for access to sensitive records."
            />
          ) : findings.length === 0 ? (
            <EmptyState
              title="No genetics findings yet"
              body="Recorded findings will appear here as they are added."
            />
          ) : (
            <ul className="flex flex-col gap-md" aria-label="Genetic findings">
              {findings.map((finding) => (
                <li key={finding.id}>
                  <Surface variant="surface" className="flex flex-col gap-md">
                    <div className="flex flex-wrap items-center justify-between gap-md">
                      <span className="flex min-w-0 flex-col gap-xs">
                        <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                          {findingTitle(finding)}
                        </span>
                        <span className="text-label leading-label text-text-secondary">
                          {GENETIC_KIND_LABELS[finding.kind]}
                          {finding.documentName !== null ? ` · ${finding.documentName}` : ''}
                        </span>
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          {VERIFICATION_LABELS[finding.verification]} ·{' '}
                          {CLINICAL_SOURCE_LABELS[finding.source]} · reported{' '}
                          {finding.reportedAt.slice(0, 10)}
                        </span>
                      </span>
                      {finding.significance !== null ? (
                        <Pill
                          tone={GENETIC_SIGNIFICANCE_TOKEN[finding.significance]}
                          label={GENETIC_SIGNIFICANCE_LABELS[finding.significance]}
                        />
                      ) : null}
                    </div>
                    {finding.interpretation !== null ? (
                      <p className="text-body leading-body text-text-primary">
                        {finding.interpretation}
                      </p>
                    ) : null}
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
