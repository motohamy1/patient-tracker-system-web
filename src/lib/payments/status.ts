// src/lib/payments/status.ts — the payment vocabularies (Phase 18; the
// byte-for-byte mirror of migration 0017's checks).
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export const INVOICE_STATUSES = ['draft', 'issued', 'paid', 'void'] as const satisfies readonly InvoiceStatus[];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft',
  issued: 'Awaiting payment',
  paid: 'Paid',
  void: 'Void',
};

/** The sanctioned status tint per invoice (INV-04 closed set). */
export const INVOICE_STATUS_TOKEN: Record<InvoiceStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  draft: 'neutral',
  issued: 'warning',
  paid: 'success',
  void: 'neutral',
};

export type PaymentStatus = 'settled' | 'not_configured' | 'failed';

export const PAYMENT_STATUSES = ['settled', 'not_configured', 'failed'] as const satisfies readonly PaymentStatus[];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  settled: 'Paid',
  not_configured: 'Payment not connected',
  failed: 'Payment failed',
};

export const PAYMENT_STATUS_TOKEN: Record<PaymentStatus, 'success' | 'warning' | 'critical'> = {
  settled: 'success',
  not_configured: 'warning',
  failed: 'critical',
};

/** Plain-language payment explanations (§7 copy, §27 honesty). */
export const PAYMENT_STATUS_EXPLANATION: Record<PaymentStatus, string> = {
  settled: 'The payment was captured and the invoice is covered.',
  not_configured:
    'No payment provider is connected to this workspace, so nothing was captured and the invoice is still awaiting payment.',
  failed: 'The payment provider refused this payment.',
};

export const DEFAULT_CURRENCY = 'USD';

export type InvoiceRecord = {
  id: string;
  orgId: string;
  patientId: string;
  visitId: string | null;
  amountMinor: number;
  currency: string;
  status: InvoiceStatus;
  description: string;
  issuedAt: string | null;
  voidedAt: string | null;
};

export type PaymentRecord = {
  id: string;
  invoiceId: string;
  amountMinor: number;
  currency: string;
  status: PaymentStatus;
  providerReference: string | null;
  reason: string | null;
  createdAt: string;
};

/** An invoice with its derived balance and payment history (never stored). */
export type InvoiceWithPayments = InvoiceRecord & {
  payments: PaymentRecord[];
  settledMinor: number;
  outstandingMinor: number;
};

/** The provider earnings overview row (one invoice, patient-named). */
export type EarningsRow = InvoiceWithPayments & {
  patientName: string;
  visitType: string | null;
};

export type EarningsOverview = {
  issuedMinor: number;
  paidMinor: number;
  outstandingMinor: number;
  currency: string;
  rows: EarningsRow[];
};

/** Format integer minor units for display (never client-side money math). */
export function formatMinor(amountMinor: number, currency: string): string {
  const value = (amountMinor / 100).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${value} ${currency}`;
}
