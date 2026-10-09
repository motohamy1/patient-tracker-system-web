'use client';

// NewVisitControl — the "New visit" entry point and its creation form
// (VIS-03; ticket 07-02).
//
// Client island: overlay + form state + the create call. It is rendered only
// for principals holding CAN_SCHEDULE, so a non-scheduler never sees a control
// they cannot use. The clinical `reason` field appears ONLY for a principal
// holding CAN_AUTHOR_CLINICAL — and the server action nulls it otherwise, and
// the DB guard refuses it underneath (three layers, one rule).
//
// The event inset fill arrives as a PROP (`insetFill`) — a client chunk may
// not import the module that reads tokens.json with node:fs
// (NewPatientControl precedent).
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { createVisitAction } from '@/lib/visits/actions';
import { createVisitSchema } from '@/lib/visits/schemas';

const CREATE_ERROR = "Couldn't create this visit. Try again.";

const FIELD_CLASSES = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function NewVisitControl({
  patientId,
  canAuthorClinical,
  insetFill,
}: {
  patientId: string;
  canAuthorClinical: boolean;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [visitType, setVisitType] = useState('');
  const [location, setLocation] = useState('');
  const [reason, setReason] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setScheduledAt('');
    setVisitType('');
    setLocation('');
    setReason('');
    setError(null);
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = createVisitSchema.safeParse({
      patientId,
      scheduledAt,
      visitType,
      location,
      reason: canAuthorClinical ? reason : undefined,
    });
    if (!parsed.success) {
      setError('Check the date and try again.');
      return;
    }
    setPending(true);
    const result = await createVisitAction(parsed.data);
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
      <Button variant="primary" icon={CalendarPlus} onClick={() => setOpen(true)}>
        New visit
      </Button>

      <Overlay
        open={open}
        onClose={() => {
          setOpen(false);
          reset();
        }}
        title="New visit"
        description="Schedule a visit for this patient."
      >
        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Date and time
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              required
              className={`${insetFill} ${FIELD_CLASSES}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Visit type
            <input
              type="text"
              value={visitType}
              onChange={(event) => setVisitType(event.target.value)}
              maxLength={80}
              className={`${insetFill} ${FIELD_CLASSES}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Location
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={120}
              className={`${insetFill} ${FIELD_CLASSES}`}
            />
          </label>
          {canAuthorClinical ? (
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

          {error ? (
            <p className="text-label leading-label text-text-primary" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
              Create visit
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
