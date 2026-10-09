'use client';

// Imaging controls — the ordering and resulting forms (LAB-02; ticket 09-05).
// Mirrors the lab controls; the result may carry an impression only (document
// attachment is a later phase's upload pipeline — the relationship columns and
// storage policies already exist, §27 no scope creep).
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { orderImagingAction, recordImagingResultAction } from '@/lib/imaging/actions';
import { IMAGING_MODALITY_SUGGESTIONS } from '@/lib/imaging/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const ERROR = "Couldn't save this imaging record. Try again.";

export function NewImagingOrderControl({
  patientId,
  insetFill,
}: {
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [modality, setModality] = useState('');
  const [bodySite, setBodySite] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await orderImagingAction({ patientId, modality, bodySite });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setModality('');
    setBodySite('');
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        New imaging order
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="New imaging order" description="Order an imaging study.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Modality
            <input type="text" list="imaging-modalities" value={modality} onChange={(e) => setModality(e.target.value)} maxLength={80} required className={`${insetFill} ${FIELD}`} />
            <datalist id="imaging-modalities">
              {IMAGING_MODALITY_SUGGESTIONS.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Body site
            <input type="text" value={bodySite} onChange={(e) => setBodySite(e.target.value)} maxLength={80} className={`${insetFill} ${FIELD}`} />
          </label>
          {error ? <p role="alert" className="text-label leading-label text-text-primary">{error}</p> : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>Order imaging</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

export function RecordImagingResultControl({
  orderId,
  label,
  insetFill,
}: {
  orderId: string;
  label: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [impression, setImpression] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await recordImagingResultAction({ orderId, impression });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setImpression('');
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Record result
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title={`Result: ${label}`} description="Capture the impression.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Impression
            <textarea value={impression} onChange={(e) => setImpression(e.target.value)} maxLength={4000} rows={5} required className={`${insetFill} ${FIELD}`} />
          </label>
          {error ? <p role="alert" className="text-label leading-label text-text-primary">{error}</p> : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>Save result</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
