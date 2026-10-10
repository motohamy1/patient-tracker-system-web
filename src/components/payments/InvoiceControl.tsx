'use client';

// InvoiceControl — the visit's consultation-fee entry (Phase 18, ticket
// 18-03; PAY-01/03).
//
// Client island: issuing runs the same server action the earnings overview
// uses, with the visit already known (the invoice carries the visit FK, so
// the earnings overview can show it as a consultation fee). A role without
// billing rights sees nothing — no dead controls.
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { issueInvoiceAction } from '@/lib/payments/actions';
import { parseMajorToMinor } from '@/components/payments/EarningsView';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function InvoiceControl({
  patientId,
  visitId,
  insetFill,
}: {
  patientId: string;
  visitId: string;
  insetFill: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('Consultation fee');

  async function submit(event: FormEvent) {
    event.preventDefault();
    const amountMinor = parseMajorToMinor(amount);
    if (amountMinor === null) {
      setError('Enter the amount as a number, for example 50.00.');
      return;
    }
    setPending(true);
    setError(null);
    const result = await issueInvoiceAction({
      patientId,
      visitId,
      amountMinor,
      currency,
      description,
    });
    setPending(false);
    if (!result.ok) {
      setError("This invoice couldn't be issued. Try again.");
      return;
    }
    setOpen(false);
    setAmount('');
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Issue an invoice
      </Button>

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Issue an invoice for this visit"
        description="The fee appears on the earnings overview as a consultation fee and on the patient's billing surface."
      >
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Amount
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="50.00"
              required
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Currency
            <input
              type="text"
              value={currency}
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              maxLength={3}
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            What it is for
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
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
              Issue invoice
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}
