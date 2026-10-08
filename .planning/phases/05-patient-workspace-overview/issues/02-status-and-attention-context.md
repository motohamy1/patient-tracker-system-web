# 02: See what matters now — status and attention context

**What to build:** Beside the identity area, the clinician sees what is active and what needs follow-up at a glance: current patient status, how recently the record changed, and an attention indicator drawn from the five-value status vocabulary. The cards read as the reference's compact stat row — near-parity tones, large tabular numerals, separated by shadow.

**Blocked by:** 01

**Status:** resolved

- [x] Overview answers "what is active and what needs follow-up" without the clinician opening another tab — **WSP-02**
- [x] The attention indicator is derived from the stored status vocabulary only; no new severity model is introduced
- [x] Every clinical and statistical value renders with `tabular-nums`; only `font.size` values and weights 400 and 600 appear (QA row 7)
- [x] Card tones sit near parity with the canvas and separate by `shadow.raised` (INV-13, INV-14)
- [x] Accent appears only on the reserved list — a key state indicator dot at most — never as a background, a border or body text (INV-05)
- [x] Status color is limited to `success` / `info` / `warning` / `critical` (INV-04 as amended by the Phase-4 R-1 owner verdict, 2026-10-08)
- [x] No card holds one line of content or fewer (INV-12, QA row 4)
- [x] No points, levels, streaks, rewards or celebration language anywhere (INV-06)

**Gate evidence at close:** QA rows 2, 4, 7 · INV-04, INV-05, INV-06, INV-12, INV-13, INV-14, INV-16 · Serves WSP-02

**Note:** runs in parallel with 03 — neither gates the other.

## Comments

### 2026-10-08 — resolved

- **Where:** `src/components/workspace/ContextStatRow.tsx`, mounted beside
  `PatientIdentityCard` in `OverviewBody`. Three cards at the reference's
  stat-row grammar (label / large tabular numeral / exact date beneath),
  anchored top-and-bottom so the row fills the identity card's height with no
  sunken air: **Current status** (the attention indicator — `Pill` through
  `PATIENT_STATUS_TOKEN`, D-10, plus `Updated {date}`), **Last activity**
  (whole days + exact date), **Record opened** (whole months + exact date).
- **No duplication:** clinical state moved OUT of `PatientIdentityCard` (it
  now carries identity only: name, sex·age, MRN, DOB, portal access), so the
  status pill and activity recency appear exactly once.
- **Honest values only:** every numeral derives from stored columns
  (`status`, `last_activity_at`, `created_at`, `updated_at`) — no clinical
  value is invented (§27); the exact date beneath each rounded numeral keeps
  the card truthful at a `0` count.
- **Tests:** the T-01 file gained a stat-row block — three labels, the
  vocabulary→token matrix for all five statuses, no `accent` paint (INV-05),
  frozen `font.size`/weight greps + `tabular-nums` on every numeral (QA row 7),
  more-than-one-line per card (INV-12), zero gamified vocabulary (INV-06).
  22/22 pass; `tsc --noEmit` clean; `npm run lint` 0 violations.
