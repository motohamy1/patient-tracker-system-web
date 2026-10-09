# 07-06: Phase proof — verify the visits workflow and record it

**What to build:** The phase is proven: `07-VERIFICATION.md` records the VIS-01..03 trace, the applicable QA rows and invariants, the deferral list (owner test pass, visual baselines, cloud-Supabase apply) and any owner adjudication items — so Phase 8 starts from coherent evidence.

**Blocked by:** 07-01, 07-02, 07-03, 07-04, 07-05

**Status:** ready-for-agent

- [ ] `07-VERIFICATION.md` written: VIS-01..03 trace, 12-row QA gate, INV-01…17 sweep
- [ ] Role-limit evidence recorded: the receptionist path can schedule and cannot author (trigger + action + UI hiding), with the DB-side proof deferred to the cloud-Supabase apply
- [ ] The timeline projection of a visit is evidenced end-to-end (visit row → CareEvent → band)
- [ ] Deferrals listed explicitly: migration apply + RLS execution on cloud Supabase, visual baselines, the owner's unit/pgTAP test pass, owner verdicts
- [ ] A passing build is not acceptance (§20.7, §27)
- [ ] Phase-8 handoff noted: medications add a second projection mapper (MED-02) and reuse the same engine/workflow grammar

**Gate evidence at close:** all VIS rows · 12 QA rows · INV sweep · deferral list
