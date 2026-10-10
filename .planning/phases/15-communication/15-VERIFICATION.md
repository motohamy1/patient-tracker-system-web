# Phase 15: Communication — Verification

**Date:** 2026-10-09 · **Executed via:** Matt's `to-tickets` + `implement` skills (tickets
15-01…15-04 under `.planning/phases/15-communication/issues/`).
**Session constraints (owner-directed):** no Docker/local Supabase, **no new tests** (the
owner runs the test pass per step). Migration 0014 is written and reviewed but not executed
here; RLS behaviour is deferred to the cloud apply.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** |
| Lint / tokens | `npm run lint` | **exit 0, 0 violations across 193 files** |
| Existing suite | `npx vitest run` | **40 files, 473/473 passed** (the D-09 capability-map assertion updated for `CAN_MESSAGE`, see §5) |
| Build | `npm run build` | **exit 0** — `/provider/messages` listed dynamic (`ƒ`) |
| Migration | `supabase/migrations/0014_conversations.sql` | written (0003/0005/0012 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `conversations` + `conversation_messages` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — `/provider/messages` is a provider-route surface (rail + top bar from the layout) with a list/thread split; the patient region is the shared Home grammar. |
| 2 | Color relationships | **PASS (screenshot deferred)** — shadow separation; the only tonal use is the unread Pill dot and the selected-thread accent ring. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — one conversation per row with its last message; the thread is bubbles + composer. |
| 5 | Card proportions | **PASS** — `22rem` list + fluid thread on desktop; stacked on mobile (§26). |
| 6 | Pill controls | **PASS** — verb-first buttons ("Send message", "Close", "Message patient"), inset fields, 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body`; timestamps `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; messages are never projected onto the clinical timeline — §8.2, COMM-02).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — a single accent ring for the selected thread; no accent elsewhere (INV-05). |

## 3. Invariants

INV-01/03 (token lint 0, 193 files) · INV-02 (no chrome) · INV-04 (closed
status/sender/channel vocabularies) · INV-05 (no accent except the one selection
ring — recorded) · INV-06 (no gamified vocabulary) · INV-07/08/09 (radii) ·
INV-10 (spacing steps) · INV-11 (no decorative rules) · INV-12 (cards ≥2
lines) · INV-13/14 (shadow-raised/overlay only) · INV-15/16 (no card borders) ·
INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (COMM-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **COMM-01** one unified conversation abstraction with in-app/WhatsApp/Telegram channels | 15-01, 15-02, 15-03 | `conversations` + `conversation_messages` with a `channel` column (`in_app`/`whatsapp`/`telegram` — the Phase-16 seam). ONE `sendMessageAction` serves both sides: the session decides the sender and the guard re-derives it; a staff message requires `sender_user_id = auth.uid()`, a patient message requires the conversation's patient to be the authenticated user. One open conversation per patient (unique partial index) with a race-safe find-or-create. |
| **COMM-02** clinical truth stays in the clinical record | 15-01, 15-03 | Structural: the model has NO clinical fields — a message is a body, a channel and a sender; there is nowhere to store a diagnosis, dose or result, so the thread cannot become a shadow medical record. Messages are never projected onto the timeline. The thread's copy states the boundary ("Results, medication changes and clinical decisions stay in the clinical record"). |
| **COMM-03** communication through provider/profile controls, never a primary clinical tab | 15-03 | `/provider/messages` is a profile-level route with the layout's rail + top bar (not the workspace chrome), reached from the folder card's "Message patient" quick action; the patient's side is the Home's Communication region. The 8-tab workspace navigation is untouched (verified: `WORKSPACE_TAB_ROUTES` unchanged). |

**Role matrix (0014):**

| Role | Open/close conversation | Send message | Read |
|---|---|---|---|
| provider_doctor | ✅ (policy + guard) | ✅ (policy + guard + capability) | ✅ |
| nurse | ✅ (policy + guard) | ✅ (policy + guard + capability) | ✅ |
| receptionist | ❌ | ❌ | ✅ (staff SELECT) |
| admin_owner | ❌ | ❌ | ✅ (staff SELECT) |
| patient | ❌ | ✅ (own conversation, guard + capability) | ✅ (self-or-staff) |

## 5. Test assertion updated this session (reported, not hidden)

`tests/unit/auth-capabilities.test.ts` asserts the role→capability map is **exact**. Adding
`CAN_MESSAGE` (the COMM-01 mirror of 0014's write policy) deliberately widened
`provider_doctor` and `nurse`, so the two expected sets and the import were updated with an
in-file comment (the CAN_VIEW_GENETICS / CAN_RETRIEVE_AUDIT / CAN_REVIEW_AI precedent). This
is the only test change in Phase 15; no test files were added.

## 6. Schema decisions reported

- **`conversation_messages.org_id`/`patient_id` are denormalised copies owned by the guard
  trigger**: the app writes neither (the insert grant is `conversation_id, body, channel`),
  and the guard refuses the row when the conversation cannot supply them — so a
  successfully-inserted message always carries them, and no payload can point a message at a
  foreign patient.
- **Unread is derived, never stored** (`unread.ts`, pure): staff-unread counts the patient's
  messages after the care team's last message; the patient's unread is the mirror image. No
  read flags exist to drift.
- **Messages are append-only**: no UPDATE or DELETE grant, and no update trigger is installed
  at all.

## 7. Out of scope (recorded as decisions, not omissions)

- **The channel adapters themselves** (WhatsApp/Telegram): the column and the guard are the
  seam; the adapters and their notification workflows are Phase 16's work.
- **Attachments/media in messages**: the documents/storage path exists; a message carries
  text only in this phase.
- **Read receipts as UI**: the derivation exists and the unread count is shown; a
  per-message receipt is not built.

## 8. Deferred (owner constraints)

- Migration 0014 apply + pgTAP execution (the sender re-derivation — a patient cannot forge
  a staff message and staff cannot post as the patient — the one-open-conversation index,
  append-only proofs, org isolation).
- `database.types.ts` regeneration via the CLI.
- No new tests — the owner's unit/acceptance pass (a two-role exchange; the unread
  derivation is pure and built for it: `unreadForStaff` / `unreadForPatient`).
- Visual baselines + screenshot legs on both surfaces.

## 9. Owner design-gate brief

1. **Who may message**: provider_doctor + nurse. Receptionist/admin_owner are read-only
   today. *Ask:* widen to the receptionist (scheduling messages) or confirm.
2. **The opening message** the folder card sends ("Hello <first name>, this is your care
   team.") before the composer. *Ask:* confirm, or ask for an empty composer instead.
3. **`/provider/messages` as a profile surface** reachable from the folder quick actions and
   the patient context; the rail's Messages item was NOT wired (the layout cannot read the
   child segment to mark it active — the WorkspaceTopBar precedent), so discoverability rests
   on the quick action. *Ask:* confirm, or ask for a rail item accepting the active-state
   limitation.
4. **Unread** is a count-only Pill ("3 new"). *Ask:* confirm.

## 10. Gate status

**Implementation: GREEN** (tsc 0, 473/473 existing suite, 0 lint violations, build exit 0,
COMM-01…03 traced with the role matrix). **Phase acceptance: PENDING** the §8 deferrals and
the §9 verdicts (§20.7).
