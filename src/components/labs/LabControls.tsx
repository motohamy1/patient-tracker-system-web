'use client';

// Lab controls — the ordering and resulting forms (LAB-01; ticket 09-05).
//
// Two client islands in one module: a "New lab order" control, and a per-order
// "Record result" control. Both render only for clinical authors (the pages
// gate them) and the actions re-check server-side. The inset fill arrives as a
// prop (client chunk may not read tokens.json with node:fs).
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { orderLabAction, recordLabResultAction } from '@/lib/labs/actions';
import { LAB_FLAGS, LAB_FLAG_LABELS } from '@/lib/labs/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const ERROR = "Couldn't save this lab record. Try again.";

export function NewLabOrderControl({
  patientId,
  insetFill,
}: {
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await orderLabAction({ patientId, name, notes });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setName('');
    setNotes('');
    router.refresh();
  }

  return (
    <>
      <Button variant="primary" icon={Plus} onClick={() => setOpen(true)}>
        New lab order
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title="New lab order" description="Order a test or panel.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Test or panel
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} required className={`${insetFill} ${FIELD}`} />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={400} rows={3} className={`${insetFill} ${FIELD}`} />
          </label>
          {error ? <p role="alert" className="text-label leading-label text-text-primary">{error}</p> : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>Order lab</Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

export function RecordLabResultControl({
  orderId,
  orderName,
  insetFill,
}: {
  orderId: string;
  orderName: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [analyte, setAnalyte] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [flag, setFlag] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await recordLabResultAction({
      orderId,
      analyte,
      value: value === '' ? undefined : value,
      unit,
      referenceRange,
      flag: flag === '' ? undefined : flag,
    });
    setPending(false);
    if (!result.ok) {
      setError(ERROR);
      return;
    }
    setOpen(false);
    setAnalyte('');
    setValue('');
    setUnit('');
    setReferenceRange('');
    setFlag('');
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Record result
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title={`Result: ${orderName}`} description="Capture the structured result.">
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Analyte
            <input type="text" value={analyte} onChange={(e) => setAnalyte(e.target.value)} maxLength={120} required className={`${insetFill} ${FIELD}`} />
          </label>
          <div className="flex gap-md">
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Value
              <input type="number" inputMode="decimal" step="0.0001" value={value} onChange={(e) => setValue(e.target.value)} className={`${insetFill} ${FIELD}`} />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Unit
              <input type="text" value={unit} onChange={(e) => setUnit(e.target.value)} maxLength={20} className={`${insetFill} ${FIELD}`} />
            </label>
          </div>
          <div className="flex gap-md">
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Reference range
              <input type="text" value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} maxLength={60} className={`${insetFill} ${FIELD}`} />
            </label>
            <label className="flex min-w-0 flex-1 flex-col gap-xs text-label leading-label text-text-primary">
              Flag
              <select value={flag} onChange={(e) => setFlag(e.target.value)} className={`${insetFill} ${FIELD}`}>
                <option value="">Not flagged</option>
                {LAB_FLAGS.map((value) => (
                  <option key={value} value={value}>{LAB_FLAG_LABELS[value]}</option>
                ))}
              </select>
            </label>
          </div>
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
