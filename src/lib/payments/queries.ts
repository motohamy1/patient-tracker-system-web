// src/lib/payments/queries.ts — the payment read layer (Phase 18; PAY-01/02).
//
// RLS is inert on the single-owner Lakebase Postgres connection, so every read
// carries an explicit `org_id` predicate; the patient's own surface adds the
// `patient_id` narrowing. Money columns are bigint (returned as strings by the
// driver) and are coerced to numbers at the mapping boundary.
import { getSql } from '@/lib/db/neon';
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
  amount_minor: string | number;
  currency: string;
  status: string;
  description: string;
  issued_at: string | null;
  voided_at: string | null;
};

type PaymentRow = {
  id: string;
  invoice_id: string;
  amount_minor: string | number;
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
    amountMinor: Number(row.amount_minor),
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
    amountMinor: Number(row.amount_minor),
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

function groupPaymentsByInvoice(payments: PaymentRow[]): Map<string, PaymentRow[]> {
  const byInvoice = new Map<string, PaymentRow[]>();
  for (const payment of payments) {
    const list = byInvoice.get(payment.invoice_id);
    if (list === undefined) byInvoice.set(payment.invoice_id, [payment]);
    else list.push(payment);
  }
  return byInvoice;
}

/** The org's invoices with their payment history (the earnings overview). */
export async function listOrgInvoices(orgId: string): Promise<InvoiceWithPayments[]> {
  let invoices: InvoiceRow[];
  let payments: PaymentRow[];
  try {
    const sql = getSql();
    invoices = (await sql`
      select id, org_id, patient_id, visit_id, amount_minor, currency, status, description, issued_at, voided_at
      from public.invoices
      where org_id = ${orgId}
      order by created_at desc, id desc
    `) as unknown as InvoiceRow[];
    payments = (await sql`
      select id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at
      from public.payments
      where org_id = ${orgId}
    `) as unknown as PaymentRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`listOrgInvoices failed: ${message}`);
  }

  const byInvoice = groupPaymentsByInvoice(payments);
  return invoices.map((row) =>
    withBalance(mapInvoice(row), (byInvoice.get(row.id) ?? []).map(mapPayment)),
  );
}

/** The earnings overview: totals plus every row (org-scoped). */
export async function getEarningsOverview(orgId: string): Promise<EarningsOverview> {
  type EarningsRow = InvoiceRow & {
    patient_first_name: string | null;
    patient_last_name: string | null;
    visit_type: string | null;
  };

  let invoices: EarningsRow[];
  let payments: PaymentRow[];
  try {
    const sql = getSql();
    invoices = (await sql`
      select i.id, i.org_id, i.patient_id, i.visit_id, i.amount_minor, i.currency, i.status,
             i.description, i.issued_at, i.voided_at,
             p.first_name as patient_first_name, p.last_name as patient_last_name,
             v.visit_type as visit_type
      from public.invoices i
      left join public.patients p on p.id = i.patient_id
      left join public.visits v on v.id = i.visit_id
      where i.org_id = ${orgId}
      order by i.created_at desc, i.id desc
    `) as unknown as EarningsRow[];
    payments = (await sql`
      select id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at
      from public.payments
      where org_id = ${orgId}
    `) as unknown as PaymentRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`getEarningsOverview failed: ${message}`);
  }

  const byInvoice = groupPaymentsByInvoice(payments);
  const rows = invoices.map((row) => ({
    ...withBalance(mapInvoice(row), (byInvoice.get(row.id) ?? []).map(mapPayment)),
    patientName:
      row.patient_first_name !== null
        ? `${row.patient_first_name} ${row.patient_last_name}`
        : 'Patient',
    visitType: row.visit_type,
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
  let invoices: InvoiceRow[];
  let payments: PaymentRow[];
  try {
    const sql = getSql();
    invoices = (await sql`
      select id, org_id, patient_id, visit_id, amount_minor, currency, status, description, issued_at, voided_at
      from public.invoices
      where org_id = ${orgId} and patient_id = ${patientId}
      order by created_at desc, id desc
    `) as unknown as InvoiceRow[];
    payments = (await sql`
      select id, invoice_id, amount_minor, currency, status, provider_reference, reason, created_at
      from public.payments
      where org_id = ${orgId} and patient_id = ${patientId}
    `) as unknown as PaymentRow[];
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`listOwnInvoices failed: ${message}`);
  }

  const byInvoice = groupPaymentsByInvoice(payments);
  return invoices.map((row) =>
    withBalance(mapInvoice(row), (byInvoice.get(row.id) ?? []).map(mapPayment)),
  );
}
