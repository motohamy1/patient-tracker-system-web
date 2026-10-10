'use client';

// EarningsView — the provider's earnings overview (Phase 18, ticket 18-03;
// PAY-01/03).
//
// Client island: the totals and rows render from the server; the issue /
// record / void controls call server actions that re-check
// CAN_MANAGE_BILLING and re-derive the org. A role without billing rights
// sees the same overview read-only — no dead controls.
//
// Amounts are minor units end to end; the form takes major units and converts
// once (parseMajorToMinor). A payment attempt is recorded honestly: with no
// provider connected it reads "Payment not connected" and the invoice stays
// awaiting payment — never a fake settlement.
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import {
  issueInvoiceAction,
  recordPaymentAction,
  voidInvoiceAction,
} from '@/lib/payments/actions';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TOKEN,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TOKEN,
  formatMinor,
  type EarningsOverview as EarningsOverviewData,
} from '@/lib/payments/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';
const SAVE_ERROR = "This couldn't be saved. Check the details and try again.";

/** "12.34" → 1234. Returns null for anything that isn't a clean amount. */
export function parseMajorToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(trimmed)) return null;
  const [whole, fraction = ''] = trimmed.split('.');
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
}

export function EarningsView({
  overview,
  patients,
  canManage,
  insetFill,
}: {
  overview: EarningsOverviewData;
  patients: ReadonlyArray<{ id: string; name: string }>;
  canManage: boolean;
  insetFill: string;
}) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [issueOpen, setIssueOpen] = useState(false);
  const [patientId, setPatientId] = useState(patients[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  async function run(key: string, action: () => Promise<{ ok: boolean }>) {
    setPending(key);
    setError(null);
    const result = await action();
    setPending(null);
    if (!result.ok) setError(SAVE_ERROR);
    return result.ok;
  }

  async function submitIssue(event: FormEvent) {
    event.preventDefault();
    const amountMinor = parseMajorToMinor(amount);
    if (amountMinor === null) {
      setError('Enter the amount as a number, for example 50.00.');
      return;
    }
    const ok = await run('issue', () =>
      issueInvoiceAction({ patientId, amountMinor, currency: overview.currency, description }),
    );
    if (ok) {
      setIssueOpen(false);
      setAmount('');
      setDescription('');
    }
  }

  return (
    <div className="flex flex-col gap-lg">
      {/* Totals — three quiet figures, tabular-nums, no color noise. */}
      <Surface variant="surface" className="flex flex-col gap-md">
        <h2 className="text-label leading-label font-semibold text-text-primary">This organization</h2>
        <dl className="grid grid-cols-1 gap-md sm:grid-cols-3">
          <div className="flex flex-col gap-xs">
            <dt className="text-label leading-label text-text-secondary">Invoiced</dt>
            <dd className="text-heading font-semibold leading-heading text-text-primary tabular-nums">
              {formatMinor(overview.issuedMinor, overview.currency)}
            </dd>
          </div>
          <div className="flex flex-col gap-xs">
            <dt className="text-label leading-label text-text-secondary">Paid</dt>
            <dd className="text-heading font-semibold leading-heading text-text-primary tabular-nums">
              {formatMinor(overview.paidMinor, overview.currency)}
            </dd>
          </div>
          <div className="flex flex-col gap-xs">
            <dt className="text-label leading-label text-text-secondary">Outstanding</dt>
            <dd className="text-heading font-semibold leading-heading text-text-primary tabular-nums">
              {formatMinor(overview.outstandingMinor, overview.currency)}
            </dd>
          </div>
        </dl>
      </Surface>

      <Surface variant="surface" className="flex flex-col gap-md">
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <h2 className="text-label leading-label font-semibold text-text-primary">Invoices</h2>
          {canManage ? (
            <Button variant="secondary" onClick={() => setIssueOpen(true)}>
              Issue an invoice
            </Button>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="text-label leading-label text-text-primary">
            {error}
          </p>
        ) : null}

        {overview.rows.length === 0 ? (
          <p className="text-body leading-body text-text-secondary">No invoices yet.</p>
        ) : (
          <ul className="flex flex-col gap-md">
            {overview.rows.map((row) => (
              <li key={row.id} className="flex flex-col gap-sm">
                <div className="flex flex-wrap items-center justify-between gap-sm">
                  <span className="flex min-w-0 flex-col gap-xs">
                    <span className="text-body leading-body text-text-primary">
                      {row.patientName} · {row.description}
                    </span>
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      {formatMinor(row.amountMinor, row.currency)}
                      {row.visitType !== null ? ` · ${row.visitType}` : ''}
                    </span>
                  </span>
                  <span className="flex items-center gap-sm">
                    <Pill tone={INVOICE_STATUS_TOKEN[row.status]} label={INVOICE_STATUS_LABELS[row.status]} />
                    {canManage && row.status === 'issued' ? (
                      <>
                        <Button
                          variant="ghost"
                          disabled={pending === `pay-${row.id}`}
                          ariaBusy={pending === `pay-${row.id}`}
                          onClick={() =>
                            void run(`pay-${row.id}`, () =>
                              recordPaymentAction({
                                invoiceId: row.id,
                                amountMinor: row.outstandingMinor,
                                currency: row.currency,
                              }),
                            )
                          }
                        >
                          Record payment
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={pending === `void-${row.id}`}
                          ariaBusy={pending === `void-${row.id}`}
                          onClick={() => void run(`void-${row.id}`, () => voidInvoiceAction({ invoiceId: row.id }))}
                        >
                          Void
                        </Button>
                      </>
                    ) : null}
                  </span>
                </div>

                {/* The payment history — the honest record under its invoice. */}
                {row.payments.length > 0 ? (
                  <ul className="flex flex-col gap-xs">
                    {row.payments.map((payment) => (
                      <li key={payment.id} className="flex flex-wrap items-baseline gap-sm">
                        <Pill
                          tone={PAYMENT_STATUS_TOKEN[payment.status]}
                          label={PAYMENT_STATUS_LABELS[payment.status]}
                        />
                        <span className="text-label leading-label text-text-secondary tabular-nums">
                          {formatMinor(payment.amountMinor, payment.currency)}
                          {payment.providerReference !== null ? ` · ref ${payment.providerReference}` : ''}
                        </span>
                        {payment.reason !== null ? (
                          <span className="text-label leading-label text-text-secondary">{payment.reason}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Surface>

      <Overlay
        open={issueOpen}
        onClose={() => setIssueOpen(false)}
        title="Issue an invoice"
        description="The invoice appears on the patient's billing surface with its payment state."
      >
        <form onSubmit={submitIssue} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Patient
            <select
              value={patientId}
              onChange={(event) => setPatientId(event.target.value)}
              className={`${insetFill} ${FIELD}`}
            >
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
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
            What it is for
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={500}
              required
              placeholder="Consultation fee"
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setIssueOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending === 'issue'} ariaBusy={pending === 'issue'}>
              Issue invoice
            </Button>
          </div>
        </form>
      </Overlay>
    </div>
  );
}
