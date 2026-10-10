# 18-01: Invoices, payments and the provider abstraction

**What to build:** The payment layer: an invoice against a patient (optionally for a consultation), an append-only payment record, and a payment provider behind an abstraction that is honest about being unconfigured. Amounts are minor units (integer cents) — never floats.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] `invoices` table: org/patient FKs, optional visit FK (the consultation fee), `amount_minor` (integer minor units) + `currency`, `status` (`draft` | `issued` | `paid` | `void`), `description`, `issued_at`, trigger-owned provenance; org/patient integrity guard; audit
- [x] `payments` table (append-only): invoice FK, `amount_minor`, `currency`, `status` (`settled` | `not_configured` | `failed`), provider reference, reason, timestamps — no update/delete grants
- [x] A `PaymentProvider` interface + registry (the Phase-16 adapter precedent): `capture({ amountMinor, currency, reference }) → { captured, providerReference?, failure?, reason? }`; the no-credentials provider returns captured=false with an explicit reason — never a simulated settlement (§27)
- [x] Balance is DERIVED, never stored (sum of settled payments vs amount — the unread-derivation precedent); the invoice's status moves issued→paid when the balance is covered, and a void invoice refuses payments
- [x] RLS: staff read (all four staff roles), self-or-staff patient read of their own invoices/payments, writes doctor+receptionist+admin_owner (policy + guard, the new `CAN_MANAGE_BILLING` capability mirror)
- [x] `database.types.ts` gains both tables; `CAN_MANAGE_BILLING` added to the D-09 capability map (and its exact-set test updated, the CAN_MESSAGE precedent)

**Gate evidence at close:** PAY-01 (provider earnings + invoice/payment/consultation fee status) · PAY-03 (providers behind an abstraction) · §12 · §23

## Notes

- The clinical timeline never reads these tables (PAY-04): the projection composes clinical events only, so financial data cannot leak into it.
