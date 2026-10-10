# 20-04: Phase proof

**What to build:** The human-acceptance leg of Phase 20: the pgTAP/RLS pass against the cloud project, the five-role acceptance re-run, and the verdicts.

**Blocked by:** 20-03 (the regression)

**Status:** ready-for-human

- [ ] Migration 0018 applied to the cloud Supabase project
- [ ] pgTAP: the patient self-read policy reads only the patient's own objects; a foreign object and a malformed name both fail closed
- [ ] Five-role acceptance re-run after 0018 (a patient reading their own document object is now legal; staff behaviour unchanged)
- [ ] `20-VERIFICATION.md` written: the audit summary, SEC-01..03 trace, the findings table, deferred items
- [ ] ROADMAP.md + STATE.md synced to phase-20 agent-complete

**Gate evidence at close:** §20.4 owner gate · §22 role-based acceptance

## Notes

- Deferred to the owner (per session constraints): the cloud apply, pgTAP, and the interactive passes. Same split as Phases 07–19.
