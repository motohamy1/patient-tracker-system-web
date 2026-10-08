# 01: Open a patient's workspace and see who they are

**What to build:** Clicking a patient folder on Provider Home opens that patient's workspace, and the Overview tab shows who the patient is — name, MRN, date of birth, sex, status and last activity — fetched server-side under organization RLS. The workspace primary navigation is proven to be exactly the eight specified tabs in order, and a regression test makes it impossible to drift.

**Blocked by:** None (can start immediately)

**Status:** resolved

- [x] A clinician who clicks a patient folder lands on that patient's Overview tab with the "No record yet" placeholder replaced by a real identity area
- [x] Identity is fetched server-side under org-scoped RLS; a member of another organization cannot read it (AUTH-03)
- [x] The `[patientId]` route parameter is consumed only to build hrefs — never rendered, never passed to a query, a filesystem path, a template, a log line or any interpreter (ASVS V5, Phase-2 T-02-52)
- [x] A regression test asserts the primary navigation is exactly `Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics`, in that order, with no Vital Signs tab and no Communication tab — **WSP-01**
- [x] Status renders as a semantic pill using the Phase-4 D-10 mapping (`stable` → `success`, `follow_up` → `warning`, `needs_review` → `info`, `critical` → `critical`, `new` → `info`) — no new tint family invented (INV-04)
- [x] Every color resolves through a semantic token; zero raw hex and zero default Tailwind color utilities in the changed source (INV-01, INV-03)
- [x] Cards separate by shadow alone, never a full-perimeter border (INV-15, INV-16)
- [x] Loading, empty, error and permission-denied states are deliberate — no generic "Loading…", no blank panel (§24)

**Gate evidence at close:** QA rows 1, 2 · INV-01, INV-03, INV-04, INV-15, INV-16 · Serves WSP-01

## Comments

### 2026-10-08 — resolved

- **Where:** `getPatient(orgId, patientId)` in `src/lib/patients/queries.ts`;
  `src/components/workspace/{OverviewBody,OverviewSkeleton,PatientIdentityCard}.tsx`;
  `overview/page.tsx` streams the top bar above a `<Suspense>` boundary whose
  fallback is the token-derived `OverviewSkeleton` (§24, no route-level
  `loading.tsx` — a segment loading file would blank the per-route tab bar);
  `StateVariant` gained an optional `retryHref` so the error state's "Try again"
  is a wired anchor in a Server Component, never a dead button (D-24).
- **Reading of "never passed to a query":** the T-02-52 clause targets
  interpolated/interpreting usage. The identity fetch required by this same
  ticket binds the id as a PostgREST equality predicate *after*
  `patientIdSchema` (`.uuid()`) validation, org-scoped with RLS underneath —
  the same pattern `changePatientStatusSchema` already sanctions. The id is
  never rendered, never string-built, never logged.
- **Tests:** `tests/unit/workspace-overview.test.tsx` (WSP-01 slug/label/DOM-order
  + directory scan guard, identity copy, D-10 tone, no-leak denial, malformed-id
  rejection, error/retry copy, force-dynamic) and
  `tests/unit/patient-record-query.test.ts` (bound-predicate contract).
  20/20 pass; `tsc --noEmit` clean; `npm run lint` 0 violations.
