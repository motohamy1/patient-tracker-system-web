# 22-02: The reference-UI acceptance gate across all UI phases

**What to build:** The QA-02 leg: every UI phase (2–18) re-checked against the reference-UI acceptance gate, with anything resembling a generic SaaS dashboard rejected and corrected.

**Blocked by:** 22-01 (the sweep)

**Status:** resolved

- [x] Each UI phase's own 12-row visual QA gate (recorded per `NN-VERIFICATION.md`) re-read against the reference: the shared shell, the 8-tab workspace grammar, the patient Home's nine regions, the messages/consultations/earnings profile routes — all compose the same tokens and grammar
- [x] The generic-SaaS tell sweep extended beyond the new surfaces: the dashboard-ification failure modes (blue-purple gradients, eyebrow pills, icon tiles, Lucide-uniform rows, glowy buttons, letterspaced-caps costumes) are absent product-wide by the token lint + grep
- [x] The new profile routes (messages, consultations, earnings, consultation room, billing, patient consultation) follow the same profile-route pattern as the shell routes — no ninth tab was added to the locked 8-tab navigation anywhere in 17–21
- [x] Verdict recorded per surface in the QA record; the screenshot legs deferred to the owner (the same split as Phases 07–16)

**Gate evidence at close:** QA-02 · INV-01..17 · §6 (the locked 8-tab navigation)

## Notes

- The gate's interactive half (the reference comparison at the golden viewports) is the owner's visual pass; the mechanical half is recorded above.
