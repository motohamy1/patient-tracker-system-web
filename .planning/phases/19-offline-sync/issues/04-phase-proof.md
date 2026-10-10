# 19-04: Phase proof

**What to build:** The human-acceptance leg of Phase 19: the owner's unit pass over the pure machine, the interactive offline pass, and the phase verdicts.

**Blocked by:** 19-03 (the surfaces)

**Status:** ready-for-human

- [ ] Owner unit pass over `src/lib/sync/*` (pure): every legal move, every illegal move left untouched, the conflict decision, the malformed-draft discard
- [ ] Interactive pass: log a measurement while offline, confirm the queue panel shows it as held on this device and NOT in the record, reconnect, confirm it syncs and the state reads synchronized; force a failed send and confirm the reason + retry
- [ ] `19-VERIFICATION.md` written: the 12-row visual QA for the panel, INV-01..17, OFF-01..03 trace, deferred items listed
- [ ] ROADMAP.md + STATE.md synced to phase-19 agent-complete

**Gate evidence at close:** §20.4 owner gate · §22 role-based acceptance (patient account)

## Notes

- Deferred to the owner (per session constraints): the unit pass and the interactive pass. Same split as Phases 07–18. No migration this phase — the semantics sit over the existing mutations and claim no new tables.
