# 10-03: Genetics record + view behind the sensitive-category gate (ALG-02/ALG-03)

**What to build:** A clinician can record and view genetics data; a role without the sensitive-category visibility gets a truthful denial at the page (never an empty list that implies "no records exist"), and the data layer refuses the read regardless of the UI.

**Blocked by:** 10-01

**Status:** resolved

- [ ] `recordGeneticFindingAction` parses with Zod, requires `CAN_AUTHOR_CLINICAL`, returns a typed result
- [ ] `kind` and `significance` are the closed vocabularies mirrored in TypeScript; an optional report `document_id` is integrity-checked to the same patient/org (the 0008 documents relationship)
- [ ] The Genetics tab resolves `CAN_VIEW_GENETICS` server-side BEFORE querying: a role without it sees the no-leak denial state, and no query is issued
- [ ] A role WITH visibility reads real rows only; RLS is the enforcement, the capability is the UI mirror
- [ ] Provenance shown: source, verification (AI-extracted never renders as verified), report date, and the linked document's filename when present
- [ ] Non-authors within the visible roles cannot be hidden by the UI alone — the action refuses them

**Gate evidence at close:** ALG-02, ALG-03 · §12 · §23 · §24 denial copy
