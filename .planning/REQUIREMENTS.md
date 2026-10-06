# Requirements — Patient Clinical Workspace

Derived from PRODUCT-MASTER-SPEC.md (authoritative control pack). Auto mode: all table-stakes features plus everything the spec mandates are included.

## v1 Requirements

### GOV — Project Constitution, UI Design Contract, Invariants, Tokens (Phase 1)

- [x] **GOV-01**: As a team member, I can consult a permanent project constitution that records the source-of-truth hierarchy (constitution → reference images → UI spec → phase spec → plan → tasks → repository) so every later decision has a defined authority order. (§1, §19 Ph001)
- [x] **GOV-02**: As a team member, I can consult a Reference UI Specification / UI design contract that registers the three per-surface primary references (`provider-home-primary.jpg`, `patient-workspace-timeline-primary.jpg`, `patient-home-primary.jpg`) and states the old screenshot is diagnostic evidence only. (§2, §19 Ph001)
- [x] **GOV-03**: As a team member, I can consult UI invariants that must not drift (visual character: premium, clinical, calm, organized, dense-but-scannable, restrained; geometry: pills, rounded cards, soft corners; depth: subtle) so any implementation can be checked against them. (§2.1–§2.4, §19 Ph001)
- [x] **GOV-04**: As a team member, I can consult frozen semantic design tokens (`frame`, `frameForeground`, `canvas`, `surface`, `surfaceMuted`, `surfaceRaised`, `textPrimary`, `textSecondary`, `borderSubtle`, `accent`, `success`, `warning`, `critical`, `info`) derived from the olive/ivory/yellow reference families, with no scattered raw hex anywhere in the product. (§2.2)
- [x] **GOV-05**: As a team member, I can consult recorded visual QA rules, responsive design rules, and motion rules so phase acceptance has objective visual criteria. (§19 Ph001, §21, §26, §9)
- [x] **GOV-06**: As a team member, I can consult explicit anti-generic-SaaS and anti-gamification constraints in the constitution so drift is rejected at review time, not after release. (§2.1, §19 Ph001)

### FOUND — App Shell, Routing, Primitives, Accessibility + Motion Baseline (Phase 2)

- [ ] **FOUND-01**: As a user, the application presents a Next.js application shell with route structure and layout primitives, containing no fake clinical dashboard and no sample patient data beyond isolated development fixtures. (§19 Ph002)
- [x] **FOUND-02**: As a developer, I can build any screen from the shared primitive set — surfaces, buttons, pills, compact controls, modal/sheet primitives — instead of hand-rolling per-screen components. (§19 Ph002)
- [ ] **FOUND-03**: As a user, typography and surface styling across the app follow one hierarchy derived from the reference (compact, precise, information-dense), not per-screen improvisation. (§2.3, §19 Ph002)
- [x] **FOUND-04**: As a keyboard or assistive-technology user, the shell and primitives meet the accessibility baseline (focus order, labels, contrast against frozen tokens). (§19 Ph002)
- [x] **FOUND-05**: As a user with reduced-motion preference, all shell-level motion (entrance/exit, layout transitions) is fast, smooth, subtle, interruptible, and fully disabled or reduced when my OS requests it. (§9)

### AUTH — Authentication, Org Membership, RBAC, RLS, Audit (Phase 3)

- [ ] **AUTH-01**: As a user, I can authenticate, and my permitted workspace is derived from server-side identity plus organization membership — never from client state. (§3.1, §12)
- [ ] **AUTH-02**: As an organization owner, users gain access only through explicit organization membership records, so an authenticated stranger cannot see the organization's data. (§12)
- [ ] **AUTH-03**: As a user, my role (Provider/Doctor, Nurse, Receptionist, Patient, Admin/Organization Owner) is resolved server-side from trusted membership data; a client-side toggle, route, local state value, query parameter, or hidden form must not grant access to another workspace. (§3.1, §12; Phase 003 acceptance condition: "A frontend toggle must NOT grant access to another workspace")
- [ ] **AUTH-04**: As a database, every clinical table enforces Row Level Security so a direct query or service call without membership context cannot read or write another organization's rows. (§12)
- [ ] **AUTH-05**: As a doctor, I can create and update clinical records per my permissions; as a nurse I can enter only permitted vitals/demographics/operational data; as a receptionist only permitted administrative registration/scheduling; as a patient only explicitly allowed patient-generated observations — all enforced at the backend/data layer, not merely hidden in the UI. (§3.2)
- [ ] **AUTH-06**: As a security reviewer, sensitive mutations (clinical record changes, document access, membership changes) produce audit log entries, so tampering is traceable. (§12, §19 Ph003)
- [ ] **AUTH-07**: As a patient, I cannot gain provider-only clinical authoring privileges by manipulating the frontend, because authorization is checked server-side per role and context. (§3.2, §12)
- [ ] **AUTH-08**: As a security reviewer, I can run the role-based acceptance gate across Doctor, Nurse, Receptionist, Patient, and unauthorized accounts verifying route, component, API, database, mutation, document, and visibility isolation — the same browser UI must not switch privilege levels. (§22)

### PROV — Provider Home, Patient Folders, Retrieval Controls (Phase 4)

- [ ] **PROV-01**: As a provider, my patient collection is a visual grid of elegant digital clinical folders (not a generic table/list) that open the patient's workspace on interaction. (§5)
- [ ] **PROV-02**: As a provider, folder retrieval controls — Recent, Today, Needs Attention, Critical, and Search — coexist with the folder grid as the primary discovery interaction. (§5)
- [ ] **PROV-03**: As a provider, each folder shows concise identity/context (name, minimal age/sex or MRN where appropriate, compact status label, last relevant activity, small contextual indicators) with status using subtle semantic accents — never every folder a different saturated color. (§5)
- [ ] **PROV-04**: As a provider, I have a new-patient entry point and contextual quick actions on Provider Home, and no unrelated specialty labels appear in the shell. (§19 Ph004, §3.3)

### WSP — Patient Workspace Shell + Overview (Phase 5)

- [ ] **WSP-01**: As a clinician, the patient workspace primary navigation is exactly, in order: `Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics` — with no specialty tab, no duplicate "All" clinical row, no Vital Signs primary tab, and no Communication primary clinical tab. (§6, §3.4)
- [ ] **WSP-02**: As a clinician, Overview answers at a glance: who is this patient, what matters now, what changed, what is active, what needs follow-up, and what the recent longitudinal record shows — via compact identity area, current clinical context, vitals snapshot where appropriate, timeline region, recent records, lab snapshot where relevant, contextual attention indicators, and compact temporal navigation. (§7)
- [ ] **WSP-03**: As a clinician, Overview avoids huge redundant cards; density follows the reference's compact clinical rhythm. (§7, §3.8)

### TL — D3 Clinical Timeline (Phase 6)

- [ ] **TL-01**: As a clinician, the timeline is powered by D3.js (scales, positioning, event mapping, SVG paths, branches, zoom, pan, temporal domain changes) — it must not be a static drawing or another charting engine. (§8.1)
- [ ] **TL-02**: As a clinician, the timeline renders a unified Care/Clinical Event projection (visit, diagnosis, symptom, medication-started/changed/stopped, lab-ordered/result, imaging-ordered/result, vital-measurement, procedure, hospitalization, document, follow-up, care-plan-change, patient-reported-event) while the database remains the source of truth — the timeline is never canonical storage. (§8.2)
- [ ] **TL-03**: As a clinician, I can drag-to-pan horizontally and explore the patient's history fluidly. (§8.3)
- [ ] **TL-04**: As a clinician, semantic zoom collapses hundreds of events into temporal clusters at broad zoom (chronology and milestones preserved) and reveals individual events, relationships, and detailed micro-cards as I zoom in. (§8.4)
- [ ] **TL-05**: As a clinician, main milestones can carry branches to related sub-events that are thin, precise, visually calm, smoothly curved, spatially predictable, and collision-aware — never random crossing spaghetti paths. (§8.5)
- [ ] **TL-06**: As a clinician, a compact bottom scrubber lets me move quickly through months, years, event density, and the current timeline range without becoming a giant secondary navigation bar. (§8.6)
- [ ] **TL-07**: As a clinician, I can select an event to open its details with contextual expansion and category filtering. (§8.3)
- [ ] **TL-08**: As a clinician, timeline interactions work with keyboard and touch where practical. (§8.3)
- [ ] **TL-09**: As a clinician with a patient who has thousands of events, the timeline stays performant (clustering, efficient rendering, no perceptible jank during pan/zoom). (§8.3, §25)

### VIS — Visits Workflow (Phase 7)

- [ ] **VIS-01**: As a clinician, I can run the visit workflow Pre-Visit → During Visit → After Visit, including visit creation, documentation, and follow-up. (§19 Ph007)
- [ ] **VIS-02**: As a clinician, completed visit activity projects into the patient's timeline according to the approved data model and permissions. (§19 Ph007, §8.2)
- [ ] **VIS-03**: As a receptionist, I can perform permitted scheduling/registration tasks for visits without gaining clinical authoring rights. (§3.2, §19 Ph007)

### MED — Medications Lifecycle (Phase 8)

- [ ] **MED-01**: As a clinician, I can manage the medication lifecycle start → active → change → pause/stop → historical, with dosage/frequency/route/duration where required. (§19 Ph008)
- [ ] **MED-02**: As a clinician, medication state changes project onto the timeline as distinct events (started/changed/stopped). (§8.2, §19 Ph008)
- [ ] **MED-03**: As an architect, the medication data model is prepared for future CDSS (structured dosage, interactions-ready fields) without prematurely implementing unsafe decision-making. (§19 Ph008)

### LAB — Labs + Imaging (Phase 9)

- [ ] **LAB-01**: As a clinician, I can manage lab orders and results through their clinical lifecycle with full provenance. (§19 Ph009, §23)
- [ ] **LAB-02**: As a clinician, I can manage imaging through its lifecycle with document/media relationships preserved. (§19 Ph009)
- [ ] **LAB-03**: As a clinician, lab and imaging events project into the patient's timeline. (§19 Ph009, §8.2)

### ALG — Allergies + Genetics (Phase 10)

- [ ] **ALG-01**: As a clinician, I can record and view allergies with strong provenance and appropriate permissions. (§19 Ph010, §23)
- [ ] **ALG-02**: As a clinician, I can record and view genetics data with strong provenance and appropriate permissions. (§19 Ph010, §23)
- [ ] **ALG-03**: As a security reviewer, allergy and genetics records enforce role-based visibility at the data layer (sensitive categories are not visible to unauthorized roles). (§19 Ph010, §12)

### AI — AI Analytics / Patient Intelligence (Phase 11)

- [ ] **AI-01**: As a clinician, AI Patient Intelligence assists me with change detection, summarization (recent history / last period), attention signals, trend interpretation, and documentation assistance. (§10, §19 Ph011)
- [ ] **AI-02**: As a clinician, every clinically meaningful AI output carries provenance (distinguishing AI-extracted/AI-generated/verified-by-clinician/system-derived) and requires human review before it is treated as authoritative. (§10, §23)
- [ ] **AI-03**: As a product owner, the system never performs autonomous diagnosis or autonomous prescribing — AI is an assistive layer only. (§10, §27)

### OCR — Prescription OCR + Document Intelligence (Phase 12)

- [ ] **OCR-01**: As a doctor, the prescription ingestion pipeline runs image → preprocessing → OCR/vision extraction → structured extraction → medical entity normalization → ambiguity/confidence analysis → clinician verification → persistence → projection into patient record/timeline. (§11, §19 Ph012)
- [ ] **OCR-02**: As a doctor, I always see the original image beside extracted fields during verification, and low-confidence or ambiguous fields are highlighted. (§11)
- [ ] **OCR-03**: As a doctor, unclear medication names, doses, durations, or diagnoses are never guessed — candidate matches may be shown, but I make the final confirmation, and unverified extraction is never persisted as authoritative. (§11, §27)
- [ ] **OCR-04**: As an architect, the document-intelligence architecture later supports lab reports, discharge summaries, referrals, external imaging reports, and prior prescriptions, with source/provenance metadata stored. (§11)

### PTH — Patient Home (Phase 13)

- [ ] **PTH-01**: As a patient, my home surfaces Today's Care, Next Action, Medications, Appointments, Health Snapshot, Quick Log, Care Plan, Documents, and Communication with lower information density but the identical design language. (§14, §19 Ph013)
- [ ] **PTH-02**: As a patient, I can record only the patient-generated health observations that are explicitly allowed — I never gain provider-only clinical authoring privileges. (§3.2, §14)
- [ ] **PTH-03**: As a patient, my experience is never gamified (no excessive points, levels, fireworks, cartoon rewards, or aggressive gamification language). (§14, §27)

### TASK — Care Tasks / Adherence (Phase 14)

- [ ] **TASK-01**: As a patient, I can track care tasks and see subtle adherence feedback through progress and completion states. (§19 Ph014, §14)
- [ ] **TASK-02**: As a provider, patient care-task activity is visible in the patient context and projects appropriately into the clinical record. (§19 Ph014, §13)
- [ ] **TASK-03**: As a product owner, care-task UI introduces no gaming-heavy patterns. (§19 Ph014, §27)

### COMM — Communication Model + Surfaces (Phase 15)

- [ ] **COMM-01**: As a provider or patient, I communicate through a unified conversation abstraction with channels such as in-app, WhatsApp, and Telegram. (§15)
- [ ] **COMM-02**: As a clinician, messaging never becomes an uncontrolled shadow medical record — clinical truth remains in the clinical record. (§15)
- [ ] **COMM-03**: As a user, communication appears through the provider/profile communication controls and approved communication surfaces — never as a primary clinical tab. (§6, §15)

### CHAN — WhatsApp + Telegram Channels (Phase 16)

- [ ] **CHAN-01**: As a provider, the WhatsApp channel adapter delivers notification workflows through the unified conversation model. (§19 Ph016, §15)
- [ ] **CHAN-02**: As a provider, the Telegram channel adapter delivers notification workflows through the unified conversation model. (§19 Ph016, §15)
- [ ] **CHAN-03**: As a product owner, channel adapters are integrated with the patient context (messages relate to the right patient/organization with proper permissions). (§19 Ph016, §12)

### TH — Telehealth (Phase 17)

- [ ] **TH-01**: As a clinician, I can run the consultation workflow Appointment → Start consultation → Video surface → Patient context → Timeline/clinical workspace → Visit documentation → Complete visit. (§16, §19 Ph017)
- [ ] **TH-02**: As a clinician, the clinical workspace remains visible and usable during the consultation — telehealth is not a generic Zoom clone. (§16)
- [ ] **TH-03**: As a clinician, completed telehealth visits document into the same visit/clinical record model as in-person visits. (§16, §19 Ph017)

### PAY — Payments (Phase 18)

- [ ] **PAY-01**: As a provider, I see earnings overview, invoice/payment status, and consultation fee status. (§17, §19 Ph018)
- [ ] **PAY-02**: As a patient, I see fees, invoices, payments, and receipts for my care. (§17, §19 Ph018)
- [ ] **PAY-03**: As an architect, payment providers sit behind an abstraction so the clinical domain is not hardcoded to a single provider. (§17)
- [ ] **PAY-04**: As a clinician, the clinical timeline is not polluted with unnecessary financial information. (§17)

### OFF — Offline / Sync Semantics (Phase 19)

- [ ] **OFF-01**: As a user, offline-capable workflows explicitly distinguish local draft, queued, syncing, synchronized, failed, and conflict states. (§18, §19 Ph019)
- [ ] **OFF-02**: As a user, the application never tells me a sensitive clinical mutation is permanently saved while it exists only locally. (§18, §27)
- [ ] **OFF-03**: As a user, sync conflicts surface for resolution instead of silently overwriting data. (§18, §19 Ph019)

### SEC — Security / Audit Hardening (Phase 20)

- [ ] **SEC-01**: As a security reviewer, I can audit auth, RLS, organization isolation, sensitive data access, documents, and auditability with documented findings. (§19 Ph020)
- [ ] **SEC-02**: As a security reviewer, session behavior, API exposure, and privacy failure modes are audited and hardened (including no PHI in logs/analytics). (§19 Ph020, §25)
- [ ] **SEC-03**: As a product owner, all Phase-003 authorization guarantees still hold after every later phase (regression-checked at hardening). (§19 Ph020, §3.1)

### INTR — Interoperability / FHIR Mapping (Phase 21)

- [ ] **INTR-01**: As an integrator, FHIR/interoperability mapping is added where justified by the approved scope, on top of the relational clinical model. (§19 Ph021, §13)
- [ ] **INTR-02**: As a product owner, interoperability never forces the UI into FHIR-shaped screens — the UI remains reference-driven. (§13)
- [ ] **INTR-03**: As an architect, the data model stays compatible with future interoperability mapping without rework of the clinical core. (§13, §19 Ph021)

### QA — Final Product QA and Convergence (Phase 22)

- [ ] **QA-01**: As a product owner, final QA covers visual, interaction, responsive, accessibility, performance, authorization, and regression dimensions, each with recorded results. (§19 Ph022)
- [ ] **QA-02**: As a product owner, the production build verifies successfully as part of convergence. (§19 Ph022)
- [ ] **QA-03**: As a product owner, each UI phase passed the reference-UI acceptance gate (outer structure, color relationships, spacing rhythm, compactness, card proportions, pill controls, typography hierarchy, timeline behavior, scrubber, density, accent restraint) — anything looking like a generic SaaS dashboard is rejected even if functionality works. (§21)

### UX — Cross-cutting Experience States (assigned to owning phases)

- [ ] **UX-01**: As a user, every major workspace has deliberate loading, empty, error, retry, permission-denied, and offline/sync states — no generic "Loading…" screens, no blank panels when data is unavailable. (§24; owned by Phase 3 baseline, enforced thereafter)
- [ ] **UX-02**: As a user, permission-denied states explain what I lack access to without leaking data existence. (§24, §12; owned by Phase 3)
- [ ] **UX-03**: As a user on an unstable connection, I see the offline/sync state of my workspace rather than silent failures. (§24, §18; owned by Phase 3 baseline)
- [ ] **UX-04**: As a clinician, the timeline meets its performance budget (smooth pan/zoom with large event counts, no unnecessary re-renders). (§25; owned by Phase 6)
- [ ] **UX-05**: As a touch user, the timeline and scrubber are reachable and usable on mobile. (§8.3, §26; owned by Phase 6)
- [x] **UX-06**: As a mobile user, the app adapts (touch targets, compact navigation, reduced density, safe interactions) rather than being a shrunken desktop. (§26; owned by Phase 22 verification)
- [ ] **UX-07**: As a clinician with a large patient collection, folder retrieval stays performant (pagination/virtualization where appropriate). (§25; owned by Phase 4)
- [ ] **UX-08**: As a doctor uploading prescriptions, image/document loading and OCR turnaround remain responsive. (§25; owned by Phase 12)

## v2 Requirements

Deferred without a phase in v1:

- CDSS decision support — Phase 008 prepares the data architecture only; unsafe decision-making is never prematurely implemented (§19 Ph008).
- FHIR-shaped UI screens — explicitly rejected; FHIR mapping may arrive in Phase 021 without reshaping the UI (§13).
- Messaging channels beyond in-app/WhatsApp/Telegram — the unified conversation abstraction must admit them, but they are not v1 scope (§15).

## Out of Scope

| Prohibition (§27) | Reason |
|---|---|
| Hardcoding a specialty (e.g. a cardiology label) in the shell without a data-driven requirement | Specialty/context labels may exist only as real, data-driven concepts with a specified product purpose (§3.3) |
| Frontend-only role switching | Role must come from trusted server-side identity and database membership (§3.1) |
| Authorization based only on client state | Backend/database policy layer must enforce authorization independently of the frontend (§3.1) |
| Generic tables replacing the folder-first patient collection | The folder grid is the primary patient-discovery interaction (§5) |
| Replacing D3 timeline requirements with a static chart | D3.js is mandatory; the timeline is a core product engine, not an ornamental graphic (§8.1, §3.5) |
| Adding random extra navbar categories | Patient workspace primary navigation is exactly the 8 tabs in §6 |
| Generic dashboard design unrelated to the reference | The reference image is the visual source of truth (§2) |
| Saturated multi-color redesign | Restrained semantic accents only; never every folder a different saturated color (§2.2, §5) |
| Excessive glassmorphism | Depth must be subtle and controlled (§2.4) |
| Excessive neumorphism | Controls must remain distinguishable (§2.4) |
| Excessive gamification | Clinical product; adherence is represented subtly (§14) |
| Autonomous clinical AI decisions | AI is an assistive layer, never an autonomous clinician (§10) |
| Silently saving uncertain OCR output | Clinician verification with the original image visible is required (§11) |
| Implementing future phases during the current phase | Phase discipline (§19) |
| Declaring a feature complete solely because the build passes | A successful build is necessary but never sufficient (§20.7) |

## Traceability

| REQ-ID | Phase | Status |
|---|---|---|
| GOV-01 | 1 | Complete |
| GOV-02 | 1 | Complete |
| GOV-03 | 1 | Complete |
| GOV-04 | 1 | Complete |
| GOV-05 | 1 | Complete |
| GOV-06 | 1 | Complete |
| FOUND-01 | 2 | Pending |
| FOUND-02 | 2 | Complete |
| FOUND-03 | 2 | Pending |
| FOUND-04 | 2 | Complete |
| FOUND-05 | 2 | Complete |
| AUTH-01 | 3 | Pending |
| AUTH-02 | 3 | Pending |
| AUTH-03 | 3 | Pending |
| AUTH-04 | 3 | Pending |
| AUTH-05 | 3 | Pending |
| AUTH-06 | 3 | Pending |
| AUTH-07 | 3 | Pending |
| AUTH-08 | 3 | Pending |
| UX-01 | 3 | Pending |
| UX-02 | 3 | Pending |
| UX-03 | 3 | Pending |
| PROV-01 | 4 | Pending |
| PROV-02 | 4 | Pending |
| PROV-03 | 4 | Pending |
| PROV-04 | 4 | Pending |
| UX-07 | 4 | Pending |
| WSP-01 | 5 | Pending |
| WSP-02 | 5 | Pending |
| WSP-03 | 5 | Pending |
| TL-01 | 6 | Pending |
| TL-02 | 6 | Pending |
| TL-03 | 6 | Pending |
| TL-04 | 6 | Pending |
| TL-05 | 6 | Pending |
| TL-06 | 6 | Pending |
| TL-07 | 6 | Pending |
| TL-08 | 6 | Pending |
| TL-09 | 6 | Pending |
| UX-04 | 6 | Pending |
| UX-05 | 6 | Pending |
| VIS-01 | 7 | Pending |
| VIS-02 | 7 | Pending |
| VIS-03 | 7 | Pending |
| MED-01 | 8 | Pending |
| MED-02 | 8 | Pending |
| MED-03 | 8 | Pending |
| LAB-01 | 9 | Pending |
| LAB-02 | 9 | Pending |
| LAB-03 | 9 | Pending |
| ALG-01 | 10 | Pending |
| ALG-02 | 10 | Pending |
| ALG-03 | 10 | Pending |
| AI-01 | 11 | Pending |
| AI-02 | 11 | Pending |
| AI-03 | 11 | Pending |
| OCR-01 | 12 | Pending |
| OCR-02 | 12 | Pending |
| OCR-03 | 12 | Pending |
| OCR-04 | 12 | Pending |
| UX-08 | 12 | Pending |
| PTH-01 | 13 | Pending |
| PTH-02 | 13 | Pending |
| PTH-03 | 13 | Pending |
| TASK-01 | 14 | Pending |
| TASK-02 | 14 | Pending |
| TASK-03 | 14 | Pending |
| COMM-01 | 15 | Pending |
| COMM-02 | 15 | Pending |
| COMM-03 | 15 | Pending |
| CHAN-01 | 16 | Pending |
| CHAN-02 | 16 | Pending |
| CHAN-03 | 16 | Pending |
| TH-01 | 17 | Pending |
| TH-02 | 17 | Pending |
| TH-03 | 17 | Pending |
| PAY-01 | 18 | Pending |
| PAY-02 | 18 | Pending |
| PAY-03 | 18 | Pending |
| PAY-04 | 18 | Pending |
| OFF-01 | 19 | Pending |
| OFF-02 | 19 | Pending |
| OFF-03 | 19 | Pending |
| UX-06 | 2 | Complete |
| SEC-01 | 20 | Pending |
| SEC-02 | 20 | Pending |
| SEC-03 | 20 | Pending |
| INTR-01 | 21 | Pending |
| INTR-02 | 21 | Pending |
| INTR-03 | 21 | Pending |
| QA-01 | 22 | Pending |
| QA-02 | 22 | Pending |
| QA-03 | 22 | Pending |

Unmapped: 0 ✓
