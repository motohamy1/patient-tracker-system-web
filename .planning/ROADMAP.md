# Roadmap: Patient Clinical Workspace

## Overview

This roadmap operationalizes PRODUCT-MASTER-SPEC.md §19 (Phase 001–022) as a 22-phase greenfield rebuild. Spec Phase 000 (Greenfield Preflight + Product Baseline) is satisfied by this GSD initialization run — the repository was reset to greenfield, the control pack and reference assets were preserved, and `.planning/` was established as persistent project state — so it does not appear as a numbered phase. The journey: Phase 1 freezes the constitution, reference UI contract, and semantic tokens (no product code); Phase 2 builds the foundation shell; Phase 3 establishes the security model (authentication, RBAC, RLS, audit) that everything else depends on; Phases 4–19 deliver user capabilities in dependency order (provider home → patient workspace → D3 timeline → clinical domains → patient experience → communication, telehealth, payments, offline); Phases 20–22 harden security, add interoperability, and converge through final QA. A `**Mode:** mvp` line appears on phases 4–19 only — each is a vertical, end-to-end user-capability slice. Phases 1–3 and 20–22 omit it because they are constitution/foundation/security/interop/QA work, not user-capability slices (explicit deviation from the blanket auto-mode default). UI phases carry `**UI hint**: yes`; backend/security/interop phases (3, 19, 20, 21) carry `**UI hint**: no`.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Project Constitution + Reference UI Specification** - Constitution, reference UI design contract, UI invariants, semantic tokens, visual/responsive/motion QA rules (completed 2026-10-05)
- [x] **Phase 2: Foundation and App Shell** - Next.js shell, routes, layout primitives, tokens, typography, surfaces, controls, a11y + motion baseline (completed 2026-10-07)
- [ ] **Phase 3: Authentication, Organizations, RBAC and RLS** - Server-side identity, org membership, role resolution, RLS policies, audit foundation
- [ ] **Phase 4: Provider Home + Patient Folder Workspace** - Visual patient-folder collection with retrieval controls
- [ ] **Phase 5: Patient Workspace / Overview** - Exact 8-tab shell and command-surface Overview
- [ ] **Phase 6: D3 Clinical Timeline** - Interactive D3 timeline engine over unified clinical events
- [ ] **Phase 7: Visits Workflow** - Pre-Visit → During Visit → After Visit
- [ ] **Phase 8: Medications** - Medication lifecycle with CDSS-ready data architecture
- [ ] **Phase 9: Labs + Imaging** - Clinical lifecycles, provenance, media, timeline projection
- [ ] **Phase 10: Allergies + Genetics** - Sensitive record views with provenance and permissions
- [ ] **Phase 11: AI Analytics / Patient Intelligence** - Assistive AI: change detection, summarization, attention, trends
- [ ] **Phase 12: Prescription OCR + Document Intelligence** - Human-in-the-loop ingestion pipeline
- [ ] **Phase 13: Patient Home** - Lower-density patient experience in the same design language
- [ ] **Phase 14: Care Tasks / Adherence** - Subtle care-task tracking and adherence feedback
- [ ] **Phase 15: Communication** - Unified conversation model and provider/patient surfaces
- [ ] **Phase 16: WhatsApp + Telegram** - Channel adapters and notification workflows
- [ ] **Phase 17: Telehealth** - Consultation workflow integrated with patient context
- [ ] **Phase 18: Payments** - Provider/patient payment abstraction and UI
- [ ] **Phase 19: Offline / Sync** - Draft/outbox/sync/conflict semantics
- [ ] **Phase 20: Security / Audit Hardening** - Auth, RLS, isolation, data, auditability, sessions, API, privacy
- [ ] **Phase 21: Interoperability** - FHIR mapping where justified, without FHIR-shaped UI
- [ ] **Phase 22: Final Product QA and Convergence** - Visual/interaction/responsive/a11y/performance/authz/regression QA + production build

## Phase Details

### Phase 1: Project Constitution + Reference UI Specification

**Goal**: Create the permanent project constitution, reference UI specification / UI design contract, UI invariants, semantic design tokens, visual QA rules, responsive design rules, motion rules, and explicit anti-generic-SaaS / anti-gamification constraints. No product feature implementation yet.
**Mode**: constitution/contract work, not a user-capability slice
**Depends on**: Nothing (first phase)
**Requirements**: GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06
**Success Criteria** (what must be TRUE):

  1. The constitution records the source-of-truth hierarchy with the per-surface reference images (`provider-home-primary.jpg`, `patient-workspace-timeline-primary.jpg`, `patient-home-primary.jpg`) registered under `docs/reference/` as binding design grammar and `patient-tracking-dashboard.jpg` recorded as diagnostic evidence only.
  2. Semantic design tokens (frame/canvas/surface/accent families in olive/ivory/yellow) are frozen in a permanent token file and no component-level raw hex exists.
  3. UI invariants, visual QA rules, responsive rules, and motion rules are written down and the anti-generic/anti-gamification constraints are explicit.
  4. No product code was written in this phase.

**UI hint**: yes
**Plans**: 6/6 plans complete

Plans:

- [x] 01-01-PLAN.md
- [x] 01-02-PLAN.md
- [x] 01-03-PLAN.md
- [x] 01-04-PLAN.md
- [x] 01-05-PLAN.md
- [x] 01-06-PLAN.md

### Phase 2: Foundation and App Shell

**Goal**: Build only the Next.js application shell: route structure, layout primitives, semantic design tokens, typography, surfaces, buttons, pills, compact controls, modal/sheet primitives, accessibility baseline, and motion foundation. No fake clinical dashboard; no fake patient data beyond isolated development fixtures.
**Mode**: foundation slice, not an end-user capability
**Depends on**: Phase 1
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, UX-06
**Success Criteria** (what must be TRUE):

  1. A user can navigate the empty application shell on every defined route with correct layout, typography, and token-driven styling.
  2. Every screen can be composed from the shared primitives (surfaces, buttons, pills, compact controls, modal/sheet) rather than bespoke components.
  3. Keyboard/assistive navigation works through the shell and primitives, and reduced-motion preference disables or reduces all motion.
  4. No fake clinical dashboard or sample patient data exists outside isolated development fixtures.

**UI hint**: yes
**Plans**: 11/11 plans complete

Plans:

- [x] 02-01-PLAN.md — D-27 re-sample of `frame` and `surfaceMuted`, owner visual-review gate
- [x] 02-02-PLAN.md — repository scaffold, pinned dependency install, build hooks
- [x] 02-03-PLAN.md — token codegen (`@theme inline` + `:root`), globals.css, root layout, vitest config
- [x] 02-04-PLAN.md — `scripts/check-design-tokens.mjs` (the three machine checks)
- [x] 02-05-PLAN.md — `Surface`, `Icon`, `Button`
- [x] 02-06-PLAN.md — motion vocabulary, `Pill`, `TabBar`/`SegmentedControl`, `CompactControl`
- [x] 02-07-PLAN.md — `EmptyState`, hand-rolled `Overlay` (modal/sheet)
- [x] 02-08-PLAN.md — provider route group, icon rail, 8 tab routes
- [x] 02-09-PLAN.md — auth/patient route groups, `not-found.tsx`, dev fixtures
- [x] 02-10-PLAN.md — dev-only primitives gallery
- [x] 02-11-PLAN.md — Playwright harness, 48 committed baselines, phase gate

Wave dependency notes — **Wave 2** *(blocked on Wave 1 completion)*: 02-03.
**Wave 3** *(blocked on Wave 2)*: 02-04. **Wave 4** *(blocked on Wave 3)*: 02-05.
**Wave 5** *(blocked on Wave 4)*: 02-06. **Wave 6** *(blocked on Wave 5)*: 02-07.
**Wave 7** *(blocked on Wave 6)*: 02-08. **Wave 8** *(blocked on Wave 7)*: 02-09.
**Wave 9** *(blocked on Wave 8)*: 02-10. **Wave 10** *(blocked on Wave 9)*: 02-11.

Wave 1 runs 02-01 and 02-02 in parallel — they share no file. 02-01 closes the D-27 owner
gate before 02-03 reads `tokens.json`, so the re-sampled values are settled before any
primitive consumes them. 02-09 is serialized after 02-08 because its `read_first` targets
02-08's provider layout.

Cross-cutting constraints: none shared by two or more plans.

### Phase 3: Authentication, Organizations, RBAC and RLS

**Goal**: Implement authentication, role resolution, organization membership, provider/patient authorization, server-protected routes, database policies, RLS, sensitive mutation protection, and the audit foundation.
**Mode**: security foundation, not a user-capability slice
**Depends on**: Phase 2
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, UX-01, UX-02, UX-03
**Success Criteria** (what must be TRUE):

  1. A frontend toggle must NOT grant access to another workspace (spec Phase 003 acceptance condition) — verified by attempting every client-side route/state/parameter manipulation.
  2. The role-based acceptance gate passes for Doctor, Nurse, Receptionist, Patient, and unauthorized accounts across route, component, API, database, mutation, document, and visibility checks.
  3. Sensitive mutations produce audit log entries retrievable by a security reviewer.
  4. Direct database/API access without membership context cannot read or write another organization's rows (RLS verified).

**UI hint**: no
**Plans**: 1/6 plans executed

Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Supabase infrastructure (packages, client factories, proxy session refresh, provisioning gate)

**Wave 2** *(blocked on Wave 1 completion)*

- [ ] 03-02-PLAN.md — Schema migrations + RLS + audit triggers + [BLOCKING] db push + pgTAP deny tests

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-03-PLAN.md — RBAC vocabulary, server-side role resolution, layout slot wiring, denial surface

**Wave 4** *(blocked on Wave 3 completion)*

- [ ] 03-04-PLAN.md — Auth server actions + PKCE confirm route + credential surfaces + email-flow gate

**Wave 5** *(blocked on Wave 4 completion)*

- [ ] 03-05-PLAN.md — Invite engine, signup-then-join redeem, org creation, members surface

**Wave 6** *(blocked on Wave 5 completion)*

- [ ] 03-06-PLAN.md — UX baseline + offline strip + admin audit surface + seeds + AUTH-08 acceptance gate

### Phase 4: Provider Home + Patient Folder Workspace

**Goal**: Build the provider home. The hero interaction is the visual patient-folder collection, with compact search, patient folders, Recent, Today, Needs Attention, Critical, a new patient entry point, and contextual quick actions. Do not add unrelated specialty labels.
**Mode**: mvp
**Depends on**: Phase 3
**Requirements**: PROV-01, PROV-02, PROV-03, PROV-04, UX-07
**Success Criteria** (what must be TRUE):

  1. A provider opens Provider Home and scans patients as a folder grid (not a table/list) that opens a patient's workspace on click.
  2. Recent, Today, Needs Attention, Critical, and Search coexist with the grid and return correct results.
  3. Folder status uses subtle semantic accents — never every folder a different saturated color — and no unrelated specialty labels appear anywhere in the shell.
  4. Retrieval stays responsive on a large patient collection.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 04-01: TBD

### Phase 5: Patient Workspace / Overview

**Goal**: Build the patient workspace shell with the exact tab structure `Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics`, and the Overview command surface (identity, current summary, vitals context, timeline region, recent records, lab snapshot where relevant, compact timeline controls).
**Mode**: mvp
**Depends on**: Phase 4
**Requirements**: WSP-01, WSP-02, WSP-03
**Success Criteria** (what must be TRUE):

  1. The primary navigation is exactly the 8 specified tabs in order — no specialty tab, no duplicate "All" row, no Vital Signs tab, no Communication tab.
  2. Overview answers who the patient is, what matters now, what changed, what is active, what needs follow-up, and what the recent record shows at a glance.
  3. Density matches the reference's compact clinical rhythm with no huge redundant cards.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 05-01: TBD

### Phase 6: D3 Clinical Timeline

**Goal**: Implement the actual timeline engine: unified event projection, horizontal pan, semantic zoom, temporal scale, event clustering, branches, event cards, bottom scrubber, event selection, contextual detail, keyboard/touch considerations, and large-dataset performance. The timeline must not be a fixed static drawing.
**Mode**: mvp
**Depends on**: Phase 5
**Requirements**: TL-01, TL-02, TL-03, TL-04, TL-05, TL-06, TL-07, TL-08, TL-09, UX-04, UX-05
**Success Criteria** (what must be TRUE):

  1. Zooming out collapses hundreds of events into temporal clusters while chronology and milestones stay legible; zooming in reveals individual events, relationships, and micro-cards.
  2. Drag-to-pan, the bottom scrubber, and event selection/detail all respond fluidly on a dataset with thousands of events.
  3. Milestone branches are thin, calm, collision-aware paths — never crossing spaghetti.
  4. Timeline interaction works via keyboard and touch where practical.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 06-01: TBD

### Phase 7: Visits Workflow

**Goal**: Implement Pre-Visit → During Visit → After Visit, including visit creation, documentation, follow-up, and timeline projection according to the approved data model/permissions.
**Mode**: mvp
**Depends on**: Phase 6
**Requirements**: VIS-01, VIS-02, VIS-03
**Success Criteria** (what must be TRUE):

  1. A clinician can move a visit through pre-visit, during, and after stages with documentation and follow-up captured.
  2. Visit activity projects into the patient's timeline with correct permissions enforced.
  3. A receptionist can perform permitted scheduling/registration without gaining clinical authoring rights.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 07-01: TBD

### Phase 8: Medications

**Goal**: Implement the medication lifecycle start → active → change → pause/stop → historical with dosage/frequency/route/duration where required, preparing the data architecture for future CDSS without prematurely implementing unsafe decision-making.
**Mode**: mvp
**Depends on**: Phase 7
**Requirements**: MED-01, MED-02, MED-03
**Success Criteria** (what must be TRUE):

  1. A clinician can start, change, pause/stop, and review medications with structured dosage/frequency/route/duration.
  2. Medication state changes appear on the timeline as distinct started/changed/stopped events.
  3. The medication schema is CDSS-ready (structured, interactions-ready) while no autonomous decision-making exists.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 08-01: TBD

### Phase 9: Labs + Imaging

**Goal**: Implement the clinical lifecycles of labs and imaging, with provenance, document/media relationships, and timeline projection.
**Mode**: mvp
**Depends on**: Phase 8
**Requirements**: LAB-01, LAB-02, LAB-03
**Success Criteria** (what must be TRUE):

  1. A clinician can order and receive lab results through their lifecycle with full provenance recorded.
  2. Imaging records preserve document/media relationships accessible from the workspace.
  3. Lab and imaging events appear on the patient's timeline.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 09-01: TBD

### Phase 10: Allergies + Genetics

**Goal**: Implement clinically appropriate record views for allergies and genetics with strong provenance and permissions.
**Mode**: mvp
**Depends on**: Phase 9
**Requirements**: ALG-01, ALG-02, ALG-03
**Success Criteria** (what must be TRUE):

  1. Clinicians can record and view allergies and genetics with source/creator/verification provenance.
  2. Role-based visibility is enforced at the data layer for these sensitive categories.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 10-01: TBD

### Phase 11: AI Analytics / Patient Intelligence

**Goal**: Implement assistive AI capabilities focused on change detection, summarization, attention signals, trend interpretation, and documentation assistance. Do not implement autonomous diagnosis or autonomous prescribing.
**Mode**: mvp
**Depends on**: Phase 10
**Requirements**: AI-01, AI-02, AI-03
**Success Criteria** (what must be TRUE):

  1. A clinician sees AI-assisted change detection, summaries, attention signals, and trend interpretation in the workspace.
  2. Every clinically meaningful AI output carries provenance and requires human review before being treated as authoritative.
  3. No autonomous diagnosis or prescribing exists anywhere in the flow.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 11-01: TBD

### Phase 12: Prescription OCR + Document Intelligence

**Goal**: Implement the complete human-in-the-loop ingestion workflow: image → preprocessing → OCR/vision extraction → structured extraction → normalization → confidence analysis → clinician verification → persistence → timeline projection.
**Mode**: mvp
**Depends on**: Phase 11
**Requirements**: OCR-01, OCR-02, OCR-03, OCR-04, UX-08
**Success Criteria** (what must be TRUE):

  1. A doctor sees the original prescription image beside extracted fields during verification, with low-confidence fields highlighted.
  2. Unclear fields are never guessed — the clinician confirms final values, and unverified extraction is never persisted as authoritative.
  3. Verified extractions project into the patient record and timeline with source/provenance metadata.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 12-01: TBD

### Phase 13: Patient Home

**Goal**: Implement the patient workspace with lower information density but identical design language: Today's Care, Next Action, Medications, Appointments, Health Snapshot, Quick Log, Care Plan, Documents, Communication.
**Mode**: mvp
**Depends on**: Phase 12
**Requirements**: PTH-01, PTH-02, PTH-03
**Success Criteria** (what must be TRUE):

  1. A patient sees Today's Care, Next Action, Health Snapshot, Quick Log, and Care Plan in a lower-density layout sharing the provider design language.
  2. Patient-generated observations are limited to explicitly allowed types; no provider-only authoring is reachable.
  3. The experience contains no gamification (points, levels, fireworks, cartoon rewards).

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 13-01: TBD

### Phase 14: Care Tasks / Adherence

**Goal**: Implement subtle care-task tracking and adherence feedback. Do not introduce gaming-heavy UI.
**Mode**: mvp
**Depends on**: Phase 13
**Requirements**: TASK-01, TASK-02, TASK-03
**Success Criteria** (what must be TRUE):

  1. A patient can track care tasks and see adherence as subtle progress/completion states.
  2. Providers see care-task activity in patient context with correct projections.
  3. No gaming-heavy patterns appear anywhere in the care-task UI.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 14-01: TBD

### Phase 15: Communication

**Goal**: Implement the unified communication model and provider/patient communication surfaces. Clinical truth remains in the clinical record; messaging never becomes a shadow medical record.
**Mode**: mvp
**Depends on**: Phase 14
**Requirements**: COMM-01, COMM-02, COMM-03
**Success Criteria** (what must be TRUE):

  1. Providers and patients exchange messages through one unified conversation abstraction.
  2. Communication is reachable through provider/profile communication controls — never as a primary clinical tab.
  3. Messaging content does not duplicate or replace the clinical record.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 15-01: TBD

### Phase 16: WhatsApp + Telegram

**Goal**: Implement channel adapters and notification workflows for WhatsApp and Telegram through the unified conversation model.
**Mode**: mvp
**Depends on**: Phase 15
**Requirements**: CHAN-01, CHAN-02, CHAN-03
**Success Criteria** (what must be TRUE):

  1. WhatsApp notifications flow through the unified conversation model with correct patient/organization attribution.
  2. Telegram notifications flow through the same model with the same permissions.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 16-01: TBD

### Phase 17: Telehealth

**Goal**: Implement the consultation workflow integrated with patient context: Appointment → Start consultation → Video surface → Patient context → Timeline/clinical workspace → Visit documentation → Complete visit. Not a generic Zoom clone.
**Mode**: mvp
**Depends on**: Phase 16
**Requirements**: TH-01, TH-02, TH-03
**Success Criteria** (what must be TRUE):

  1. A clinician starts a consultation from an appointment and the clinical workspace remains visible and usable during the call.
  2. Completed telehealth visits document into the same visit/clinical record model as in-person visits.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 17-01: TBD

### Phase 18: Payments

**Goal**: Implement the provider/patient payment abstraction and UI: provider earnings overview, invoice/payment status, consultation fee status; patient fee, invoice, payment, receipt. Clinical timeline content is not polluted with financial data.
**Mode**: mvp
**Depends on**: Phase 17
**Requirements**: PAY-01, PAY-02, PAY-03, PAY-04
**Success Criteria** (what must be TRUE):

  1. Providers see earnings, invoice/payment status, and consultation fee status.
  2. Patients see fees, invoices, payments, and receipts.
  3. Payment providers sit behind an abstraction and the timeline stays free of financial noise.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 18-01: TBD

### Phase 19: Offline / Sync

**Goal**: Implement local draft/outbox/sync/conflict semantics that are honest about persistence state.
**Mode**: mvp
**Depends on**: Phase 18
**Requirements**: OFF-01, OFF-02, OFF-03
**Success Criteria** (what must be TRUE):

  1. Users can distinguish local draft, queued, syncing, synchronized, failed, and conflict states.
  2. The app never claims a sensitive clinical mutation is permanently saved while it exists only locally.
  3. Sync conflicts surface for resolution instead of silently overwriting.

**UI hint**: no
**Plans**: TBD

Plans:

- [ ] 19-01: TBD

### Phase 20: Security / Audit Hardening

**Goal**: Audit auth, RLS, organization isolation, sensitive data access, documents, auditability, session behavior, API exposure, and privacy failure modes.
**Mode**: hardening pass, not a user-capability slice
**Depends on**: Phase 19
**Requirements**: SEC-01, SEC-02, SEC-03
**Success Criteria** (what must be TRUE):

  1. A documented security audit covers auth, RLS, organization isolation, sensitive data, documents, and auditability with findings resolved.
  2. Session behavior, API exposure, and privacy failure modes are audited (including no PHI in logs/analytics).
  3. All Phase 3 authorization guarantees still hold (regression-verified).

**UI hint**: no
**Plans**: TBD

Plans:

- [ ] 20-01: TBD

### Phase 21: Interoperability

**Goal**: Add FHIR/interoperability mapping where justified by the approved scope, compatible with the relational clinical model and without FHIR-shaped UI.
**Mode**: integration layer, not a user-capability slice
**Depends on**: Phase 20
**Requirements**: INTR-01, INTR-02, INTR-03
**Success Criteria** (what must be TRUE):

  1. FHIR mapping exists where the approved scope justifies it, on top of the clinical data model.
  2. The UI remains reference-driven — no FHIR-shaped screens were introduced.

**UI hint**: no
**Plans**: TBD

Plans:

- [ ] 21-01: TBD

### Phase 22: Final Product QA and Convergence

**Goal**: Perform visual QA, interaction QA, responsive QA, accessibility QA, performance QA, authorization QA, regression QA, and production build verification.
**Mode**: convergence pass, not a user-capability slice
**Depends on**: Phase 21
**Requirements**: QA-01, QA-02, QA-03
**Success Criteria** (what must be TRUE):

  1. Every QA dimension (visual, interaction, responsive, accessibility, performance, authorization, regression) has recorded results.
  2. Each UI phase passed the reference-UI acceptance gate — anything resembling a generic SaaS dashboard is rejected and corrected.
  3. The production build verifies successfully.

**UI hint**: yes
**Plans**: TBD

Plans:

- [ ] 22-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → … → 22

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Project Constitution + Reference UI Specification | 6/6 | Complete    | 2026-10-05 |
| 2. Foundation and App Shell | 11/11 | Complete   | 2026-10-07 |
| 3. Authentication, Organizations, RBAC and RLS | 1/6 | In Progress|  |
| 4. Provider Home + Patient Folder Workspace | 0/TBD | Not started | - |
| 5. Patient Workspace / Overview | 0/TBD | Not started | - |
| 6. D3 Clinical Timeline | 0/TBD | Not started | - |
| 7. Visits Workflow | 0/TBD | Not started | - |
| 8. Medications | 0/TBD | Not started | - |
| 9. Labs + Imaging | 0/TBD | Not started | - |
| 10. Allergies + Genetics | 0/TBD | Not started | - |
| 11. AI Analytics / Patient Intelligence | 0/TBD | Not started | - |
| 12. Prescription OCR + Document Intelligence | 0/TBD | Not started | - |
| 13. Patient Home | 0/TBD | Not started | - |
| 14. Care Tasks / Adherence | 0/TBD | Not started | - |
| 15. Communication | 0/TBD | Not started | - |
| 16. WhatsApp + Telegram | 0/TBD | Not started | - |
| 17. Telehealth | 0/TBD | Not started | - |
| 18. Payments | 0/TBD | Not started | - |
| 19. Offline / Sync | 0/TBD | Not started | - |
| 20. Security / Audit Hardening | 0/TBD | Not started | - |
| 21. Interoperability | 0/TBD | Not started | - |
| 22. Final Product QA and Convergence | 0/TBD | Not started | - |
