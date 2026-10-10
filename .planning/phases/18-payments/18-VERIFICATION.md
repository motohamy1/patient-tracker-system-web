# Phase 18: Payments — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 18-01…18-04 under
`.planning/phases/18-payments/issues/`.
**Session constraints (owner-directed):** **no test suites run**, **no commits** — the
owner runs the test pass and commits per phase. Verification here is tsc + the
token/lint gate only; the last full suite green was Phase 15 (473/473) and the last
build green was Phase 15 as well.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0** |
| Test suite | — | **not run (owner-directed)**; last green 473/473 at Phase 15 |
| Build | — | **not run (owner-directed)**; last green at Phase 15 |
| Migration | `supabase/migrations/0017_payments.sql` | written (0003/0005/0014 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `invoices` + `payments` added by hand |
| Capability | `CAN_MANAGE_BILLING` | added to the D-09 map; the exact-set test updated (the CAN_MESSAGE precedent) |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — `/provider/earnings` and `/patient/billing` are profile routes (like messages/consultations), never tabs; no financial figure on any workspace tab or the timeline (PAY-04). |
| 2 | Color relationships | **PASS (screenshot deferred)** — invoice/payment state uses the closed Pill tint family; the totals are plain figures on one surface. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — the overview is a totals card + one row per invoice with its payment history folded underneath. |
| 5 | Card proportions | **PASS** — a 72rem provider column, a 64rem patient column; stacked on mobile (§26). |
| 6 | Pill controls | **PASS** — verb-first buttons ("Issue an invoice", "Issue invoice", "Record payment", "Void"), inset fields, 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — every figure `tabular-nums`; `formatMinor` renders one shape everywhere. |
| 8–10 | Timeline rows | **PASS (unchanged and untouched by construction — no payment code path reads or writes the timeline projection, PAY-04).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent anywhere in the billing surfaces (INV-05). |

## 3. Invariants

INV-01/03 (token lint exit 0) · INV-02 (no chrome) · INV-04 (closed invoice/payment
vocabularies) · INV-05 (no accent) · INV-06 (no gamified vocabulary — a fee is a fee,
never a "reward") · INV-07/08/09 (radii) · INV-10 (spacing steps) · INV-11 (no
decorative rules) · INV-12 (cards ≥2 lines) · INV-13/14/15/16 (surfaces, no card
borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (PAY-01…04)

| Req | Tickets | Evidence |
|---|---|---|
| **PAY-01** providers see earnings, invoice/payment status, and consultation fee status | 18-02, 18-03 | `/provider/earnings` renders the derived totals (invoiced/paid/outstanding — computed server-side from the settled sums, never stored) and one row per invoice with its status and payment history; the visit detail's consultation-fee entry issues the invoice with the visit FK, so the earnings row shows it as a consultation fee (`visitType` column). |
| **PAY-02** patients see fees, invoices, payments, and receipts | 18-03 | `/patient/billing` lists the patient's own invoices under self-or-staff RLS: the amount, the state, and the payment history — a settled payment shows its provider reference as the receipt line; an unconfigured attempt shows the plain explanation, never "paid". |
| **PAY-03** payment providers sit behind an abstraction | 18-01, 18-02 | `provider.ts` is the `PaymentProvider` interface + registry (0016's adapter precedent): `capture()` returns captured/reference/failure and the DEFAULT implementation returns captured=false with an explicit reason — no simulated settlement (§27). A PSP swap is a `registerPaymentProvider` call, not a schema change. |
| **PAY-04** the timeline stays free of financial noise | 18-01, 18-03 | Structural: neither table is read by the timeline projection or any workspace tab, no route in the 8-tab workspace carries a figure, and the billing surfaces are their own profile routes. |

**Role matrix (0017):**

| Role | Read invoices/payments | Issue / record / void |
|---|---|---|
| provider_doctor | ✅ (staff SELECT) | ✅ (policy + guard + `CAN_MANAGE_BILLING`) |
| nurse | ✅ | ❌ (no capability; no control rendered) |
| receptionist | ✅ | ✅ (billing is front-desk work) |
| admin_owner | ✅ | ✅ |
| patient | ✅ (own rows only — `can_read_own_patient_row`) | ❌ (no write grant at all) |

## 5. Decisions reported

- **Integer minor units.** `amount_minor bigint` + an ISO-4217 check; a float money
  column is a bug farm, and the form converts once
  (`parseMajorToMinor`, the single pure conversion point).
- **`paid` is derived, and the derivation is enforced in the database.** The guard
  sets it only when the settled sum covers the amount; a client claim cannot
  survive (the unread-derivation precedent).
- **Payments are append-only.** Insert grant only, no update/delete; a wrong
  payment is corrected by a new row, not an edit — the ledger stays true.
- **An unconfigured provider is the honest default.** No PSP credentials exist;
  the surface states what connecting would take and the invoices work regardless
  (the Phase-12/16 no-provider precedent, §27).
- **A consultation fee is an invoice with a visit FK**, not a new concept — so
  "fee status" needs no separate surface.

## 6. Out of scope (recorded as decisions, not omissions)

- **A real PSP** (Stripe and peers): the abstraction and the honest record ship
  without one; connecting is the owner's decision (the §8 brief).
- **Refunds / partial payments as first-class objects**: a partial payment is a
  second payment row (the balance derives); a refund is an inverted payment row
  when a provider exists — neither needs its own table.
- **Tax / multi-currency accounting**: one currency per invoice, rendered as-is.
- **Payment reminders**: the conversation model already exists; automated dunning
  is not a clinical product's job.

## 7. Deferred (owner constraints + this session's directives)

- Migration 0017 apply + pgTAP (append-only payments, overpay/void refusals,
  invoice↔visit ownership, patient self-read, derived `paid`, org isolation).
- `database.types.ts` regeneration via the CLI.
- **No test suites run this session (owner-directed)** — the unit/acceptance pass
  is the owner's, including the derived-balance helper and `parseMajorToMinor`.
- **No commits this session (owner-directed)** — the owner commits per phase.
- Visual baselines + screenshot legs for the two new surfaces.

## 8. Owner design-gate brief

1. **The payment provider**: which PSP (and credentials) the workspace connects, or
   ship the honest `not_configured` state as the phase's face. *Ask:* which, and
   the budget.
2. **Who may bill**: doctor + receptionist + admin_owner today. *Ask:* confirm, or
   narrow to the receptionist alone.
3. **The consultation-fee entry**: it lives on the visit detail. *Ask:* confirm, or
   prefer it only on the earnings overview.
4. **The patient's payment experience**: staff record payments today; a patient
   self-service checkout needs the provider decision. *Ask:* confirm the
   staff-recorded model for now.

## 9. Gate status

**Implementation: GREEN** for the gates run (tsc 0, token/lint exit 0, PAY-01…04
traced with the role matrix). **Phase acceptance: PENDING** the §7 deferrals and
the §8 verdicts (§20.7).
