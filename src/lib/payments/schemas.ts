// src/lib/payments/schemas.ts — Zod validation for the payment workflow
// (Phase 18). Parse BEFORE any capability check or write.
import { z } from 'zod';

const iso4217 = z
  .string()
  .trim()
  .length(3, 'Use the three-letter currency code.')
  .regex(/^[A-Z]{3}$/, 'Use an uppercase three-letter currency code.');

const amountMinor = z
  .number()
  .int('The amount must be whole minor units (cents).')
  .positive('The amount must be greater than zero.')
  .max(99_999_999_999, 'The amount is too large.');

export const issueInvoiceSchema = z.object({
  patientId: z.string().uuid(),
  visitId: z.string().uuid().optional(),
  amountMinor,
  currency: iso4217.default('USD'),
  description: z.string().trim().min(1, 'Say what the invoice is for.').max(500),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amountMinor,
  currency: iso4217,
});

export const voidInvoiceSchema = z.object({
  invoiceId: z.string().uuid(),
});
