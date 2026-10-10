// src/lib/payments/actions.ts — the payment workflow (Phase 18, ticket
// 18-02; PAY-01/03).
//
// Three mutations, one discipline: Zod parse first, then the capability check
// (CAN_MANAGE_BILLING), then the write under the caller's RLS scope, then
// revalidate. The provider abstraction records what ACTUALLY happened — with
// no provider connected the payment row reads `not_configured` with its
// reason and the invoice stays unpaid (§27). The DB guards re-check every
// boundary (invoice ownership, overpay, void, attribution).
//
// TRIGGER-OWNED (migration 0017): created_by/updated_by/created_at/
// updated_at are never written here. `paid` is derived by the guard, never
// claimed by a client.
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { CAN_MANAGE_BILLING, runsCapability } from '@/lib/auth/capabilities';
import { issueInvoiceSchema, recordPaymentSchema, voidInvoiceSchema } from '@/lib/payments/schemas';
import { getPaymentProvider } from '@/lib/payments/provider';

export type PaymentActionResult =
  | { ok: true; invoiceId?: string; paymentId?: string }
  | { ok: false; kind: 'invalid' | 'forbidden' | 'error' | 'not-found' };

function revalidateBillingSurfaces(patientId: string) {
  revalidatePath('/provider/earnings');
  revalidatePath('/patient/billing');
  revalidatePath('/patient/home');
  revalidatePath(`/provider/patients/${patientId}/visits`);
}

async function requireBillingStaff() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;
  if (!runsCapability(resolution.role, CAN_MANAGE_BILLING)) return null;
  return resolution;
}

/** Create a draft invoice for a patient (optionally a consultation fee). */
export async function issueInvoiceAction(input: unknown): Promise<PaymentActionResult> {
  const parsed = issueInvoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireBillingStaff();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('id')
    .eq('id', parsed.data.patientId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (patientError) return { ok: false, kind: 'error' };
  if (!patient) return { ok: false, kind: 'not-found' };

  // The optional visit must belong to the same org/patient (the guard
  // re-checks; this is the honest early refusal).
  if (parsed.data.visitId !== undefined) {
    const { data: visit } = await supabase
      .from('visits')
      .select('id')
      .eq('id', parsed.data.visitId)
      .eq('org_id', actor.orgId)
      .eq('patient_id', parsed.data.patientId)
      .maybeSingle();
    if (!visit) return { ok: false, kind: 'not-found' };
  }

  const { data, error } = await supabase
    .from('invoices')
    .insert({
      org_id: actor.orgId,
      patient_id: parsed.data.patientId,
      ...(parsed.data.visitId !== undefined ? { visit_id: parsed.data.visitId } : {}),
      amount_minor: parsed.data.amountMinor,
      currency: parsed.data.currency,
      description: parsed.data.description,
    })
    .select('id')
    .single();

  if (error || !data) return { ok: false, kind: 'error' };

  // A fresh invoice is immediately live: the draft→issued transition sets
  // issued_at (the guard owns the timestamp).
  const { error: issueError } = await supabase
    .from('invoices')
    .update({ status: 'issued' })
    .eq('id', data.id)
    .eq('org_id', actor.orgId);

  if (issueError) return { ok: false, kind: 'error' };

  revalidateBillingSurfaces(parsed.data.patientId);
  return { ok: true, invoiceId: data.id };
}

/**
 * Record a payment attempt against an issued invoice: run the provider
 * abstraction, then write ONE append-only row with its honest status. The
 * guard refuses a payment against a void invoice or one that would overpay.
 */
export async function recordPaymentAction(input: unknown): Promise<PaymentActionResult> {
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireBillingStaff();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .select('id, patient_id, status')
    .eq('id', parsed.data.invoiceId)
    .eq('org_id', actor.orgId)
    .maybeSingle();

  if (invoiceError) return { ok: false, kind: 'error' };
  if (!invoice) return { ok: false, kind: 'not-found' };
  if ((invoice.status as string) !== 'issued') return { ok: false, kind: 'invalid' };

  const result = await getPaymentProvider().capture({
    amountMinor: parsed.data.amountMinor,
    currency: parsed.data.currency,
    invoiceId: parsed.data.invoiceId,
  });

  const status = result.captured ? 'settled' : result.failure ?? 'failed';

  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      org_id: actor.orgId,
      patient_id: invoice.patient_id as string,
      invoice_id: parsed.data.invoiceId,
      amount_minor: parsed.data.amountMinor,
      currency: parsed.data.currency,
      status,
      ...(result.providerReference !== undefined ? { provider_reference: result.providerReference } : {}),
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
    })
    .select('id')
    .single();

  if (paymentError || !payment) return { ok: false, kind: 'error' };

  // The derived transition: settled → paid when the balance is covered. The
  // guard re-computes the sum and refuses an unpaid claim.
  if (result.captured) {
    const { data: rows } = await supabase
      .from('payments')
      .select('amount_minor, status')
      .eq('invoice_id', parsed.data.invoiceId)
      .eq('org_id', actor.orgId);
    const settled = ((rows ?? []) as Array<{ amount_minor: number; status: string }>)
      .filter((row) => row.status === 'settled')
      .reduce((sum, row) => sum + row.amount_minor, 0);
    const { data: full } = await supabase
      .from('invoices')
      .select('amount_minor')
      .eq('id', parsed.data.invoiceId)
      .eq('org_id', actor.orgId)
      .single();
    if (full && settled >= (full.amount_minor as number)) {
      await supabase
        .from('invoices')
        .update({ status: 'paid' })
        .eq('id', parsed.data.invoiceId)
        .eq('org_id', actor.orgId);
    }
  }

  revalidateBillingSurfaces(invoice.patient_id as string);
  return { ok: true, paymentId: payment.id, invoiceId: parsed.data.invoiceId };
}

/** Void an issued invoice; its record and payment history stay. */
export async function voidInvoiceAction(input: unknown): Promise<PaymentActionResult> {
  const parsed = voidInvoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireBillingStaff();
  if (!actor) return { ok: false, kind: 'forbidden' };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('invoices')
    .update({ status: 'void' })
    .eq('id', parsed.data.invoiceId)
    .eq('org_id', actor.orgId)
    .eq('status', 'issued')
    .select('id, patient_id')
    .maybeSingle();

  if (error) return { ok: false, kind: 'error' };
  if (!data) return { ok: false, kind: 'not-found' };

  revalidateBillingSurfaces(data.patient_id as string);
  return { ok: true, invoiceId: data.id as string };
}
