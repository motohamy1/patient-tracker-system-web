// src/lib/payments/queries.ts — the payment read layer (Phase 18; PAY-01/02).
import { createClient } from '@/lib/supabase/server';
import type {
  EarningsOverview,
  InvoiceRecord,
  InvoiceWithPayments,
  PaymentRecord,
} from '@/lib/payments/status';

type InvoiceRow = {
  id: string;
  org_id: string;
  patient_id: string;
  visit_id: string | null;
  amount_minor: number;
  currency: string;
  status: string;
  description: string;
  issued_at: string | null;
  voided_at: string | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount_minor: number;
  currency: string;
  status: string;
  provider_reference: string | null;
  reason: string | null;
  created_at: string;
};

function mapInvoice(row: InvoiceRow): InvoiceRecord {
  return {
    id: row.id,
    orgId: row.org_id,
    patientId: row.patient_id,
    visitId: row.visit_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    status: row.status as InvoiceRecord['status'],
    description: row.description,
    issuedAt: row.issued_at,
    voidedAt: row.voided_at,
  };
}

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    status: row.status as PaymentRecord['status'],
    providerReference: row.provider_reference,
    reason: row.reason,
    createdAt: row.created_at,
  };
}

/** The derived balance: settled sum and what is left, never stored. */
function withBalance(invoice: InvoiceRecord, payments: PaymentRecord[]): InvoiceWithPayments {
  const settledMinor = payments
    .filter((payment) => payment.status === 'settled')
    .reduce((sum, payment) => sum + payment.amountMinor, 0);
  return {
    ...invoice,
    payments,
    settledMinor,
    outstandingMinor: Math.max(0, invoice.amountMinor - settledMinor),
  };
}

const INVOICE_COLUMNS =
  'id, org_id, patient_id, visit_id, amount_minor, currency, status, description, issued_at, voided_at';

/** The org's invoices with their payment history (the earnings overview). */
export async function listOrgInvoices(orgId: string): Promise<InvoiceWithPayments[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`${INVOICE_COLUMNS}, payments(id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at), patients(first_name, last_name)`)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listOrgInvoices failed: ${error.message}`);
  type Row = InvoiceRow & {
    payments: PaymentRow[] | null;
    patients: { first_name: string; last_name: string } | null;
  };
  return ((data ?? []) as Row[]).map((row) =>
    withBalance(mapInvoice(row), (row.payments ?? []).map(mapPayment)),
  );
}

/** The earnings overview: totals plus every row (org-scoped). */
export async function getEarningsOverview(orgId: string): Promise<EarningsOverview> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`${INVOICE_COLUMNS}, payments(id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at), patients(first_name, last_name), visits(visit_type)`)
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`getEarningsOverview failed: ${error.message}`);
  type Row = InvoiceRow & {
    payments: PaymentRow[] | null;
    patients: { first_name: string; last_name: string } | null;
    visits: { visit_type: string | null } | null;
  };

  const rows = ((data ?? []) as Row[]).map((row) => ({
    ...withBalance(mapInvoice(row), (row.payments ?? []).map(mapPayment)),
    patientName: row.patients !== null ? `${row.patients.first_name} ${row.patients.last_name}` : 'Patient',
    visitType: row.visits?.visit_type ?? null,
  }));

  let issuedMinor = 0;
  let paidMinor = 0;
  let outstandingMinor = 0;
  for (const row of rows) {
    if (row.status === 'issued' || row.status === 'paid') issuedMinor += row.amountMinor;
    if (row.status === 'paid') paidMinor += row.amountMinor;
    if (row.status === 'issued') outstandingMinor += row.outstandingMinor;
  }

  return { issuedMinor, paidMinor, outstandingMinor, currency: rows[0]?.currency ?? 'USD', rows };
}

/** The patient's own invoices with their payment history (self-or-staff). */
export async function listOwnInvoices(
  orgId: string,
  patientId: string,
): Promise<InvoiceWithPayments[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .select(`${INVOICE_COLUMNS}, payments(id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at)`)
    .eq('org_id', orgId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) throw new Error(`listOwnInvoices failed: ${error.message}`);
  type Row = InvoiceRow & { payments: PaymentRow[] | null };
  return ((data ?? []) as Row[]).map((row) =>
    withBalance(mapInvoice(row), (row.payments ?? []).map(mapPayment)),
  );
}
