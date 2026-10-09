'use client';

// AiInsightBoard — the AI Analytics tab body (Phase 11, ticket 11-03).
//
// Renders STORED insights only: this component never generates, invents or
// reorders clinical content — the server action does the reading, and 0010
// guarantees every row carries provenance and an explicit review state.
//
// Provenance is legible at a glance (AI-02): a provenance pill, a review-state
// pill, and the reviewer's date on reviewed rows. An unreviewed insight can
// never read as clinician-verified — that is the whole point of the phase.
//
// Review controls appear only for the roles 0010's UPDATE policy names
// (provider_doctor + nurse, gated here by CAN_REVIEW_AI); the actions re-check
// server-side. Generation is doctor-only (CAN_AUTHOR_CLINICAL).
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { ChartLine } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { Overlay } from '@/components/overlays/Overlay';
import { StateVariant } from '@/components/state/StateVariant';
import { generateAiInsightsAction, reviewAiInsightAction } from '@/lib/ai/actions';
import {
  INSIGHT_KINDS,
  INSIGHT_KIND_BLURBS,
  INSIGHT_KIND_LABELS,
  INSIGHT_PROVENANCE_LABELS,
  REVIEW_STATE_LABELS,
  type AiInsightRecord,
  type InsightEvidenceRef,
} from '@/lib/ai/status';
import { tabHref, type WorkspaceTabSlug } from '@/app/(provider)/provider/patients/[patientId]/tabs';

const REVIEW_TONE: Record<AiInsightRecord['reviewState'], 'warning' | 'success' | 'neutral'> = {
  pending: 'warning',
  accepted: 'success',
  dismissed: 'neutral',
};

/** Which workspace tab owns an evidence row (the honest destination). */
function evidenceTab(ref: InsightEvidenceRef): WorkspaceTabSlug {
  switch (ref.table) {
    case 'visits':
      return 'visits';
    case 'medications':
    case 'medication_events':
      return 'medications';
    case 'lab_orders':
    case 'lab_results':
      return 'labs';
    case 'imaging_orders':
    case 'imaging_results':
      return 'imaging';
    case 'allergies':
      return 'allergies';
    default:
      return 'overview';
  }
}

function windowLabel(insight: AiInsightRecord): string | null {
  if (insight.window === null) return null;
  const from = new Date(insight.window.from).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const to = new Date(insight.window.to).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  return `Covering ${from} – ${to}`;
}

/** One insight: title, observation, the records it came from, provenance, review. */
function InsightCard({
  insight,
  patientId,
  canReview,
}: {
  insight: AiInsightRecord;
  patientId: string;
  canReview: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<'accepted' | 'dismissed' | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const period = windowLabel(insight);

  async function submit(decision: 'accepted' | 'dismissed') {
    setPending(true);
    setFailed(false);
    const result = await reviewAiInsightAction({ insightId: insight.id, decision });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setConfirming(null);
    router.refresh();
  }

  return (
    <li>
      <Surface variant="surface" className="flex flex-col gap-md">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <h3 className="min-w-0 text-heading font-semibold leading-heading text-text-primary">{insight.title}</h3>
          <span className="flex flex-wrap items-center gap-sm">
            <Pill tone="neutral" label={INSIGHT_PROVENANCE_LABELS[insight.provenance]} />
            <Pill
              tone={REVIEW_TONE[insight.reviewState]}
              label={
                insight.reviewState === 'pending'
                  ? REVIEW_STATE_LABELS.pending
                  : `${REVIEW_STATE_LABELS[insight.reviewState]}${
                      insight.reviewedAt !== null ? ` ${insight.reviewedAt.slice(0, 10)}` : ''
                    }`
              }
            />
          </span>
        </div>

        <p className="text-body leading-body text-text-secondary">{insight.body}</p>

        {period !== null ? (
          <p className="text-label leading-label text-text-secondary tabular-nums">{period}</p>
        ) : null}

        <div className="flex flex-col gap-xs">
          <span className="text-label leading-label font-semibold text-text-primary">From the record</span>
          <ul className="flex flex-wrap gap-x-md gap-y-xs">
            {insight.evidence.map((ref) => (
              <li key={`${ref.table}:${ref.id}`}>
                <Link
                  href={tabHref(patientId, evidenceTab(ref))}
                  className="text-label leading-label text-text-secondary hover:text-text-primary"
                >
                  {ref.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {canReview && insight.reviewState === 'pending' ? (
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="secondary" onClick={() => setConfirming('accepted')}>
              Accept
            </Button>
            <Button variant="ghost" onClick={() => setConfirming('dismissed')}>
              Dismiss
            </Button>
            {failed ? (
              <span role="alert" className="text-label leading-label text-text-primary">
                That review didn&apos;t save. Try again.
              </span>
            ) : null}
          </div>
        ) : null}

        {confirming !== null ? (
          <Overlay
            open
            onClose={() => setConfirming(null)}
            title={confirming === 'accepted' ? 'Accept this insight' : 'Dismiss this insight'}
            description={
              confirming === 'accepted'
                ? 'Accepting records that you reviewed this observation and agree with it. This cannot be undone.'
                : 'Dismissing records that you reviewed this observation and it does not need attention. This cannot be undone.'
            }
          >
            <div className="flex items-center justify-end gap-sm">
              <Button variant="secondary" onClick={() => setConfirming(null)}>
                Keep unreviewed
              </Button>
              <Button
                variant="primary"
                disabled={pending}
                ariaBusy={pending}
                onClick={() => void submit(confirming)}
              >
                {confirming === 'accepted' ? 'Accept insight' : 'Dismiss insight'}
              </Button>
            </div>
          </Overlay>
        ) : null}
      </Surface>
    </li>
  );
}

export function AiInsightBoard({
  patientId,
  insights,
  canGenerate,
  canReview,
  loadFailed,
}: {
  patientId: string;
  insights: readonly AiInsightRecord[];
  canGenerate: boolean;
  canReview: boolean;
  loadFailed: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  async function generate() {
    setPending(true);
    setFailed(false);
    const result = await generateAiInsightsAction({ patientId });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    router.refresh();
  }

  const groups = INSIGHT_KINDS.map((kind) => ({
    kind,
    items: insights.filter((insight) => insight.kind === kind),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">AI Analytics</h1>
        {canGenerate ? (
          <Button variant="primary" icon={ChartLine} disabled={pending} ariaBusy={pending} onClick={() => void generate()}>
            {insights.length > 0 ? 'Regenerate insights' : 'Generate insights'}
          </Button>
        ) : null}
      </div>

      <p className="max-w-[64rem] text-body leading-body text-text-secondary">
        Observations derived from this patient&apos;s stored record. Every item names the records it came from
        and stays unreviewed until a clinician accepts or dismisses it.
      </p>

      {loadFailed || failed ? (
        <StateVariant surface="AI insights" retryHref={tabHref(patientId, 'ai-analytics')} />
      ) : insights.length === 0 ? (
        <EmptyState
          title="No insights yet"
          body="Generate insights to summarise what changed, what needs attention and what the trends show."
        />
      ) : (
        groups.map((group) => (
          <section key={group.kind} className="flex flex-col gap-md" aria-label={INSIGHT_KIND_LABELS[group.kind]}>
            <div className="flex flex-col gap-xs">
              <h2 className="text-heading font-semibold leading-heading text-text-primary">
                {INSIGHT_KIND_LABELS[group.kind]}
              </h2>
              <p className="text-label leading-label text-text-secondary">{INSIGHT_KIND_BLURBS[group.kind]}</p>
            </div>
            <ul className="flex flex-col gap-md">
              {group.items.map((insight) => (
                <InsightCard key={insight.id} insight={insight} patientId={patientId} canReview={canReview} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
