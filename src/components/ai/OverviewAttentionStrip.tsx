// OverviewAttentionStrip — the Overview's compact bridge into AI Analytics
// (Phase 11, ticket 11-03; WSP-02).
//
// Shows the patient's attention insights — the §10 "what needs attention"
// facts — as a quiet strip under the timeline, linking to the AI Analytics
// tab. It renders NOTHING when there are no attention items or the insight
// read failed: the Overview never breaks for a derived signal, and an empty
// strip is honest rather than decorative.
import Link from 'next/link';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import type { AiInsightRecord } from '@/lib/ai/queries';
import { REVIEW_STATE_LABELS } from '@/lib/ai/status';
import { tabHref } from '@/app/(provider)/provider/patients/[patientId]/tabs';

export function OverviewAttentionStrip({
  items,
  patientId,
}: {
  items: readonly AiInsightRecord[];
  patientId: string;
}) {
  if (items.length === 0) return null;

  const pending = items.filter((item) => item.reviewState === 'pending').length;

  return (
    <Surface variant="surface" className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Needs attention</h2>
        <span className="flex items-center gap-sm">
          {pending > 0 ? <Pill tone="warning" label={`${pending} awaiting review`} /> : null}
          <Link
            href={tabHref(patientId, 'ai-analytics')}
            className="text-label leading-label text-text-secondary hover:text-text-primary"
          >
            Open AI Analytics
          </Link>
        </span>
      </div>
      <ul className="flex flex-col gap-xs">
        {items.map((item) => (
          <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-sm">
            <span className="min-w-0 text-body leading-body text-text-primary">{item.title}</span>
            <span className="text-label leading-label text-text-secondary tabular-nums">
              {REVIEW_STATE_LABELS[item.reviewState]}
            </span>
          </li>
        ))}
      </ul>
    </Surface>
  );
}
