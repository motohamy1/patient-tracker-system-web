# 09-06: Phase proof — verify labs + imaging and record it

**What to build:** `09-VERIFICATION.md` recording the LAB-01..03 trace, the QA rows and invariants, the document/media relationship statement, and the deferral list.

**Blocked by:** 09-01, 09-02, 09-03, 09-04, 09-05

**Status:** ready-for-human

- [ ] `09-VERIFICATION.md` written: LAB-01..03 trace, 12-row QA gate, INV-01…17 sweep
- [ ] Media relationship evidenced: documents table + storage bucket/policies + the result→document FK + the same-patient integrity guard
- [ ] Lifecycle consistency evidenced: result insert ⇒ order resulted (trigger), by design/code trace
- [ ] Timeline evidence: order + result child event kinds end-to-end
- [ ] Deferrals listed: migration 0008 apply + RLS/pgTAP on cloud Supabase, storage bucket smoke test, `database.types.ts` regeneration, owner test pass, visual baselines, owner verdicts
- [ ] A passing build is not acceptance (§20.7)

**Gate evidence at close:** all LAB rows · 12 QA rows · INV sweep · deferral list
