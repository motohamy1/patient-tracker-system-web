# 18-03: The billing surfaces

**What to build:** The provider's earnings overview and the patient's billing surface — fees, invoices, payments, receipts — with the design language of the workspace at lower density, and zero financial noise on the clinical timeline.

**Blocked by:** 18-02 (the workflow)

**Status:** resolved

- [x] `/provider/earnings` — a profile route: the totals (issued, paid, outstanding), the invoice/payment status, and the consultation-fee rows; issue/void controls where the role may (no dead controls for readers)
- [x] `/patient/billing` — the patient's own invoices with their payment history: the amount, the state (issued/paid/void), and a payment receipt line for a settled payment (provider reference, quiet)
- [x] Every state is honest: an unconfigured payment attempt reads as "not connected, here's why", never as paid; empty/error states per surface (§24); mobile keeps the same controls (§26)
- [x] No financial data on the clinical timeline, the workspace tabs, or the patient Home's clinical regions — billing is its own surface (PAY-04)
- [x] Amounts render with a thousands separator and the currency code; `tabular-nums` on every figure

**Gate evidence at close:** PAY-01/02/04 · §24/§26 · INV-05/INV-06 (no accent noise, no gamified vocabulary)

## Notes

- The provider abstraction ships unconfigured on purpose: which PSP (and credentials) is the owner's decision with cost implications; the invoices and the honest record work regardless (§27).
