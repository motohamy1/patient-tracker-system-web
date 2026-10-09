'use client';

// Allergy controls — record + resolve (ALG-01; ticket 10-04).
// Rendered only for clinical authors (pages gate); actions re-check.
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { recordAllergyAction, resolveAllergyAction } from '@/lib/allergies/actions';
import {
  ALLERGY_SEVERITIES,
  ALLERGY_SEVERITY_LABELS,
} from '@/lib/allergies/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const ERROR = "Couldn't save this allergy. Try again.";

export function NewAllergyControl({ patientId, insetFill }: { patientId: string; insetFill: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [allergen, setAllergen] = useState('');
  const [reaction, setReaction] = useState('');
  const [severity, setSeverity] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await recordAllergyAction({
      patientId,
      allergen,
      reaction,
      severity: severity === '' ? undefined : severity,
      notes,
    });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setAllergen('');
    setReaction('');
    setSeverity('');
    setNotes('');
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        Record allergy
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Record allergy" description="Add an allergy to this record.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Allergen
            <input type="text" value={allergen} onChange={(e) => setAllergen(e.target.value)} maxLength={160} required className={`${insetFill} ${FIELD}`} />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Reaction
            <input type="text" value={reaction} onChange={(e) => setReaction(e.target.value)} maxLength={200} className={`${insetFill} ${FIELD}`} />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Severity
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={`${insetFill} ${FIELD}`}>
              <option value="">Not specified</option>
              {ALLERGY_SEVERITIES.map((value) => (
                <option key={value} value={value}>{ALLERGY_SEVERITY_LABELS[value]}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} className={`${insetFill} ${FIELD}`} />
          </label>
          {error ? <p role="alert" className="text-label leading-label text-text-primary">{error}</p> : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>Save allergy</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

export function ResolveAllergyControl({
  allergyId,
  allergen,
}: {
  allergyId: string;
  allergen: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Resolve
      </Button>
      {/* Destructive/clinical action: the verb is the heading and the confirm
          label (§7) — never OK/Cancel. */}
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={`Resolve ${allergen}`}
        description="This marks the allergy resolved on the record."
      >
        <div className="flex items-center justify-end gap-sm">
          <Button variant="secondary" onClick={() => setOpen(false)}>Keep active</Button>
          <Button
            variant="primary"
            disabled={pending}
            ariaBusy={pending}
            onClick={async () => {
              setPending(true);
              setError(null);
              const result = await resolveAllergyAction({ allergyId, status: 'resolved' });
              setPending(false);
              if (!result.ok) {
                setError(ERROR);
                return;
              }
              setOpen(false);
              router.refresh();
            }}
          >
            Resolve {allergen}
          </Button>
        </div>
        {error ? <p role="alert" className="mt-sm text-label leading-label text-text-primary">{error}</p> : null}
      </Overlay>
    </>
  );
}
