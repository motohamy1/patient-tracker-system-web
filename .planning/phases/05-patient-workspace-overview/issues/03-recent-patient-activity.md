# 03: See what changed — recent patient activity

**What to build:** The Recent Records card in the Overview bottom row shows what actually changed on this patient — record created, status changed, invite sent — drawn from the patient-scoped activity trail. It is the surface that answers "what changed and what is recent", and it is honest when there is nothing yet.

**Blocked by:** 01

**Status:** resolved

- [x] Recent activity is drawn from real patient-scoped records only; no invented clinical history (§27, Phase-4 D-18)
- [x] The card occupies the bottom row's right slot at approximately 22.5% of the row width, within ±3% (QA row 5)
- [x] The card's type pill renders in the `critical` family per the workspace grammar (§5), without inventing a new tint (INV-04)
- [x] Loading, empty, error, retry and permission-denied states are deliberate and follow the §7 copy contract — empty reads "No {record-type} yet"; error reads "Couldn't load {surface}. Check your connection and try again." with a "Try again" action (§24)
- [x] Permission-denied copy explains what access is lacking without leaking that data exists (UX-02, §12)
- [x] Any true divider is 1px; the list is not styled as a rule rail (INV-11)
- [x] Only the five `radius.` steps appear; the type pill uses `radius.pill` (INV-07, INV-08)

**Gate evidence at close:** QA row 5 (22.5% slot) · INV-04, INV-07, INV-08, INV-11, INV-12 · §7 copy contract · Serves WSP-02

**Note:** runs in parallel with 02 — neither gates the other.

## Comments

### 2026-10-08 — resolved (slot mount landed with T04, its dependent)

- **Source decision — no audit_log widening.** `audit_log` SELECT is
  admin_owner-only by design (0003 D-15: retrieval is admin_owner-only), so a
  doctor reading it would get zero rows or a permission failure. Rather than
  widening a frozen security decision autonomously, the trail is composed from
  what every org member may legitimately read: the patient row's own
  `created_at`/`updated_at` (record created / record updated) plus this
  patient's `invitations` (`created_at`/`redeemed_at` → invite sent / invite
  redeemed; RLS restricts invitations to invite-managing roles, so other roles
  read fewer events, never an error). If a future phase wants richer events
  from `audit_log`, that is a deliberate security decision to bring to an
  owner gate — recorded here so the gap is visible, not hidden.
- **Where:** `src/lib/patients/activity.ts` (pure composer: merge, sort desc,
  cap at `RECENT_ACTIVITY_LIMIT = 3`, stable entity-scoped keys),
  `listPatientInvitations` in `queries.ts` (org + patient bound predicates,
  order desc, limit 5), `src/components/workspace/RecentRecordsCard.tsx`
  (date block + `bg-critical` type pill per §5, `BottomCardShell` grabber),
  mounted in `OverviewBody`'s bottom-row right slot.
- **Region-level states:** the activity query degrades ITS slot only —
  §7 error copy with a wired retry anchor, or the no-leak permission copy —
  never blanking identity, context, band or the other two cards (§24).
- **Tests:** `tests/unit/recent-records.test.tsx` (composer honesty rules,
  query contract, pill family, §7 empty copy, density cap, no divider rail,
  no dead header control) + the T-04 block in
  `workspace-overview.test.tsx` (slot presence, both failure postures,
  composed trail rendering). 47/47 across the phase's files; `tsc` clean;
  token lint 0 violations.
