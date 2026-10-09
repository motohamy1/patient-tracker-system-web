# 09-02: Lab lifecycle actions (order → result)

**What to build:** A clinician can order a lab, then record its result; the result captures the structured analyte/value/unit/reference/flag and flips the order to resulted in one move.

**Blocked by:** 09-01

**Status:** resolved

- [ ] `orderLabAction` (CAN_AUTHOR_CLINICAL, Zod-parsed) creates a lab order (name, ordered_at, notes) with a typed result
- [ ] `recordLabResultAction` inserts the structured result row; the DB trigger marks the parent order `resulted` atomically
- [ ] Illegal moves rejected server-side (no result against a cancelled order; no ordering with junk dates) with typed results
- [ ] Provenance: actor from verified claims; `source` carried so a future AI-extracted result can never look clinician-verified (§23)
- [ ] Order cancellation is an explicit clinical action with the §7 verb-as-heading confirmation

**Gate evidence at close:** LAB-01 · §7 destructive-confirmation · AUTH-05
