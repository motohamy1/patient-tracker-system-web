'use client';

// ConsultationRoom — the telehealth consultation workspace (Phase 17, ticket
// 17-03; TH-01/02).
//
// Client island: start / complete / cancel go through server actions that
// re-check the capability and re-derive the org; this component decides what
// to SHOW. The centre of the surface is deliberately NOT a video product:
// the transport is one honest panel (not connected, and what that means),
// the patient's context sits beside it, and the clinical workspace stays one
// click away during the call (§17: not a generic Zoom clone).
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import {
  cancelConsultationAction,
  completeConsultationAction,
  startConsultationAction,
} from '@/lib/telehealth/actions';
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_TOKEN,
  TRANSPORT_EXPLANATION,
  TRANSPORT_LABELS,
  type SessionStatus,
  type TransportState,
} from '@/lib/telehealth/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const SAVE_ERROR = "This consultation couldn't be updated. Try again.";

/** The eight workspace tabs — the record stays reachable during the call. */
const WORKSPACE_LINKS = [
  { slug: 'overview', label: 'Overview' },
  { slug: 'ai-analytics', label: 'AI Analytics' },
  { slug: 'visits', label: 'Visits' },
  { slug: 'medications', label: 'Medications' },
  { slug: 'labs', label: 'Labs' },
  { slug: 'imaging', label: 'Imaging' },
  { slug: 'allergies', label: 'Allergies' },
  { slug: 'genetics', label: 'Genetics' },
] as const;

export function ConsultationRoom({
  visitId,
  patientId,
  patientName,
  sessionStatus,
  transport,
  joinToken,
  reason,
  documentation,
  canAuthorClinical,
  insetFill,
}: {
  visitId: string;
  patientId: string;
  patientName: string;
  sessionStatus: SessionStatus | null;
  transport: TransportState;
  joinToken: string | null;
  reason: string | null;
  documentation: string | null;
  canAuthorClinical: boolean;
  insetFill: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  async function start() {
    setPending('start');
    setError(null);
    const result = await startConsultationAction({ visitId });
    setPending(null);
    if (!result.ok) setError(SAVE_ERROR);
  }

  async function complete(event: FormEvent) {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const data = new FormData(form);
    setPending('complete');
    setError(null);
    const result = await completeConsultationAction({
      visitId,
      reason: reason ?? undefined,
      documentation: String(data.get('documentation') ?? ''),
      followUp: String(data.get('followUp') ?? ''),
      followUpAt: String(data.get('followUpAt') ?? '') || undefined,
    });
    setPending(null);
    if (!result.ok) setError(SAVE_ERROR);
  }

  async function cancel() {
    setPending('cancel');
    setError(null);
    const result = await cancelConsultationAction({ visitId, reason: cancelReason });
    setPending(null);
    setCancelOpen(false);
    if (!result.ok) setError(SAVE_ERROR);
  }

  const hasActiveSession = sessionStatus === 'scheduled' || sessionStatus === 'in_progress';
  const isInProgress = sessionStatus === 'in_progress';

  return (
    <div className="flex flex-col gap-lg">
      {/* The session state — one line, closed vocabulary, no noise. */}
      <Surface variant="surface" className="flex flex-col gap-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h2 className="text-heading font-semibold leading-heading text-text-primary">{patientName}</h2>
          {sessionStatus !== null ? (
            <Pill tone={SESSION_STATUS_TOKEN[sessionStatus]} label={SESSION_STATUS_LABELS[sessionStatus]} />
          ) : (
            <Pill tone="neutral" label="Not started" />
          )}
        </div>

        {/* The transport, honestly: no provider is connected, and the surface
            says exactly that rather than faking a room. */}
        <div className="flex flex-col gap-xs">
          <span className="text-label leading-label font-semibold text-text-primary">
            {TRANSPORT_LABELS[transport]}
          </span>
          <p className="text-body leading-body text-text-secondary">{TRANSPORT_EXPLANATION[transport]}</p>
        </div>

        {joinToken !== null ? (
          <p className="text-label leading-label text-text-secondary">
            Consultation reference{' '}
            <span className="tabular-nums text-text-primary">{joinToken.slice(0, 8)}</span>
          </p>
        ) : null}

        {error ? (
          <p role="alert" className="text-label leading-label text-text-primary">
            {error}
          </p>
        ) : null}

        {canAuthorClinical && !hasActiveSession ? (
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="primary" onClick={start} disabled={pending === 'start'} ariaBusy={pending === 'start'}>
              Start consultation
            </Button>
            <span className="text-label leading-label text-text-secondary">
              Starting moves this appointment to During Visit.
            </span>
          </div>
        ) : null}

        {canAuthorClinical && sessionStatus === 'scheduled' ? (
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="primary" onClick={start} disabled={pending === 'start'} ariaBusy={pending === 'start'}>
              Begin the call
            </Button>
          </div>
        ) : null}

        {canAuthorClinical && hasActiveSession ? (
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="secondary" onClick={() => setCancelOpen(true)}>
              Cancel consultation
            </Button>
          </div>
        ) : null}

        {!canAuthorClinical ? (
          <p className="text-label leading-label text-text-secondary">
            Starting and completing a consultation is the clinician&apos;s responsibility — this view is read-only for
            your role.
          </p>
        ) : null}
      </Surface>

      {/* Completion — the same documentation block an in-person visit writes. */}
      <Surface variant="surface" className="flex flex-col gap-md">
        <h3 className="text-label leading-label font-semibold text-text-primary">Consultation notes</h3>
        {reason !== null ? (
          <p className="text-body leading-body text-text-secondary">Reason for visit: {reason}</p>
        ) : null}
        {documentation !== null && documentation !== '' ? (
          <p className="whitespace-pre-wrap text-body leading-body text-text-primary">{documentation}</p>
        ) : null}

        {canAuthorClinical && isInProgress ? (
          <form onSubmit={complete} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Documentation
              <textarea
                name="documentation"
                rows={5}
                defaultValue={documentation ?? ''}
                placeholder="What was discussed, decided and prescribed — the same record an in-person visit leaves."
                className={`${insetFill} ${FIELD}`}
              />
            </label>
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Follow-up
              <input
                type="text"
                name="followUp"
                maxLength={2000}
                className={`${insetFill} ${FIELD}`}
              />
            </label>
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Follow-up date
              <input
                type="date"
                name="followUpAt"
                className={`${insetFill} ${FIELD}`}
              />
            </label>
            <div className="flex items-center justify-end gap-sm">
              <Button type="submit" variant="primary" disabled={pending === 'complete'} ariaBusy={pending === 'complete'}>
                Complete consultation
              </Button>
            </div>
          </form>
        ) : null}

        {sessionStatus === 'completed' ? (
          <p className="text-label leading-label text-text-secondary">
            This consultation is complete and its documentation lives in the visit record.
          </p>
        ) : null}
      </Surface>

      {/* The clinical workspace, one click away — the record is usable during
          the call (TH-01), not buried behind it. */}
      <Surface variant="surface" className="flex flex-col gap-sm">
        <h3 className="text-label leading-label font-semibold text-text-primary">Clinical workspace</h3>
        <nav aria-label="Clinical workspace" className="flex flex-wrap gap-md">
          {WORKSPACE_LINKS.map((link) => (
            <Link
              key={link.slug}
              href={`/provider/patients/${patientId}/${link.slug}`}
              className="text-label leading-label text-text-secondary hover:text-text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Surface>

      <Overlay
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this consultation"
        description="The appointment stays in the record with your reason."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void cancel();
          }}
          className="flex flex-col gap-md"
        >
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Reason
            <input
              type="text"
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              maxLength={500}
              required
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              Keep consultation
            </Button>
            <Button type="submit" variant="primary" disabled={pending === 'cancel'} ariaBusy={pending === 'cancel'}>
              Cancel consultation
            </Button>
          </div>
        </form>
      </Overlay>
    </div>
  );
}
