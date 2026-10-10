'use client';

// QuickLogControl — the patient's only authoring surface (Phase 13, ticket
// 13-03; PTH-02/03).
//
// A measurement from the closed vocabulary, or a note. The form narrows the
// unit choices per kind and shows a second field only for blood pressure; the
// action re-checks the patient capability server-side and the database
// re-derives the row's patient from the session — the payload never names one.
//
// Copy discipline (§27): logging is never framed as a game. No streaks, no
// points, no celebration.
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { logObservationAction } from '@/lib/patient/actions';
import { enqueueDraft, queueEntry } from '@/lib/sync/store';
import {
  OBSERVATION_KINDS,
  OBSERVATION_KIND_LABELS,
  OBSERVATION_KIND_UNITS,
  observationValueShape,
} from '@/lib/patient/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-10';

export function QuickLogControl({ insetFill }: { insetFill: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<string>('weight');
  const [value, setValue] = useState('');
  const [secondValue, setSecondValue] = useState('');
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
  const [observedAt, setObservedAt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shape = observationValueShape(kind as (typeof OBSERVATION_KINDS)[number]);
  const units = OBSERVATION_KIND_UNITS[kind as (typeof OBSERVATION_KINDS)[number]];

  function reset() {
    setKind('weight');
    setValue('');
    setSecondValue('');
    setUnit('');
    setNote('');
    setObservedAt('');
    setError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const payload = {
      kind,
      value,
      secondValue,
      unit: unit === '' ? undefined : unit,
      note,
      observedAt: observedAt === '' ? undefined : new Date(observedAt).toISOString(),
    };
    const result = await logObservationAction(payload);
    setPending(false);
    if (!result.ok) {
      // Phase 19 (OFF-02): the send failed, so the measurement is held on
      // THIS DEVICE and the copy says exactly that — it is never described
      // as logged. The queue panel shows its state and retries it.
      const draftId = enqueueDraft('observation', {
        ...payload,
        label: `${OBSERVATION_KIND_LABELS[kind as (typeof OBSERVATION_KINDS)[number]]} entry`,
      });
      queueEntry(draftId);
      setError(
        "That couldn't be logged, so it's held on this device. It is not in your record yet — you can try sending it again below.",
      );
      return;
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        Add a measurement
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Add a measurement"
        description="Record a weight, blood pressure, glucose, temperature, pulse, or a note for your care team."
      >
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            What are you logging?
            <select
              value={kind}
              onChange={(event) => {
                setKind(event.target.value);
                setUnit('');
              }}
              className={`${insetFill} ${FIELD}`}
            >
              {OBSERVATION_KINDS.map((option) => (
                <option key={option} value={option}>
                  {OBSERVATION_KIND_LABELS[option]}
                </option>
              ))}
            </select>
          </label>

          {shape === 'single' ? (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Measurement
              <input
                type="text"
                inputMode="decimal"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                className={`${insetFill} ${FIELD}`}
                required
              />
            </label>
          ) : null}

          {shape === 'dual' ? (
            <div className="flex flex-wrap gap-md">
              <label className="flex flex-1 flex-col gap-xs text-label leading-label text-text-primary">
                Systolic (upper)
                <input
                  type="text"
                  inputMode="decimal"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  className={`${insetFill} ${FIELD}`}
                  required
                />
              </label>
              <label className="flex flex-1 flex-col gap-xs text-label leading-label text-text-primary">
                Diastolic (lower)
                <input
                  type="text"
                  inputMode="decimal"
                  value={secondValue}
                  onChange={(event) => setSecondValue(event.target.value)}
                  className={`${insetFill} ${FIELD}`}
                  required
                />
              </label>
            </div>
          ) : null}

          {units.length > 0 ? (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Unit
              <select value={unit} onChange={(event) => setUnit(event.target.value)} className={`${insetFill} ${FIELD}`}>
                <option value="">Not specified</option>
                {units.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {shape === 'none' ? (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Note
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={1000}
                className={`${insetFill} ${FIELD}`}
                required
              />
            </label>
          ) : (
            <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
              Note (optional)
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={2}
                maxLength={1000}
                className={`${insetFill} ${FIELD}`}
              />
            </label>
          )}

          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            When was it taken?
            <input
              type="datetime-local"
              value={observedAt}
              onChange={(event) => setObservedAt(event.target.value)}
              className={`${insetFill} ${FIELD}`}
            />
          </label>

          {error ? (
            <p role="alert" className="text-label leading-label text-text-primary">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
              Save to my record
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
