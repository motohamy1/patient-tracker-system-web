# 08-05: Phase proof — verify the medication lifecycle and record it

**What to build:** `08-VERIFICATION.md` recording the MED-01..03 trace, the QA rows and invariants, the CDSS-readiness statement (structured, no decisions), and the deferral list.

**Blocked by:** 08-01, 08-02, 08-03, 08-04

**Status:** ready-for-human

- [ ] `08-VERIFICATION.md` written: MED-01..03 trace, 12-row QA gate, INV-01…17 sweep
- [ ] CDSS-readiness recorded explicitly: structured dose/frequency/route + `rxnorm_code` place-holder, and a grep-level statement that NO interaction/contraindication logic exists (§27)
- [ ] State/history consistency evidenced: every transition wrote both rows (design + code trace); DB execution deferred to cloud Supabase
- [ ] Timeline evidence: a lifecycle change yields the correct distinct event kind end-to-end
- [ ] Deferrals listed: migration apply + RLS execution on cloud Supabase, visual baselines, the owner's test pass, owner verdicts
- [ ] A passing build is not acceptance (§20.7)

**Gate evidence at close:** all MED rows · 12 QA rows · INV sweep · deferral list
