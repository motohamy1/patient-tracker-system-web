// src/lib/payments/actions.ts — the payment workflow (Phase 18, ticket
// 18-02; PAY-01/03).
//
// Three mutations, one discipline: Zod parse first, then the capability check
// (CAN_MANAGE_BILLING), then the write with an explicit org scope, then
// revalidate. RLS is inert on the single-owner Lakebase connection, so every
// read pins `org_id` and every write runs under `withAppUser` (the guards
// re-derive the caller's role and the provenance/audit triggers read
// `public.app_uid()`). The provider abstraction records what ACTUALLY
// happened — with no provider connected the payment row reads `not_configured`
// with its reason and the invoice stays unpaid (§27). The DB guards re-check
// every boundary (invoice ownership, overpay, void, attribution).
//
// TRIGGER-OWNED (migration 0017): created_by/updated_by/created_at/
// updated_at are never written here. `paid` is derived by the guard, never
// claimed by a client.
'use server';

import { revalidatePath } from 'next/cache';
import { getSql } from '@/lib/db/neon';
import { withAppUser } from '@/lib/db/client';
import { getSessionUser } from '@/lib/auth/session';
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
  const user = await getSessionUser();
  if (!user) return null;
  return { ...resolution, uid: user.id };
}

/** Create a draft invoice for a patient (optionally a consultation fee). */
export async function issueInvoiceAction(input: unknown): Promise<PaymentActionResult> {
  const parsed = issueInvoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireBillingStaff();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const sql = getSql();
    const patients = (await sql`
      select id from public.patients
      where id = ${parsed.data.patientId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string }[];
    if (patients.length === 0) return { ok: false, kind: 'not-found' };

    // The optional visit must belong to the same org/patient (the guard
    // re-checks; this is the honest early refusal).
    if (parsed.data.visitId !== undefined) {
      const visits = (await sql`
        select id from public.visits
        where id = ${parsed.data.visitId} and org_id = ${actor.orgId} and patient_id = ${parsed.data.patientId}
        limit 1
      `) as unknown as { id: string }[];
      if (visits.length === 0) return { ok: false, kind: 'not-found' };
    }

    const invoiceId = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.invoices (org_id, patient_id, visit_id, amount_minor, currency, description)
         values ($1, $2, $3, $4, $5, $6)
         returning id`,
        [
          actor.orgId,
          parsed.data.patientId,
          parsed.data.visitId ?? null,
          parsed.data.amountMinor,
          parsed.data.currency,
          parsed.data.description,
        ],
      );
      return rows[0]?.id;
    });
    if (invoiceId === undefined) return { ok: false, kind: 'error' };

    // A fresh invoice is immediately live: the draft→issued transition sets
    // issued_at (the guard owns the timestamp).
    await withAppUser(actor.uid, async (tx) => {
      await tx.query(
        `update public.invoices set status = 'issued' where id = $1 and org_id = $2`,
        [invoiceId, actor.orgId],
      );
    });

    revalidateBillingSurfaces(parsed.data.patientId);
    return { ok: true, invoiceId };
  } catch {
    return { ok: false, kind: 'error' };
  }
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

  try {
    const sql = getSql();
    const invoices = (await sql`
      select id, patient_id, status from public.invoices
      where id = ${parsed.data.invoiceId} and org_id = ${actor.orgId}
      limit 1
    `) as unknown as { id: string; patient_id: string; status: string }[];
    const invoice = invoices[0] ?? null;
    if (!invoice) return { ok: false, kind: 'not-found' };
    if (invoice.status !== 'issued') return { ok: false, kind: 'invalid' };

    const result = await getPaymentProvider().capture({
      amountMinor: parsed.data.amountMinor,
      currency: parsed.data.currency,
      invoiceId: parsed.data.invoiceId,
    });

    const status = result.captured ? 'settled' : result.failure ?? 'failed';

    const paymentId = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string }>(
        `insert into public.payments
           (org_id, patient_id, invoice_id, amount_minor, currency, status, provider_reference, reason)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         returning id`,
        [
          actor.orgId,
          invoice.patient_id,
          parsed.data.invoiceId,
          parsed.data.amountMinor,
          parsed.data.currency,
          status,
          result.providerReference ?? null,
          result.reason ?? null,
        ],
      );
      return rows[0]?.id;
    });
    if (paymentId === undefined) return { ok: false, kind: 'error' };

    // The derived transition: settled → paid when the balance is covered. The
    // guard re-computes the sum and refuses an unpaid claim.
    if (result.captured) {
      const paymentRows = (await sql`
        select amount_minor, status from public.payments
        where invoice_id = ${parsed.data.invoiceId} and org_id = ${actor.orgId}
      `) as unknown as Array<{ amount_minor: string | number; status: string }>;
      const settled = paymentRows
        .filter((row) => row.status === 'settled')
        .reduce((sum, row) => sum + Number(row.amount_minor), 0);

      const fullRows = (await sql`
        select amount_minor from public.invoices
        where id = ${parsed.data.invoiceId} and org_id = ${actor.orgId}
        limit 1
      `) as unknown as Array<{ amount_minor: string | number }>;
      const full = fullRows[0];
      if (full && settled >= Number(full.amount_minor)) {
        await withAppUser(actor.uid, async (tx) => {
          await tx.query(
            `update public.invoices set status = 'paid' where id = $1 and org_id = $2`,
            [parsed.data.invoiceId, actor.orgId],
          );
        });
      }
    }

    revalidateBillingSurfaces(invoice.patient_id);
    return { ok: true, paymentId, invoiceId: parsed.data.invoiceId };
  } catch {
    return { ok: false, kind: 'error' };
  }
}

/** Void an issued invoice; its record and payment history stay. */
export async function voidInvoiceAction(input: unknown): Promise<PaymentActionResult> {
  const parsed = voidInvoiceSchema.safeParse(input);
  if (!parsed.success) return { ok: false, kind: 'invalid' };

  const actor = await requireBillingStaff();
  if (!actor) return { ok: false, kind: 'forbidden' };

  try {
    const updated = await withAppUser(actor.uid, async (tx) => {
      const { rows } = await tx.query<{ id: string; patient_id: string }>(
        `update public.invoices set status = 'void'
         where id = $1 and org_id = $2 and status = 'issued'
         returning id, patient_id`,
        [parsed.data.invoiceId, actor.orgId],
      );
      return rows[0] ?? null;
    });
    if (!updated) return { ok: false, kind: 'not-found' };

    revalidateBillingSurfaces(updated.patient_id);
    return { ok: true, invoiceId: updated.id };
  } catch {
    return { ok: false, kind: 'error' };
  }
}
