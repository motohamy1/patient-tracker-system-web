# Phase 22 Final QA Record — every dimension, recorded

**Date:** 2026-10-10 · **Phase:** 22 (Final Product QA and Convergence) ·
**Scope:** the surfaces added in Phases 17–21 plus the regression pass over the
whole product.
**Session constraints (owner-directed):** **no test suites run**, **no commits**. The
production build IS run this phase (it is the phase's own success criterion, not a
test suite). Where a dimension needs a browser or a keyboard, the static
verification is recorded and the interactive leg is listed as the owner's.

---

## 1. Production build (QA-03)

`npm run build` → **exit 0**. All routes render; every authenticated route is
server-rendered on demand (`ƒ`) — no authenticated surface is ever statically
prerendered (the §25 PHI-cache invariant holds at build time), and the Next-16
proxy is wired. The new routes (`/provider/consultations`,
`/provider/consultations/[visitId]`, `/provider/earnings`,
`/patient/consultation`, `/patient/billing`) all appear as dynamic.

## 2. Visual QA + the reference-UI acceptance gate (QA-01/02)

**Method:** the reference design language is enforced mechanically — the token
lint reports **0 violations** across every file (raw hex would fail the build's
`prebuild` gate) — and the INV registry was re-run per phase in 17–21. The
new surfaces (17–21) were then reviewed against the generic-SaaS tells, by grep:

| Tell | Result across `src/components/{telehealth,payments,sync,channels}` and the new routes |
|---|---|
| Blue-purple / gradient fills (`bg-gradient`) | **0** |
| Icon packed into a colored tile | **0** (the new surfaces use bare Pills and text; `lucide-react` appears **0** times in the new files — the only shipped icon is Phase-3's lock glyph in denial empty states) |
| Shadows / glows on cards | **0** (the surfaces use `Surface` + the closed shadow tokens only, INV-13/14) |
| Decorative eyebrow pills above headings | **0** |
| Letterspaced-caps label costumes | **0** (labels are sentence case per the §7 copy contract) |

**Verdict per surface:** PASS on the gates that can be run statically. The
screenshot legs are the owner's (deferred, same split as Phases 07–16).

## 3. Interaction QA (QA-01)

Every control on the new surfaces dispatches to a real, authorized server
action — no prop controls: the consultation room's
Start/Begin/Complete/Cancel, the earnings overview's
Issue/Record payment/Void, the queue panel's Try again/Keep my
version/Keep the record's version, and the invoice and endpoint controls. Each
was traced to its action's capability check at build time; the interactive
click pass is the owner's. Loading/disabled states use `ariaBusy` (17 buttons
across the new components, none without a handler).

## 4. Responsive QA (QA-01)

The new surfaces compose with the shared primitives and responsive steps:
`ConsultationRoom` (1 responsive rule), `EarningsView` (2 — the totals grid
stacks), `ChannelEndpointsControl` (1 — rows wrap), the queue panel (stacks at
every width by construction). Mobile touch targets hold at `min-h-11` in every
new field. §26's "web and mobile share the design language but not identical
layouts" holds.

## 5. Accessibility QA (QA-01)

- Labels: every new field is a wrapped `<label>` (endpoint, invoice,
  consultation forms) — no unlabeled inputs.
- Status: `role="status"` on the Phase-3 strip; `role="alert"` on every new
  error line; `ariaBusy` on every pending control.
- The queue panel carries `aria-label="Changes waiting to sync"` and its rows
  read the verbatim persistence sentence — the state is announced as text,
  never color alone (INV-04).
- Keyboard reachability rides the shared primitives (Button/Overlay), which
  Phase-2's a11y baseline covered.

## 6. Performance QA (QA-01)

- **The timeline (the product's heavy surface) is untouched this stretch** —
  its Phase-6 perf fixture (the 4 000-event generator, gated dev preview) and
  the D3 scene-graph pattern stand as recorded.
- **New reads, all bounded or scoped:** the consultation day list is
  day-scoped; the channel endpoints and the delivery log are per
  patient/conversation. **One finding recorded below.**
- No new client bundle weight: the FHIR layer (`src/lib/fhir`) is pure and
  page-unimported; the sync store is only in the patient layout.

## 7. Authorization QA (QA-01)

Re-verified per new module (the Phase-20 audit's method): every `'use server'`
module added in 17–18 parses Zod first, then checks the capability
(`CAN_AUTHOR_CLINICAL` for the consultation workflow, `CAN_MANAGE_BILLING` for
the payment workflow), then writes under the caller's RLS scope. The Phase-19
sync sender re-uses the existing observation action (the queue is never a
second write path). Phase 20's SEC-01..03 record and its regression table
stand.

## 8. Regression QA (QA-01)

- `tsc --noEmit`: **0 errors**; `npm run lint`: **exit 0** — re-run after
  Phase 22's changes.
- Production build: **exit 0** (§1).
- The unit suite's last recorded green is Phase 15 (473/473); one capability
  widened since (Phase 18's `CAN_MANAGE_BILLING`) with the exact-set test
  updated in the same change. **The suite was not run this session
  (owner-directed)** — recorded, not assumed green.
- Phase-3 authorization guarantees: regression-verified in Phase 20
  (`20-SECURITY-AUDIT.md` §SEC-03).

## 9. Findings recorded for the owner

| # | Finding | Recommendation |
|---|---|---|
| QA-1 | `/provider/earnings` reads the org's invoices with nested payments unbounded (a clinic's ledger grows forever). | Add a page window (limit + count) or a date filter when invoicing volume is real; today's volumes are small and the query is org-scoped. Recorded rather than silently truncated. |
| QA-2 | `/patient/billing` reads the patient's own invoices unbounded. | Same shape; the per-patient history is naturally bounded by care volume. |
| QA-3 | The new surfaces' interactive legs (clicks, keyboard, screenshots) are static-verified only this session. | The owner's pass: the five-role interactive matrix + visual baselines for the six new surfaces. |

## 10. Dimension summary

| Dimension | Recorded result |
|---|---|
| Production build | **exit 0** (all routes dynamic; proxy wired) |
| Visual + reference-UI gate | **PASS (static)** — 0 token violations; 0 generic-SaaS tells across the new surfaces; screenshots deferred |
| Interaction | **PASS (static)** — no dead controls; interactive leg deferred |
| Responsive | **PASS (static)** — responsive composition + `min-h-11` targets |
| Accessibility | **PASS (static)** — labels, status/alert roles, ariaBusy, text-stated states |
| Performance | **PASS** — timeline untouched; reads bounded/scoped; QA-1/QA-2 recorded |
| Authorization | **PASS** — per-module trace; Phase-20 regression stands |
| Regression | **PASS (gates run)** — tsc 0, lint 0, build 0; suite run deferred (owner) |
