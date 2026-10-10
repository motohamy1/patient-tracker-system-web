# 18-02: The payment workflow

**What to build:** Issue an invoice, record a payment attempt against it through the provider abstraction, and void an invoice — all honest end to end: with no provider connected, a payment attempt records `not_configured` with its reason and the invoice stays unpaid.

**Blocked by:** 18-01 (the payment layer)

**Status:** resolved

- [x] `issueInvoiceAction`: Zod-validated (patient, optional visit, amount in minor units > 0, currency, description), capability-checked, org/patient re-derived server-side; a draft becomes issued with `issued_at`
- [x] `recordPaymentAction`: runs the provider abstraction, then writes ONE append-only payment row with its honest status; the provider reference for a settled capture, the reason for a failure; re-derives the invoice under the caller's RLS scope and refuses a payment against a void or overpaid invoice
- [x] `voidInvoiceAction`: a void invoice refuses further payments (guard); the record and its history stay
- [x] The invoice's `paid` status is derived (balance covered), never a client claim; every action revalidates the earnings + billing surfaces
- [x] Queries: the provider earnings overview (totals, per-invoice state, consultation-fee rows) and the patient's invoices with their payment history

**Gate evidence at close:** PAY-01 · PAY-03 · §12

## Notes

- A failed or unconfigured payment NEVER blocks the invoice's existence: the record is the truth, and the surface says so plainly.
