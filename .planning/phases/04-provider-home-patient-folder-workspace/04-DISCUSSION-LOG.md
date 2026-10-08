# Phase 4: Provider Home + Patient Folder Workspace - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-08
**Phase:** 4-provider-home-patient-folder-workspace
**Areas discussed:** Patient record & new-patient entry, Folder status & retrieval semantics, Quick actions & search, Performance & data model scope

---

## Patient record & new-patient entry

| Option | Description | Selected |
|--------|-------------|----------|
| Patient record only | Provider fills a form; patient record exists immediately with no user account. Optional invite later. | ✓ |
| Record + immediate invite | System immediately generates a Phase 3 invite link. | |
| Requires existing user account | Patient must self-register first via invite. | |

**User's choice:** Patient record only (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Core identity only | Full name, DOB, sex, phone, MRN (auto-generated). | ✓ |
| Core + extended demographics | Plus address, email, emergency contact, insurance, blood type. | |
| Minimal (name + DOB) | Name and DOB only. | |

**User's choice:** Core identity only (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Optional user_id FK | Patient record can exist without user account. Link made on invite signup. | ✓ |
| Fully separate (manual link) | Patient records completely separate from user accounts. | |
| Nullable FK + unlinked tracking | FK nullable but system tracks "unlinked" patients. | |

**User's choice:** Optional user_id FK (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Quick action to invite | Generate Phase 3 invite link from folder card. Linked to patient record. | ✓ |
| No invite action yet | Provider sends invites through existing Members page. | |
| Invite + unlinked-patient prompt | Shows which patients are unlinked with a prompt to invite. | |

**User's choice:** Quick action to invite (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Modal form | Reuses Phase 2 Modal/Sheet primitive. Inline, no navigation away. | ✓ |
| Separate page | Full form layout at /provider/patients/new. | |
| Inline panel | Expandable panel below the CTA. | |

**User's choice:** Modal form (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on home, card appears | Modal closes, new folder card appears in grid. | ✓ |
| Open patient workspace | Navigate to new patient's workspace/overview. | |
| Stay + success + invite prompt | Stay on home, show success toast, prompt to invite. | |

**User's choice:** Stay on home, card appears (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-generated | Sequential ID (e.g. MRN-0001). Provider doesn't fill it in. | ✓ |
| Manual entry | Provider types the MRN. | |
| Auto with manual override | Auto-generated but editable. | |

**User's choice:** Auto-generated (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name, DOB, sex, phone, MRN | Five core fields populate the folder card. | ✓ |
| Core + email | Add email to core set. | |
| Core + address | Add address to core set. | |
| Core + email + address | Both added. | |

**User's choice:** Name, DOB, sex, phone, MRN (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| M/F/Other/Unknown | Standard clinical demographic options. | |
| M/F only | Simpler but less inclusive. | ✓ |
| M/F/Non-binary/Other/Prefer not | More inclusive. | |

**User's choice:** M/F only

---

## Folder status & retrieval semantics

| Option | Description | Selected |
|--------|-------------|----------|
| Stored enum on patient | Status field on patients table with enum. Provider sets manually. | ✓ |
| Computed from clinical data | Status derived from clinical data. No stored field. | |
| Stored + auto-updating rules | Stored enum that auto-updates by rules. Provider can override. | |

**User's choice:** Stored enum on patient (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| 5 statuses per spec | Stable, Follow-up, Needs Review, Critical, New. Maps to success/warning/info/critical/info. | ✓ |
| 4 statuses | Drop "Needs Review". | |
| 3 statuses | Simplified: Stable, Needs Attention, Critical. | |

**User's choice:** 5 statuses per spec (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Activity-based filters | Recent=last activity, Today=created/updated today, Needs Attention=follow_up/needs_review, Critical=critical status. | ✓ |
| Creation-based + schedule | Recent=recently created, Today=today's schedule. | |
| Sort + highlight | Filters change sort order and highlight, no separate views. | |

**User's choice:** Activity-based filters (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Filter tabs above grid | Tabs/toggles above the grid. "All" shows everything. | ✓ |
| Separate sections per filter | Each filter shows its own mini-grid or list. | |
| Dropdown/pill row filter | Single dropdown or pill row that filters inline. | |

**User's choice:** Filter tabs above grid (Recommended)

**Notes:** User said "if there are more questions, use recommendations" — remaining status decisions recorded as agent discretion (Today semantics, default status, manual status change).

---

## Quick actions & search

| Option | Description | Selected |
|--------|-------------|----------|
| Status, invite, schedule | Open workspace, Change status, Send invite, Schedule. CTA: Add New Patient. | ✓ |
| Open + change status only | Minimal. | |
| Full action set | Plus Add note, Call patient. | |

**User's choice:** Status, invite, schedule (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Name + MRN + phone | Three fields. | |
| Name + MRN only | Two fields. | |
| Name + MRN + phone + DOB | Four fields. | ✓ |

**User's choice:** Name + MRN + phone + DOB

---

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side + debounce | Server-side query with 300ms debounce. Scales to large collections. | ✓ |
| Client-side filter | Faster but only for small collections. | |
| Server-side, no debounce | More API calls but snappier. | |

**User's choice:** Server-side + debounce (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Search within active filter | Search respects the selected filter tab. | ✓ |
| Search always searches all | Search overrides the filter. | |
| Independent (visual merge) | Search and filter are independent with visual indicator. | |

**User's choice:** Search within active filter (Recommended)

---

## Performance & data model scope

| Option | Description | Selected |
|--------|-------------|----------|
| Server-side pagination | 20-30 folders per page with "Load more" button. | ✓ |
| Virtualized grid | Renders only visible folders. Best for 1000+ patients. | |
| Load all (no pagination) | Fine for small clinics but won't scale. | |

**User's choice:** Server-side pagination (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Patients table only | Only `patients` table. No clinical tables. | ✓ |
| Patients + appointments | Plus minimal appointments table for Today filter. | |
| Patients + appointments + encounters | More complete but larger scope. | |

**User's choice:** Patients table only (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Timestamp on patient row | `last_activity_at` denormalized timestamp. | ✓ |
| Separate activity log table | More auditable but more complex. | |
| Use created_at only | Simplest but less useful. | |

**User's choice:** Timestamp on patient row (Recommended)

---

| Option | Description | Selected |
|--------|-------------|----------|
| Today = created/updated today | Honest scope. Upgrades in Phase 7. | ✓ |
| Minimal appointments table | Build scheduling metadata just for Today filter. | |
| Today = empty state placeholder | Placeholder until Phase 7. | |

**User's choice:** Today = created/updated today (Recommended)

---

## Claude's Discretion

- Exact MRN sequence format (e.g. `MRN-0001` vs `P-0001` vs numeric-only)
- Filter tab component shape (pill tabs vs. segmented control)
- Modal form layout and field ordering
- How "Schedule appointment" quick action manifests (disabled state vs. hidden)
- Empty state copy for each filter
- "Load more" button styling and placement

## Deferred Ideas

- Appointments / scheduling data model — Phase 7
- Extended patient demographics (email, address, emergency contact, insurance)
- Activity log table (full audit trail of patient activity)
- Virtualized grid (if collections grow beyond thousands)
- Auto-updating status rules (e.g. overdue follow-up auto-sets needs_review)
