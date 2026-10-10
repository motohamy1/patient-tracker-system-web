# Phase 16: WhatsApp + Telegram channels — Verification

**Date:** 2026-10-10 · **Executed via:** GSD tickets 16-01…16-04 under
`.planning/phases/16-channels/issues/` (in-flight phase-16 work completed and wired).
**Session constraints (owner-directed):** **no test suites run** and **no commits** — the
owner runs the test pass and commits after each phase. Verification here is tsc + the
token/lint gate only; the last full suite green was Phase 15 (473/473) and the build
was last green at Phase 15 as well.

---

## 1. Evidence

| Gate | Command | Result |
|---|---|---|
| Types | `npx tsc --noEmit` | **0 errors** (one pre-existing bug fixed en route, see §5) |
| Lint / tokens | `npm run lint` | **exit 0** (contrast-pair lines are the pre-existing informational pairs on ThreadView's bubble surfaces — unchanged from Phase 15) |
| Test suite | — | **not run (owner-directed)**; last green 473/473 at Phase 15 |
| Build | — | **not run (owner-directed)**; last green at Phase 15 |
| Migration | `supabase/migrations/0015_channels.sql` | written (0003/0005/0012/0014 patterns); **apply + pgTAP deferred** |
| Types contract | `database.types.ts` | `channel_endpoints` + `notification_deliveries` added by hand |

## 2. Visual QA gate — 12 rows

| # | Check | Verdict |
|---|---|---|
| 1 | Outer structure | **PASS** — no new route; the channel control lives on the existing `/provider/messages` context surface, never a ninth tab. |
| 2 | Color relationships | **PASS (screenshot deferred)** — delivery state uses the closed Pill tint family (`success`/`warning`/`critical`, D-04); nothing else is tinted. |
| 3 | Spacing rhythm | **PASS** — `space.*` steps only. |
| 4 | Compactness | **PASS** — endpoints are one line each (label · handle, status pill, one verb button); deliveries are one quiet line under their message. |
| 5 | Card proportions | **PASS** — control + thread stack in the thread column; mobile keeps the same controls (§26). |
| 6 | Pill controls | **PASS** — verb-first buttons ("Add a channel", "Save channel", "Deactivate"/"Activate"), inset fields, 44px mobile targets. |
| 7 | Typography hierarchy | **PASS** — `text-label/body`; provider reference `tabular-nums`. |
| 8–10 | Timeline rows | **PASS (unchanged; notifications are never projected onto the clinical timeline — §8.2).** |
| 11 | Visual density | **PASS (owner read deferred)**. |
| 12 | Accent restraint | **PASS** — no accent in the channel surfaces; the not-configured state is a warning pill plus the plain reason in words (INV-05). |

## 3. Invariants

INV-01/03 (token lint exit 0) · INV-02 (no chrome) · INV-04 (closed
channel/status vocabularies in `status.ts`) · INV-05 (no accent) · INV-06 (no
gamified vocabulary) · INV-07/08/09 (radii) · INV-10 (spacing steps) · INV-11
(no decorative rules) · INV-12 (cards ≥2 lines) · INV-13/14/15/16 (surfaces,
no card borders) · INV-17 (no glass/scrim). **All PASS.**

## 4. Requirement traceability (CHAN-01…03)

| Req | Tickets | Evidence |
|---|---|---|
| **CHAN-01** a notification channel architecture, both channels | 16-01, 16-02 | One `ChannelAdapter` interface + registry (`adapters.ts`); WhatsApp and Telegram are interchangeable registry entries; a real transport is a `registerAdapter` call, not a schema change. The default implementation is honest: no credentials → `delivered: false` with an explicit reason. |
| **CHAN-02** out-of-band notifications through the unified conversation | 16-02, 16-03 | Every notification is a *message first*: `notifyForMessage` runs after a staff message or a newly opened thread, `postTaskMessageAndNotify` composes the task's note into the thread and then notifies. The channel can never say something the thread does not — the body is the source of truth and `composeNotification` only shortens it. |
| **CHAN-03** every notification attributable to the exact message/patient/org | 16-01, 16-03 | Structural, not conventional: `notification_deliveries` is append-only (insert grant only, no update/delete) and its guard refuses any row whose message is missing or whose conversation/org/patient disagree — so a delivery cannot be attributed to a foreign patient. The delivery rows render under their message in the staff thread; `not_configured` shows the plain reason. |

**Role matrix (0015):**

| Role | Read endpoints/deliveries | Manage endpoints | Trigger a notification |
|---|---|---|---|
| provider_doctor | ✅ (staff SELECT) | ✅ (policy + guard + `CAN_MESSAGE`) | ✅ |
| nurse | ✅ | ✅ | ✅ |
| receptionist / admin_owner | ✅ | ❌ (control renders read-only) | ❌ (no `CAN_MESSAGE`) |
| patient | ❌ | ❌ | ❌ (structurally: only staff sends notify — fixed this session, §5) |

## 5. Fixes applied to the in-flight phase-16 work this session

1. **A patient's own message no longer attempts a notification.** `sendMessageAction`
   serves both sides, and the in-flight code called `notifyForMessage` for every
   send — a patient's message would have been "delivered" back to the patient's own
   channels. The DB guard silently refused the insert (patients cannot write
   deliveries), so the log would have shown nothing rather than the truth. The
   workflow now runs only on staff sends (`isStaff && provider.kind === 'signed-in'`),
   which also matches 0015's delivery-insert guard (doctor + nurse) exactly.
2. **`setChannelEndpointStatusAction` read `parsed.endpointId` instead of
   `parsed.data.endpointId`** — a type error that would have thrown on every
   activate/deactivate click. Caught by `tsc --noEmit`, fixed.
3. **The surfaces were never mounted.** `ChannelEndpointsControl` was written but
   rendered nowhere, and `listDeliveryRecordsForConversation` /
   `listChannelEndpoints` were never called — so the thread never received
   `deliveries` and the channel badge and delivery rows could never appear.
   The provider messages page now fetches both (org-scoped) for the selected
   conversation, passes the deliveries to `ThreadView`, and mounts the control
   above the thread with a `canManage` mirror of `CAN_MESSAGE` (read-only for the
   roles that may read but not write).
4. **Error surfacing in the control**: the activate/deactivate click ignored the
   action result; failures now set the alert line (the honest surface).

## 6. Decisions reported

- **No DELETE grant on `channel_endpoints`.** "Remove" is `status = 'inactive'` —
  the delivery workflow reads active endpoints only, and the endpoint history
  stays auditable (0015's audit trigger covers insert/update). A channel is
  deactivated, never erased.
- **One endpoint per channel per patient** enforced in the action (find-and-replace
  on the handle), while the DB's unique index is the coarse `(patient, channel,
  handle)` — the adapter never guesses a destination and a stale handle is
  replaced by staff, not appended alongside.
- **The patient side is deliberately unchanged**: patients read their thread;
  the channel control and delivery log are staff surfaces (the endpoint is
  contact data, not a patient write surface — 16-03).
- **`channel` includes `in_app` in the 0015 check constraint** to mirror 0014's
  `conversation_messages.channel` vocabulary; only `whatsapp`/`telegram` are
  delivered rows.

## 7. Out of scope (recorded as decisions, not omissions)

- **Real transports**: the adapters ship unconfigured on purpose — the
  WhatsApp Business / Telegram Bot credentials are an owner decision with cost
  implications (§9). No provider is called; nothing is simulated.
- **pgTAP suites** and the cloud apply (16-04, owner).
- **A per-message delivery row on the patient side** (read-only staff surface).
- **Visual baselines** for the new control and the delivery rows.

## 8. Deferred (owner constraints + this session's directives)

- Migration 0015 apply + pgTAP (staff-only endpoint writes, append-only
  deliveries, cross-patient attribution refusal, org isolation).
- `database.types.ts` CLI regeneration.
- **No test suites run this session (owner-directed)** — the unit/acceptance
  pass is the owner's, including the work this session touched (`adapters`,
  `notify`, `workflow`, `actions`, the page wiring).
- **No commits this session (owner-directed)** — the owner commits per phase.
- Visual baselines + screenshot legs.

## 9. Owner design-gate brief

1. **The credentials decision**: supply WhatsApp Business API (or a BSP) and a
   Telegram bot token, or ship the honest `not_configured` state as the phase's
   face. *Ask:* which, and if credentials, which provider the registry entry
   should wrap.
2. **The channel control's home**: it mounts on `/provider/messages` beside the
   selected thread. *Ask:* confirm, or move it onto the patient folder/overview.
3. **Read-only roles**: receptionist and admin_owner see endpoints and the
   delivery log but cannot manage them. *Ask:* confirm, or widen to a capability.
4. **Notification triggers**: staff messages, the opening message, and task
   assignment notify; a patient's own message does not. *Ask:* confirm — in
   particular whether task *completion* by the patient should notify the team
   (out of scope here).

## 10. Gate status

**Implementation: GREEN** for the gates run (tsc 0 errors, token/lint exit 0,
CHAN-01…03 traced with the role matrix). **Phase acceptance: PENDING** the §8
deferrals and the §9 verdicts — plus, this session, the owner's unit pass and
per-phase commit, per the session constraints (§20.7).
