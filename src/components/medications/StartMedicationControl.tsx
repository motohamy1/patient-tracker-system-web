'use client';

// StartMedicationControl — the "New medication" entry point (MED-01).
//
// Client island: overlay + form + the start call. Rendered only for principals
// holding CAN_AUTHOR_CLINICAL (starting a medication is clinical authoring),
// and the action re-checks server-side — the UI is a courtesy, never the
// boundary. The inset fill arrives as a PROP because a client chunk may not
// import the module that reads tokens.json with node:fs (NewPatientControl
// precedent).
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Pill as PillIcon } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { startMedicationAction } from '@/lib/medications/actions';
import { startMedicationSchema } from '@/lib/medications/schemas';
import {
  MEDICATION_FREQUENCIES,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTES,
  MEDICATION_ROUTE_LABELS,
} from '@/lib/medications/status';

const CREATE_ERROR = "Couldn't start this medication. Try again.";
const FIELD_CLASSES = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function StartMedicationControl({
  patientId,
  insetFill,
}: {
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [doseAmount, setDoseAmount] = useState('');
  const [doseUnit, setDoseUnit] = useState('');
  const [frequency, setFrequency] = useState('');
  const [route, setRoute] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName('');
    setDoseAmount('');
    setDoseUnit('');
    setFrequency('');
    setRoute('');
    setStartedAt('');
    setError(null);
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = startMedicationSchema.safeParse({
      patientId,
      name,
      doseAmount: doseAmount === '' ? undefined : doseAmount,
      doseUnit,
      frequency: frequency === '' ? undefined : frequency,
      route: route === '' ? undefined : route,
      startedAt: startedAt === '' ? undefined : startedAt,
    });
    if (!parsed.success) {
      setError('Check the medication details and try again.');
      return;
    }
    setPending(true);
    const result = await startMedicationAction(parsed.data);
    setPending(false);
    if (!result.ok) {
      setError(CREATE_ERROR);
      return;
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={PillIcon} onClick={() => setOpen(true)}>
        New medication
      </Button>

      <Overlay
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="New medication"
        description="Start a medication for this patient."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Medication
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={120}
              required
              className={`${insetFill} ${FIELD_CLASSES}`}
            />
          </label>
          <div className="flex gap-md">
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Dose
              <input
                type="number"
                inputMode="decimal"
                step="0.001"
                min="0"
                value={doseAmount}
                onChange={(event) => setDoseAmount(event.target.value)}
                className={`${insetFill} ${FIELD_CLASSES}`}
              />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Unit
              <input
                type="text"
                value={doseUnit}
                onChange={(event) => setDoseUnit(event.target.value)}
                maxLength={20}
                placeholder="mg"
                className={`${insetFill} ${FIELD_CLASSES}`}
              />
            </label>
          </div>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Frequency
            <select
              value={frequency}
              onChange={(event) => setFrequency(event.target.value)}
              className={`${insetFill} ${FIELD_CLASSES}`}
            >
              <option value="">Not specified</option>
              {MEDICATION_FREQUENCIES.map((value) => (
                <option key={value} value={value}>
                  {MEDICATION_FREQUENCY_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Route
            <select
              value={route}
              onChange={(event) => setRoute(event.target.value)}
              className={`${insetFill} ${FIELD_CLASSES}`}
            >
              <option value="">Not specified</option>
              {MEDICATION_ROUTES.map((value) => (
                <option key={value} value={value}>
                  {MEDICATION_ROUTE_LABELS[value]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Start date
            <input
              type="date"
              value={startedAt}
              onChange={(event) => setStartedAt(event.target.value)}
              className={`${insetFill} ${FIELD_CLASSES}`}
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
              Start medication
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
