# Phase 21: Interoperability — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 21-01…21-04 under
`.planning/phases/21-interoperability/issues/`.
**Session constraints (owner-directed):** **no test suites run**, **no commits** — the
owner runs the test pass and commits per phase. Verification here is tsc + the
token/lint gate; the mappings are pure (no I/O) so the unit pass needs no mocks.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0** |
| Purity | `'use client'` / `'use server'` in `src/lib/fhir` | **none** — pure modules throughout |
| INV-02 (no FHIR-shaped UI) | `resourceType`/`Bundle`/`fullUrl`/`valueQuantity` in `src/components` + `src/app` | **zero matches** |
| Migration | — | **none — the mapping is a projection layer over the existing model (§13 stays canonical)** |
| Test suite / build | — | **not run (owner-directed)** |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1–11 | UI rows | **NONE APPLICABLE** — by design (INTR-02): this phase introduces no screen, no route and no component. The 12-row gate is recorded as deliberately empty, with the INV-02 grep as the proof that no FHIR shape leaked into the UI. |
| 12 | Accent restraint | **N/A (no surface).** |

## 3. Invariants

INV-01/03 (token lint exit 0 — the FHIR modules carry no raw hex) · INV-02 (no
chrome — nothing renders) · INV-04 (closed vocabularies map to closed FHIR code
sets) · INV-05/06 (no accent, no gamified vocabulary — nothing renders) ·
INV-07…17 (radii/spacing/rules/cards/surfaces/borders/glass — not applicable to
pure modules). **All applicable invariants PASS; the UI rows are N/A by the
phase's own scope decision.**

## 4. Requirement traceability (INTR-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **INTR-01** FHIR mapping exists where the approved scope justifies it, on top of the clinical data model | 21-01, 21-02, 21-03 | `scope.ts` records the decision: the six resources the §13 chain names (Patient, Encounter, MedicationRequest, Observation from labs and vitals, DiagnosticReport, AllergyIntolerance) and six deliberate non-mappings, each with its reason. `mapping.ts` is a pure projection of the SAME record shapes the workspace UI reads — no table, no row, no canonical change. |
| **INTR-02** the UI remains reference-driven — no FHIR-shaped screens | 21-03 | Proven mechanically: the four FHIR shape tokens appear nowhere in `src/components` or `src/app` (grep recorded in §1), and `FHIR_UI_FORBIDDEN_TOKENS` exists as the review tripwire. |
| **INTR-03** the mapping is verifiable | 21-03 | `validate.ts` is the pure structural gate (resourceType, id, per-resource required fields, duplicate fullUrls, bundle type) and `buildPatientBundle` is deterministic. Not a full FHIR validator — the official StructureDefinitions remain the exhaustive contract — but the projection can never emit a structurally invalid resource. |

## 5. Decisions reported

- **A projection layer, never a second source of truth.** The relational model
  stays canonical (§13); nothing in FHIR's shape re-enters the database, and
  nothing in the UI reads it (INTR-02, proven by grep).
- **Six resources, six deliberate non-mappings.** Payments are financial, not
  clinical; messages are a workspace surface, not a clinical statement
  (COMM-02's boundary); a telehealth session IS the encounter (mapping it twice
  duplicates it); care tasks carry product semantics; deliveries are plumbing;
  document bytes stay behind signed URLs.
- **Provenance crosses the exchange.** An AI-extracted medication or allergy
  carries its verification state inside the resource's meta and its status
  fields — a receiving system can tell it apart exactly as this workspace's UI
  does (§23).
- **No exchange endpoint this phase.** The mapping and its validation are the
  deliverable; an API surface (a route or an action emitting a bundle) is a
  product decision recorded in §7.

## 6. Out of scope (recorded as decisions, not omissions)

- **An exchange endpoint / download action**: needs the owner's consent and
  product decision (who may export, in what shape, for whom).
- **The inverse mapping (FHIR → this model)**: an import path is a separate
  phase with its own provenance rules.
- **A full FHIR validator**: the official StructureDefinitions; this phase's
  gate is the structural subset the mapping emits.

## 7. Deferred (owner constraints + this session's directives)

- **No test suites run this session (owner-directed)** — the pure mappings and
  the validation are the intended unit target (no I/O to mock); a sample
  patient projected by hand against FHIR R4 is the owner's pass.
- **No commits this session (owner-directed)** — the owner commits per phase.
- The scope verdicts (the six mappings and the six non-mappings) — §20.4.

## 8. Owner design-gate brief

1. **The exchange endpoint**: is a per-patient FHIR export (a route or a server
   action emitting the bundle) in scope for a later phase, and for whom? *Ask:*
   confirm or defer.
2. **The scope**: confirm the six mapped resources and the six deliberate
   non-mappings (recorded in `scope.ts`). *Ask:* adjust?
3. **The inverse (import)**: a FHIR → this-model import path is the natural
   successor. *Ask:* scope it as a future phase or defer.

## 9. Gate status

**Implementation: GREEN** for the gates run (tsc 0, token/lint exit 0, INTR-01…03
traced, INV-02 proven by grep). **Phase acceptance: PENDING** the §7 deferrals
and the §8 verdicts (§20.7).
