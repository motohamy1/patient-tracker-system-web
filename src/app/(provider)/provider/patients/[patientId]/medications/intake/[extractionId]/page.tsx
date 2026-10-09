// Prescription intake — the verification route (Phase 12, ticket 12-03; §11,
// OCR-02/03).
//
// Server Component, force-dynamic: the extraction row and a short-lived signed
// URL for the ORIGINAL image are resolved under the caller's session, so the
// clinician always sees the image of record beside the extracted fields. A
// row the role may not read returns the no-leak denial state (the copy never
// confirms the resource exists) — UX-02.
//
// The route sits under the Medications tab on purpose: the workspace's primary
// navigation stays exactly the eight tabs (§6); the scanner is an ingestion
// workflow, not a clinical tab.
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { Surface } from '@/components/primitives';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { ExtractionVerifier } from '@/components/ocr/ExtractionVerifier';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { getOcrExtraction, signedDocumentUrl } from '@/lib/ocr/queries';
import { patientIdSchema } from '@/lib/patients/schemas';
import { extractionIdSchema } from '@/lib/ocr/schemas';
import { ownWorkspaceTarget } from '@/lib/auth/redirect';
import type { Role } from '@/lib/auth/roles';
import { tabHref } from '../../../tabs';

export const dynamic = 'force-dynamic';

export default async function PrescriptionIntakePage({
  params,
}: {
  params: Promise<{ patientId: string; extractionId: string }>;
}) {
  const { patientId, extractionId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedPatient = patientIdSchema.safeParse(patientId);
  const parsedExtraction = extractionIdSchema.safeParse(extractionId);

  if (!parsedPatient.success || !parsedExtraction.success) {
    return (
      <>
        <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
        <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
          <EmptyState
            icon={Lock}
            title="You don't have access to this prescription"
            body="Ask your organization owner for access to patient records."
          />
        </Surface>
      </>
    );
  }

  let extraction = null;
  let failed = false;
  try {
    extraction = await getOcrExtraction(resolution.orgId, parsedExtraction.data);
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <>
        <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
        <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
          <StateVariant
            surface="prescription intake"
            retryHref={`/provider/patients/${patientId}/medications`}
          />
        </Surface>
      </>
    );
  }

  if (extraction === null) {
    return (
      <>
        <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
        <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
          <EmptyState
            icon={Lock}
            title="You don't have access to this prescription"
            body="Ask your organization owner for access to patient records."
            action={{ label: 'Go to your workspace', href: ownWorkspaceTarget(resolution.role as Role) }}
          />
        </Surface>
      </>
    );
  }

  // The document must belong to this patient (the DB's integrity guard
  // guarantees it; the check here keeps the URL mint honest).
  const imageUrl =
    extraction.storagePath !== null && extraction.patientId === parsedPatient.data
      ? await signedDocumentUrl(extraction.storagePath)
      : null;

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="medications" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[80rem] flex-col gap-lg">
          <ExtractionVerifier
            extraction={extraction}
            imageUrl={imageUrl}
            patientId={patientId}
            insetFill={INSET_FILL}
          />
          <p className="text-label leading-label text-text-secondary">
            <a href={tabHref(patientId, 'medications')} className="hover:text-text-primary">
              Back to medications
            </a>
          </p>
        </div>
      </Surface>
    </>
  );
}
