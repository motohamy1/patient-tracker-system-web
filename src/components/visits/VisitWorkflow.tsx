'use client';

// VisitWorkflow — the Pre-Visit → During Visit → After Visit workflow
// (VIS-01; ticket 07-03).
//
// Client island: the stage stepper and the three stage forms. Every write goes
// through a server action that re-checks the capability and validates the
// stage sequence server-side; this component only decides what to SHOW. A
// principal without clinical authoring gets a read-only view with no forms —
// no dead controls (INV-08 / D-24).
//
// The stage stepper reads as progress, not decoration: the closed three-stage
// vocabulary from `status.ts`, the current stage emphasized by fill + raised
// shadow (never colour alone, INV-04/§4.3), completed stages quieter.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Surface } from '@/components/primitives';
import {
  advanceVisitStageAction,
  saveVisitDocumentationAction,
} from '@/lib/visits/actions';
import {
  nextStage,
  stageIndex,
  VISIT_STAGE_LABELS,
  VISIT_STAGES,
} from '@/lib/visits/status';
import type { VisitRecord } from '@/lib/visits/queries';

const FIELD_CLASSES = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const SAVE_ERROR = "Couldn't save this visit. Try again.";

function Stepper({ current }: { current: VisitRecord['stage'] }) {
  const currentIndex = stageIndex(current);
  return (
    <ol className="flex items-center gap-xs" aria-label="Visit stages">
      {VISIT_STAGES.map((stage, index) => {
        const isCurrent = index === currentIndex;
        const isDone = index < currentIndex;
        return (
          <li key={stage}>
            <span
              aria-current={isCurrent ? 'step' : undefined}
              className={[
                'inline-flex min-h-8 items-center justify-center rounded-pill px-md text-label leading-label text-text-primary',
                isCurrent
                  ? 'bg-surface-raised shadow-raised'
                  : isDone
                    ? 'bg-surface-muted'
                    : 'bg-transparent',
              ].join(' ')}
            >
              {VISIT_STAGE_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function SavedBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-body leading-body text-text-primary">{value}</span>
    </div>
  );
}

export function VisitWorkflow({
  visit,
  canAuthorClinical,
  insetFill,
}: {
  visit: VisitRecord;
  canAuthorClinical: boolean;
  insetFill: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local form state, seeded from the stored visit.
  const [reason, setReason] = useState(visit.reason ?? '');
  const [documentation, setDocumentation] = useState(visit.documentation ?? '');
  const [followUp, setFollowUp] = useState(visit.followUp ?? '');
  const [followUpAt, setFollowUpAt] = useState(visit.followUpAt ?? '');

  const successor = nextStage(visit.stage);

  async function run(task: () => Promise<{ ok: boolean }>) {
    setPending(true);
    setError(null);
    const result = await task();
    setPending(false);
    if (!result.ok) {
      setError(SAVE_ERROR);
      return;
    }
    router.refresh();
  }

  function saveDocumentation(event: FormEvent) {
    event.preventDefault();
    void run(() =>
      saveVisitDocumentationAction({
        visitId: visit.id,
        reason,
        documentation,
        followUp,
        followUpAt: followUpAt === '' ? undefined : followUpAt,
      }),
    );
  }

  return (
    <Surface variant="surface" className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Stepper current={visit.stage} />
        <span className="text-label leading-label text-text-secondary tabular-nums">
          {visit.scheduledAt.slice(0, 10)} {visit.scheduledAt.slice(11, 16)}
          {visit.location ? ` · ${visit.location}` : ''}
        </span>
      </div>

      {/* Already-captured content stays visible while the workflow advances. */}
      {visit.reason !== null ? <SavedBlock label="Reason for visit" value={visit.reason} /> : null}
      {visit.documentation !== null ? (
        <SavedBlock label="Documentation" value={visit.documentation} />
      ) : null}
      {visit.followUp !== null || visit.followUpAt !== null ? (
        <SavedBlock
          label="Follow-up"
          value={[visit.followUp, visit.followUpAt].filter(Boolean).join(' · ')}
        />
      ) : null}

      {!canAuthorClinical ? (
        <p className="text-body leading-body text-text-secondary">
          Ask a clinician to document this visit.
        </p>
      ) : (
        <form onSubmit={saveDocumentation} className="flex flex-col gap-md">
          {visit.stage === 'pre_visit' ? (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Reason for visit
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={400}
                rows={3}
                className={`${insetFill} ${FIELD_CLASSES}`}
              />
            </label>
          ) : null}

          {visit.stage === 'during_visit' ? (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Documentation
              <textarea
                value={documentation}
                onChange={(event) => setDocumentation(event.target.value)}
                maxLength={4000}
                rows={6}
                className={`${insetFill} ${FIELD_CLASSES}`}
              />
            </label>
          ) : null}

          {visit.stage === 'after_visit' ? (
            <>
              <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
                Follow-up
                <textarea
                  value={followUp}
                  onChange={(event) => setFollowUp(event.target.value)}
                  maxLength={400}
                  rows={3}
                  className={`${insetFill} ${FIELD_CLASSES}`}
                />
              </label>
              <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
                Follow-up date
                <input
                  type="date"
                  value={followUpAt}
                  onChange={(event) => setFollowUpAt(event.target.value)}
                  className={`${insetFill} ${FIELD_CLASSES}`}
                />
              </label>
            </>
          ) : null}

          {error ? (
            <p role="alert" className="text-label leading-label text-text-primary">
              {error}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-sm">
            <Button type="submit" variant="secondary" disabled={pending} ariaBusy={pending}>
              Save
            </Button>
            {successor !== null ? (
              <Button
                variant="primary"
                disabled={pending}
                ariaBusy={pending}
                onClick={() => {
                  void run(() => advanceVisitStageAction(visit.id, successor));
                }}
              >
                Move to {VISIT_STAGE_LABELS[successor]}
              </Button>
            ) : null}
          </div>
        </form>
      )}
    </Surface>
  );
}
