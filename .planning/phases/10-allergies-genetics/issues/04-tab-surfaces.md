# 10-04: Allergies + Genetics tab surfaces

**What to build:** The Allergies and Genetics tabs stop being placeholders and become the record surfaces, each with deliberate states and the workspace grammar.

**Blocked by:** 10-02, 10-03

**Status:** resolved

- [ ] `allergies/page.tsx` lists the patient's allergies (allergy-relevant facts first) with severity/status pills and a record control for authors
- [ ] `genetics/page.tsx` lists findings behind the `CAN_VIEW_GENETICS` gate, with the report link when present
- [ ] Both surfaces are force-dynamic, consume the workspace top bar, and use only `space.*` steps / `radius.pill` controls / 400–600 weights / `tabular-nums` dates
- [ ] Empty states follow §7 ("No allergies yet" / "No genetics findings yet" + what will appear + next step); error/retry and denial states deliberate (§24)
- [ ] No clinical value is invented; severity/significance never read by colour alone

**Gate evidence at close:** ALG-01/02/03 UI · §24 · QA rows 1/3/4/6/7/11 · INV-04/05/07/08/10/12/15/16
