// AI Analytics — the assistive surface for this patient (Phase 11, ticket
// 11-03; AI-01/02, PRODUCT-MASTER-SPEC.md §10).
//
// Server Component, force-dynamic. Reads ONLY stored insight rows (0010's
// SELECT policy already restricts them to this org's staff roles); nothing is
// generated during render. Generation is an explicit clinician action
// (CAN_AUTHOR_CLINICAL) and review is an explicit decision (CAN_REVIEW_AI) —
// both re-checked inside the server actions.
//
// The `[patientId]` route parameter is consumed only by the UUID-validated
// query and to build the tab hrefs through `tabHref`; it is never rendered,
// never interpolated into a string, a filesystem path, a template, a log line
// or any interpreter (ASVS V5, T-02-52).
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Surface } from '@/components/primitives';
import { StateVariant } from '@/components/state/StateVariant';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { AiInsightBoard } from '@/components/ai/AiInsightBoard';
import { CAN_AUTHOR_CLINICAL, CAN_REVIEW_AI, runsCapability } from '@/lib/auth/capabilities';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { listAiInsights, type AiInsightRecord } from '@/lib/ai/queries';
import { patientIdSchema } from '@/lib/patients/schemas';
import { tabHref } from '../tabs';

export const dynamic = 'force-dynamic';

export default async function AiAnalyticsPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let insights: AiInsightRecord[] = [];
  let loadFailed = false;
  if (parsedId.success) {
    try {
      insights = await listAiInsights(resolution.orgId, parsedId.data);
    } catch {
      loadFailed = true;
    }
  }

  const canGenerate = runsCapability(resolution.role, CAN_AUTHOR_CLINICAL);
  const canReview = runsCapability(resolution.role, CAN_REVIEW_AI);

  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="ai-analytics" />
      <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
        <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
          {!parsedId.success ? (
            <EmptyState
              icon={Lock}
              title="You don't have access to these insights"
              body="Ask your organization owner for access to patient records."
            />
          ) : (
            <AiInsightBoard
              patientId={patientId}
              insights={insights}
              canGenerate={canGenerate}
              canReview={canReview}
              loadFailed={loadFailed}
            />
          )}
        </div>
      </Surface>
    </>
  );
}
