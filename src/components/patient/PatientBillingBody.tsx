// PatientBillingBody — the patient's own billing surface (Phase 18, ticket
// 18-03; PAY-02).
//
// Server Component: resolves the patient from the VERIFIED SESSION (never
// the URL — §3.1) and reads their own invoices under self-or-staff RLS.
// Every state is honest: an unconfigured payment attempt reads as not
// connected with its plain reason, never as paid (§27). No staff names, no
// workspace ids — the fee, the invoice state and the receipt.
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Pill } from '@/components/primitives/Pill';
import { getPatientForCurrentUser } from '@/lib/patient/queries';
import { listOwnInvoices } from '@/lib/payments/queries';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_TOKEN,
  PAYMENT_STATUS_EXPLANATION,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TOKEN,
  formatMinor,
} from '@/lib/payments/status';

export async function PatientBillingBody() {
  const patient = await getPatientForCurrentUser();
  if (patient === null) {
    return (
      <Surface variant="surface" className="flex flex-col gap-md">
        <EmptyState
          title="No invoices yet"
          body="When your care team issues an invoice for your care, it appears here with its payment state."
        />
      </Surface>
    );
  }

  let invoices = null;
  let failed = false;
  try {
    invoices = await listOwnInvoices(patient.orgId, patient.id);
  } catch {
    failed = true;
  }

  if (failed || invoices === null) {
    return (
      <Surface variant="surface" className="flex flex-col gap-sm">
        <p className="text-body leading-body text-text-secondary">
          Your invoices couldn&apos;t be loaded just now. Try again in a moment.
        </p>
      </Surface>
    );
  }

  if (invoices.length === 0) {
    return (
      <Surface variant="surface" className="flex flex-col gap-md">
        <EmptyState
          title="No invoices yet"
          body="When your care team issues an invoice for your care, it appears here with its payment state."
        />
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {invoices.map((invoice) => (
        <Surface key={invoice.id} variant="surface" className="flex flex-col gap-sm">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <span className="text-body leading-body text-text-primary">{invoice.description}</span>
            <Pill tone={INVOICE_STATUS_TOKEN[invoice.status]} label={INVOICE_STATUS_LABELS[invoice.status]} />
          </div>
          <span className="text-heading font-semibold leading-heading text-text-primary tabular-nums">
            {formatMinor(invoice.amountMinor, invoice.currency)}
          </span>

          {invoice.payments.length > 0 ? (
            <ul className="flex flex-col gap-xs">
              {invoice.payments.map((payment) => (
                <li key={payment.id} className="flex flex-col gap-xs">
                  <span className="flex flex-wrap items-center gap-sm">
                    <Pill
                      tone={PAYMENT_STATUS_TOKEN[payment.status]}
                      label={PAYMENT_STATUS_LABELS[payment.status]}
                    />
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      {formatMinor(payment.amountMinor, payment.currency)}
                      {payment.providerReference !== null ? ` · receipt ${payment.providerReference}` : ''}
                    </span>
                  </span>
                  {payment.status !== 'settled' ? (
                    <span className="text-label leading-label text-text-secondary">
                      {PAYMENT_STATUS_EXPLANATION[payment.status]}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : invoice.status === 'issued' ? (
            <p className="text-label leading-label text-text-secondary">
              This invoice is awaiting payment. Your care team records the payment here once it is taken.
            </p>
          ) : null}
        </Surface>
      ))}
    </div>
  );
}
