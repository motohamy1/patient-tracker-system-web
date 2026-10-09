'use client';

// ExtractionVerifier — the clinician's half of the §11 pipeline (Phase 12,
// ticket 12-03).
//
// The original image sits beside the extracted fields for the whole review.
// Every field is either confirmed by the clinician or visibly UNCLEAR — the
// pipeline never guesses (OCR-03), and the confirm action refuses to persist
// while the medication name is unconfirmed. A rejected extraction is a
// recorded decision, not a deletion.
//
// Provenance is preserved forever: the persisted medication carries
// source='ai-extracted' + verification='clinician-verified', so it reads as
// extracted-and-confirmed, never as directly authored (§23).
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Pill } from '@/components/primitives/Pill';
import { Overlay } from '@/components/overlays/Overlay';
import { StateVariant } from '@/components/state/StateVariant';
import { Surface } from '@/components/primitives';
import { confirmExtractionAction, rejectExtractionAction, requestExtractionAction } from '@/lib/ocr/actions';
import {
  EXTRACTED_FIELD_LABELS,
  EXTRACTION_STATUS_LABELS,
  EXTRACTION_STATUS_TOKEN,
  LOW_CONFIDENCE,
  type ExtractedField,
  type ExtractedFieldKey,
  type OcrExtractionRecord,
} from '@/lib/ocr/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const UNCLEAR = 'border-0 ring-1 ring-inset ring-[--color-critical]';
const CLEAR = '';

function fieldOf(payload: OcrExtractionRecord['payload'], key: ExtractedFieldKey): ExtractedField | undefined {
  return payload?.fields.find((field) => field.key === key);
}

export function ExtractionVerifier({
  extraction,
  imageUrl,
  patientId,
  insetFill,
}: {
  extraction: OcrExtractionRecord;
  imageUrl: string | null;
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');

  const payload = extraction.payload;

  // Seed the confirmed values from the payload once (a stored payload never
  // changes — the surface owns its own edit state after that).
  useEffect(() => {
    if (payload === null) return;
    const seed: Record<string, string> = {};
    for (const field of payload.fields) seed[field.key] = field.value;
    setValues(seed);
  }, [payload]);

  const awaiting = extraction.status === 'awaiting_extraction';
  const decided = extraction.status === 'verified' || extraction.status === 'rejected';

  async function runExtraction() {
    setPending(true);
    setError(null);
    const result = await requestExtractionAction({ extractionId: extraction.id });
    setPending(false);
    if (!result.ok) {
      setError("The extraction couldn't run. Try again.");
      return;
    }
    router.refresh();
  }

  async function confirm(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await confirmExtractionAction({
      extractionId: extraction.id,
      fields: {
        medication_name: values.medication_name ?? '',
        dosage: values.dosage ?? '',
        frequency: values.frequency ?? '',
        route: values.route ?? '',
        duration: values.duration ?? '',
        notes: values.notes ?? '',
      },
    });
    setPending(false);
    if (!result.ok) {
      setError(
        result.kind === 'invalid'
          ? 'Confirm the medication name before recording.'
          : "That medication couldn't be recorded. Try again.",
      );
      return;
    }
    router.push(`/provider/patients/${patientId}/medications`);
    router.refresh();
  }

  async function reject() {
    setPending(true);
    setError(null);
    const result = await rejectExtractionAction({ extractionId: extraction.id, reason });
    setPending(false);
    if (!result.ok) {
      setError('Say why this extraction is not usable.');
      return;
    }
    setRejecting(false);
    setReason('');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h1 className="text-heading font-semibold leading-heading text-text-primary">
          {extraction.documentName ?? 'Prescription'}
        </h1>
        <Pill
          tone={EXTRACTION_STATUS_TOKEN[extraction.status]}
          label={EXTRACTION_STATUS_LABELS[extraction.status]}
        />
      </div>

      {decided ? (
        <Surface variant="surface" className="flex flex-col gap-md">
          <p className="text-body leading-body text-text-primary">
            {extraction.status === 'verified'
              ? 'This prescription was verified and recorded as a medication with its extracted origin preserved.'
              : 'This extraction was rejected; the decision is kept on record with its reason.'}
          </p>
          {extraction.rejectionReason !== null ? (
            <p className="text-label leading-label text-text-secondary">Reason: {extraction.rejectionReason}</p>
          ) : null}
          <div>
            <Button variant="secondary" onClick={() => router.push(`/provider/patients/${patientId}/medications`)}>
              Back to medications
            </Button>
          </div>
        </Surface>
      ) : (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* The original — the reference of record (§11). */}
          <Surface variant="surface" className="flex flex-col gap-sm">
            <h2 className="text-label leading-label font-semibold text-text-primary">Original</h2>
            {imageUrl !== null ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={`Uploaded prescription: ${extraction.documentName ?? 'prescription image'}`}
                className="max-h-[32rem] w-full rounded-md object-contain"
              />
            ) : (
              <EmptyState
                title="The image is unavailable"
                body="The stored file could not be opened. You can still confirm the fields you read from the original."
              />
            )}
          </Surface>

          {/* The extracted fields + the clinician's confirmation. */}
          <Surface variant="surface" className="flex flex-col gap-md">
            <h2 className="text-label leading-label font-semibold text-text-primary">
              {awaiting ? 'Extraction' : 'Extracted fields — confirm every value'}
            </h2>

            {awaiting ? (
              <div className="flex flex-col gap-md">
                <p className="text-body leading-body text-text-secondary">
                  Run the extraction to read the image. Fields the pipeline cannot read stay unclear — you
                  confirm or correct every value against the original before anything is recorded.
                </p>
                {error ? (
                  <p role="alert" className="text-label leading-label text-text-primary">
                    {error}
                  </p>
                ) : null}
                <div>
                  <Button variant="primary" disabled={pending} ariaBusy={pending} onClick={() => void runExtraction()}>
                    Run extraction
                  </Button>
                </div>
              </div>
            ) : payload === null ? (
              <StateVariant surface="extracted fields" retryHref={`/provider/patients/${patientId}/medications`} />
            ) : (
              <form onSubmit={confirm} className="flex flex-col gap-md">
                {payload.reason !== undefined ? (
                  <p className="text-body leading-body text-text-secondary">{payload.reason}</p>
                ) : null}

                {(['medication_name', 'dosage', 'frequency', 'route', 'duration', 'notes'] as const).map((key) => {
                  const field = fieldOf(payload, key);
                  const unclear =
                    field === undefined ||
                    field.value.trim() === '' ||
                    (field.confidence !== null && field.confidence < LOW_CONFIDENCE);
                  const candidates = field?.candidates ?? [];
                  return (
                    <label key={key} className="flex flex-col gap-xs text-label leading-label text-text-primary">
                      <span className="flex flex-wrap items-center gap-sm">
                        {EXTRACTED_FIELD_LABELS[key]}
                        {unclear ? <Pill tone="critical" label="Unclear" /> : null}
                        {field !== undefined && !unclear && field.confidence !== null ? (
                          <span className="text-label leading-label text-text-secondary tabular-nums">
                            read at {Math.round(field.confidence * 100)}% confidence
                          </span>
                        ) : null}
                      </span>
                      <input
                        type="text"
                        value={values[key] ?? ''}
                        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                        className={`${insetFill} ${FIELD} ${unclear ? UNCLEAR : CLEAR}`}
                        maxLength={key === 'notes' ? 1000 : 200}
                      />
                      {candidates.length > 0 ? (
                        <span className="flex flex-wrap items-center gap-sm">
                          <span className="text-label leading-label text-text-secondary">From this record:</span>
                          {candidates.map((candidate) => (
                            <button
                              key={candidate}
                              type="button"
                              className="rounded-pill bg-surface-muted px-md py-sm text-label leading-label text-text-primary"
                              onClick={() => setValues((current) => ({ ...current, [key]: candidate }))}
                            >
                              {candidate}
                            </button>
                          ))}
                        </span>
                      ) : null}
                    </label>
                  );
                })}

                {error ? (
                  <p role="alert" className="text-label leading-label text-text-primary">
                    {error}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <Button variant="ghost" onClick={() => setRejecting(true)}>
                    Reject extraction
                  </Button>
                  <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
                    Confirm and record
                  </Button>
                </div>
              </form>
            )}
          </Surface>
        </div>
      )}

      {rejecting ? (
        <Overlay
          open
          onClose={() => setRejecting(false)}
          title="Reject this extraction"
          description="The reason is kept on the record. Nothing from this prescription is persisted."
        >
          <div className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Reason
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                rows={3}
                maxLength={400}
                className={`${insetFill} ${FIELD}`}
                required
              />
            </label>
            {error ? (
              <p role="alert" className="text-label leading-label text-text-primary">
                {error}
              </p>
            ) : null}
            <div className="flex items-center justify-end gap-sm">
              <Button variant="secondary" onClick={() => setRejecting(false)}>
                Keep reviewing
              </Button>
              <Button variant="primary" disabled={pending} ariaBusy={pending} onClick={() => void reject()}>
                Reject extraction
              </Button>
            </div>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}
