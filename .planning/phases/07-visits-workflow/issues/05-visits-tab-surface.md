# 07-05: The Visits tab surface (list, detail, states)

**What to build:** The patient workspace's Visits tab stops being a placeholder: it lists the patient's visits (schedule, type, stage) and opens one visit's workflow. Empty, loading, error/retry and permission-denied states are deliberate; the surface obeys the workspace grammar and density.

**Blocked by:** 07-01, 07-02, 07-03

**Status:** ready-for-agent

- [ ] `visits/page.tsx` renders the patient's real visits under org RLS, newest first, each with a semantic stage marker and the scheduled date (tabular-nums)
- [ ] A visit detail surface hosts the three-stage workflow (07-03) for authorised roles
- [ ] Empty state follows §7 ("No visits yet" + what will appear + next step); a scheduler sees the "New visit" next step, a non-scheduler does not
- [ ] The surface is force-dynamic (no PHI cached across principals) and consumes the existing workspace top bar unchanged
- [ ] Density: no card holds one line; only `space.*` steps; weights 400/600; `radius.pill` compact controls
- [ ] A visit whose read is denied degrades to the no-leak denial state, and a failed read offers the §7 error copy with a wired retry
- [ ] No clinical value is invented anywhere in the surface

**Gate evidence at close:** §24 states · QA rows 1/3/4/6/7/11 · INV-01/04/05/07/08/10/12/15/16
