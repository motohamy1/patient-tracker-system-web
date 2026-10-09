# 09-05: Labs and Imaging tab surfaces

**What to build:** The Labs and Imaging tabs stop being placeholders: each lists its orders with status and its results, and offers ordering + result capture to clinical authors. Documents attached to a result are surfaced as a linked record (not an image viewer).

**Blocked by:** 09-01, 09-02, 09-03

**Status:** resolved

- [ ] `labs/page.tsx` lists lab orders newest first with a semantic status Pill (ordered/resulted/cancelled) and their structured results (analyte, value+unit, reference range, flag)
- [ ] `imaging/page.tsx` does the same for imaging orders + impressions, and shows the linked document's filename when present
- [ ] Ordering and result forms render only for `CAN_AUTHOR_CLINICAL`; others read
- [ ] Empty ("No labs yet" / "No imaging yet"), loading, error/retry and permission-denied states are deliberate (§24)
- [ ] A flagged result (`critical`/`high`/`low`) reads through the closed tint family only, never a new colour, and never by colour alone (§4.3/INV-04)
- [ ] Density/grammar: `radius.pill` controls, no one-line cards, only `space.*` steps, 400/600 weights, `tabular-nums` on values/dates

**Gate evidence at close:** LAB-01/LAB-02 UI · §24 · QA rows 1/3/4/6/7/11 · INV-04/05/07/08/10/12
