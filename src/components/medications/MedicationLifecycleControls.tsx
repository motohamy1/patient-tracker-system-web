'use client';

// MedicationLifecycleControls — pause / resume / stop + structured change
// (MED-01).
//
// Client island: transition calls and the change form. Only LEGAL transitions
// are rendered (MEDICATION_STATUS_TRANSITIONS is the one table the server and
// this UI share), so no dead control ships. Stopping is destructive and
// confirms with the clinical verb as the heading and the confirm label (§7:
// never OK/Cancel). Change edits the structured dose/frequency/route — the DB
// trigger writes the matching `changed` history row.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import {
  changeMedicationAction,
  pauseMedicationAction,
  resumeMedicationAction,
  stopMedicationAction,
} from '@/lib/medications/actions';
import { changeMedicationSchema } from '@/lib/medications/schemas';
import {
  canTransition,
  MEDICATION_FREQUENCIES,
  MEDICATION_FREQUENCY_LABELS,
  MEDICATION_ROUTES,
  MEDICATION_ROUTE_LABELS,
} from '@/lib/medications/status';
import type { MedicationRecord } from '@/lib/medications/queries';

const ERROR_COPY = "Couldn't update this medication. Try again.";
const FIELD_CLASSES = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function MedicationLifecycleControls({
  medication,
  insetFill,
}: {
  medication: MedicationRecord;
  insetFill: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const [name, setName] = useState(medication.name);
  const [doseAmount, setDoseAmount] = useState(
    medication.doseAmount === null ? '' : String(medication.doseAmount),
  );
  const [doseUnit, setDoseUnit] = useState(medication.doseUnit ?? '');
  const [frequency, setFrequency] = useState(medication.frequency ?? '');
  const [route, setRoute] = useState(medication.route ?? '');

  async function run(task: () => Promise<{ ok: boolean }>) {
    setPending(true);
    setError(null);
    const result = await task();
    setPending(false);
    if (!result.ok) {
      setError(ERROR_COPY);
      return false;
    }
    router.refresh();
    return true;
  }

  async function onChange(event: FormEvent) {
    event.preventDefault();
    const parsed = changeMedicationSchema.safeParse({
      medicationId: medication.id,
      name,
      doseAmount: doseAmount === '' ? undefined : doseAmount,
      doseUnit,
      frequency: frequency === '' ? undefined : frequency,
      route: route === '' ? undefined : route,
    });
    if (!parsed.success) {
      setError('Check the medication details and try again.');
      return;
    }
    const ok = await run(() => changeMedicationAction(parsed.data));
    if (ok) setEditing(false);
  }

  const canPause = canTransition(medication.status, 'paused');
  const canResume = canTransition(medication.status, 'active') && medication.status === 'paused';
  const canStop = canTransition(medication.status, 'stopped');

  return (
    <div className="flex flex-wrap items-center gap-sm">
      <Button variant="secondary" onClick={() => setEditing(true)}>
        Edit details
      </Button>
      {canPause ? (
        <Button
          variant="secondary"
          disabled={pending}
          ariaBusy={pending}
          onClick={() => void run(() => pauseMedicationAction({ medicationId: medication.id }))}
        >
          Pause
        </Button>
      ) : null}
      {canResume ? (
        <Button
          variant="secondary"
          disabled={pending}
          ariaBusy={pending}
          onClick={() => void run(() => resumeMedicationAction({ medicationId: medication.id }))}
        >
          Resume
        </Button>
      ) : null}
      {canStop ? (
        <Button variant="secondary" onClick={() => setConfirmStop(true)}>
          Stop
        </Button>
      ) : null}

      {error ? (
        <p role="alert" className="w-full text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}

      <Overlay
        open={editing}
        onClose={() => setEditing(false)}
        title={`Change ${medication.name}`}
        description="Update the structured dose, frequency or route."
      >
        <form onSubmit={onChange} className="flex flex-col gap-md">
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
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
              Save change
            </Button>
          </div>
        </form>
      </Overlay>

      {/* Destructive confirmation: the clinical verb is the heading and the
          confirm label (§7), never OK/Cancel. */}
      <Overlay
        open={confirmStop}
        onClose={() => setConfirmStop(false)}
        title={`Stop ${medication.name}`}
        description="This medication becomes historical and cannot be resumed."
      >
        <div className="flex items-center justify-end gap-sm">
          <Button variant="secondary" onClick={() => setConfirmStop(false)}>
            Keep active
          </Button>
          <Button
            variant="primary"
            disabled={pending}
            ariaBusy={pending}
            onClick={async () => {
              const ok = await run(() => stopMedicationAction({ medicationId: medication.id }));
              if (ok) setConfirmStop(false);
            }}
          >
            Stop {medication.name}
          </Button>
        </div>
      </Overlay>
    </div>
  );
}
