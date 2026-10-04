# Roadmap: Clinical Patient Workspace

## Overview

Deliver the owner-defined 26-phase clinical workspace in its fixed foundation-to-release order. Build the shared app shell and secure data foundation first, then provider and patient workflows, clinical modules, intelligence, communication/business capabilities, synchronization/interoperability, compliance hardening, and final cross-product release QA. The product remains synthetic-data-only until the owner signs the Phase 025 compliance gate. Phase 1 reference-derived visual extraction and approval are blocked until all five design reference images are added under `docs/design/`.

## Phases

1. **Phase 1: Foundation, app shell, design-system infrastructure, i18n/RTL base, visual-regression harness** — establish shared visual primitives, localization, Supabase wiring, and CI.
2. **Phase 2: Identity, organizations, roles, RBAC, RLS, audit foundation** — secure multi-tenant identity and permissions.
3. **Phase 3: Clinical domain core: care-event model, provenance, synthetic seed data, timeline query API** — build the typed synthetic clinical data foundation.
4. **Phase 4: Patient Workspace shell + Overview** — deliver the primary patient workspace frame and Overview structure.
5. **Phase 5: D3 Clinical Timeline** — deliver the interactive longitudinal navigation engine.
6. **Phase 6: Provider Home + Patient Folders + manual new patient** — deliver the provider landing screen and patient collection.
7. **Phase 7: Medications** — enable safe medication review and entry.
8. **Phase 8: Visits** — support encounter workflows from pre-visit through follow-up.
9. **Phase 9: Vitals and Vital Signs history** — support sourced observations and their history.
10. **Phase 10: Labs** — deliver lab result review and follow-up workflow.
11. **Phase 11: Imaging** — deliver secure imaging study review.
12. **Phase 12: Allergies** — deliver allergy review with persistent critical-allergy visibility.
13. **Phase 13: Genetics** — deliver restrained structured genetic findings.
14. **Phase 14: Prescription Intelligence** — convert prescription images into clinician-verified structured records.
15. **Phase 15: Needs Attention, Command Palette, global search** — make urgent work and common actions discoverable.
16. **Phase 16: Patient Intelligence (AI Analytics tab)** — provide source-linked, clinician-controlled AI summaries.
17. **Phase 17: Patient Home** — deliver the patient-facing care overview and quick logging.
18. **Phase 18: Care Tasks and adherence** — turn care plans into non-punitive patient tasks and provider observations.
19. **Phase 19: Communication core** — establish internal messaging, consent, and delivery-state model.
20. **Phase 20: WhatsApp and Telegram adapters** — connect approved external channels through the messaging abstraction.
21. **Phase 21: Telehealth** — connect video consultation with patient context.
22. **Phase 22: Payments and billing** — add the separate business and payment workflow.
23. **Phase 23: Offline and synchronization** — safely distinguish local, queued, synchronized, failed, and conflicting work.
24. **Phase 24: FHIR interoperability mapping layer** — support validated, consented, audited FHIR exchange.
25. **Phase 25: Security and compliance hardening** — close security findings and make the owner-signed production-data decision.
26. **Phase 26: Cross-product QA, accessibility, performance, final visual QA** — verify release readiness across all screens and supported contexts.

## Phase Details

### Phase 1: Foundation, app shell, design-system infrastructure, i18n/RTL base, visual-regression harness
**Goal:** Establish the shared app shell, token-backed visual primitives, Arabic/English RTL foundation, client wiring, and visual-regression/CI baseline.
**Depends on:** Nothing (first phase).
**Requirements:** FND-01, FND-02, FND-03, FND-04, FND-05, FND-06, FND-07, FND-08, FND-09, FND-10.
**Success Criteria** (what must be TRUE):
1. App shell and design-gallery primitives render with LTR/RTL and desktop/mobile states, and tokens are available to Tailwind and CSS.
2. Arabic/English, logical-property RTL, reduced-motion primitives, Supabase client wiring, and lint/type-check/test/CI checks are operational.
3. The Playwright visual-regression harness captures the gallery; owner visual comparison is approved only after ref-A and all other required reference assets are present.
4. Every token is traceable to ref-A or explicitly marked as an owner decision; no image-derived measurements are invented while images are absent.
**Non-goals:** Authentication, clinical data, patient screens, charts, timeline.
**Prerequisite / blocker:** Add `ref-A-theme.png`, `ref-B1-provider-home.jpg`, `ref-B2-patient-overview.jpg`, `ref-B3-patient-home.jpg`, and `ref-B4-folder-style.png` to `docs/design/`. Reference-UI extraction and Phase 1 visual approval remain blocked until then.
**Plans:** TBD.

### Phase 2: Identity, organizations, roles, RBAC, RLS, audit foundation
**Goal:** Establish secure multi-tenant identity and role/resource authorization for the clinical platform.
**Depends on:** Phase 1.
**Requirements:** IDN-01, IDN-02, IDN-03, IDN-04, IDN-05, IDN-06, IDN-07, IDN-08, IDN-09, IDN-10, IDN-11, IDN-12.
**Success Criteria** (what must be TRUE):
1. Users authenticate, sessions are protected, and clinical roles have an MFA-ready path.
2. Organizations, memberships, care relationships, five roles, and an owner-approved permission matrix enforce authorized actions.
3. RLS provides organization isolation on every table, and audit events cover writes and sensitive reads.
4. Positive and negative automated RLS tests pass, including private-note, cross-patient, and cross-organization denial; service-role credentials are absent from client code.
**Non-goals:** Clinical tables; patient UI beyond sign-in and role-aware empty shell.
**Plans:** TBD.

### Phase 3: Clinical domain core: care-event model, provenance, synthetic seed data, timeline query API
**Goal:** Build the typed, auditable clinical record foundation and efficient timeline query over synthetic patient histories.
**Depends on:** Phase 2.
**Requirements:** CDM-01, CDM-02, CDM-03, CDM-04, CDM-05, CDM-06, CDM-07, CDM-08, CDM-09, CDM-10, CDM-11, CDM-12, CDM-13, CDM-14, CDM-15, CDM-16, CDM-17, CDM-18.
**Success Criteria** (what must be TRUE):
1. Typed patient, visit, medication, observation, lab, imaging, allergy, genetics, document, diagnosis, symptom, procedure, and hospitalization records are available.
2. Clinical records and care events retain provenance, verification, relationships, and soft-delete behavior; migrations, indexes, units, and data dictionary are defined.
3. Timeline query returns patient/window events with filters and clustering hints within its plan-defined latency budget on large synthetic histories.
4. RLS tests cover every new clinical table, and the clinician-owner can review and approve plausible synthetic records for several patients.
**Non-goals:** UI, OCR, AI; real patient data.
**Plans:** TBD.

### Phase 4: Patient Workspace shell + Overview
**Goal:** Deliver the ref-A workspace frame with ref-B2 Overview layout and stable data-backed identity/vital structure.
**Depends on:** Phase 3.
**Requirements:** PWS-01, PWS-02, PWS-03, PWS-04, PWS-05, PWS-06, PWS-07, PWS-08, PWS-09, PWS-10.
**Success Criteria** (what must be TRUE):
1. Workspace context, folder-to-workspace entry, identity card, vital cards, event filter row, and Overview module structure are present.
2. The eight primary tabs appear in the exact locked order; unbuilt tabs remain visible with designed empty states.
3. Communication is reachable from the doctor profile dropdown, and loading/empty/error states are designed.
4. Desktop layout follows the approved references; mobile touch behavior and RTL work; owner approves screenshots once assets are available.
**Non-goals:** Timeline rendering, other tabs' content, AI.
**Plans:** TBD.

### Phase 5: D3 Clinical Timeline
**Goal:** Deliver the signature longitudinal clinical navigation interaction with D3-owned geometry and React-owned rendering.
**Depends on:** Phase 4.
**Requirements:** TLN-01, TLN-02, TLN-03, TLN-04, TLN-05, TLN-06, TLN-07, TLN-08, TLN-09, TLN-10, TLN-11, TLN-12, TLN-13.
**Success Criteria** (what must be TRUE):
1. Timeline renders the chronological axis, event nodes, branches, event modules, imaging thumbnail, and quick-add node.
2. Drag/touch/trackpad pan, plus/minus zoom, semantic zoom, clustering, synchronized scrubber, lane paging, intervals, and event filters work together.
3. Event details are available by hover, focus, and touch without layout jumps; keyboard users can open every event and screen readers receive semantics.
4. “Change since” is association-only; reduced motion, RTL, mobile, and 5,000+ event performance requirements pass.
5. Owner approves visual behavior; D3 does not mutate React-owned DOM.
**Non-goals:** Editing events and AI summaries.
**Plans:** TBD.

### Phase 6: Provider Home + Patient Folders + manual new patient
**Goal:** Deliver the provider landing screen where searchable patient folders are the primary collection interface.
**Depends on:** Phase 5.
**Requirements:** PROV-01, PROV-02, PROV-03, PROV-04, PROV-05, PROV-06, PROV-07, PROV-08, PROV-09, PROV-10, PROV-11, PROV-12, PROV-13, PROV-14.
**Success Criteria** (what must be TRUE):
1. Header search, manual Add Patient, notifications, doctor menu, schedule, subordinate alerts/stats, and exact-semantics filters work without overlap.
2. Folder grid exposes required patient metadata/actions, B4 folder form restyled with ref-A geometry, record-type/date-only peeking cards, D11 colors, and compact list fallback.
3. Folder-to-workspace navigation, sort, empty/loading/error, RTL/mobile behavior, and search/pagination or virtualization for 1,000+ patients work.
4. Owner approves proposed layout and token-built screenshot before remaining screen implementation; final folder colors are approved and folders contain no clinical imagery.
**Non-goals:** Telehealth queue, earnings, AI risk cards, payments; scan is a Phase 014 link only.
**Plans:** TBD.

### Phase 7: Medications
**Goal:** Enable safe, context-preserving medication review and entry.
**Depends on:** Phase 6.
**Requirements:** MED-01, MED-02, MED-03, MED-04, MED-05, MED-06, MED-07, MED-08.
**Success Criteria** (what must be TRUE):
1. Providers can distinguish current/historical medications and authorized prescribers can start, change, pause, stop, or renew records with required dosing fields and clinical links.
2. Timeline chips show the multiplier and quick-add preserves context with contextual prefill.
3. Each save creates provenance/audit history and appears immediately in the correct timeline position.
4. Nurse prescribing is denied by authorization tests and the interaction-check interface hook is present.
**Non-goals:** OCR, drug-interaction knowledge base, billing.
**Plans:** TBD.

### Phase 8: Visits
**Goal:** Support encounter workflow from pre-visit review through post-visit follow-up.
**Depends on:** Phase 7.
**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06, VIS-07.
**Success Criteria** (what must be TRUE):
1. Pre-visit review exposes last visit, new results, and outstanding actions; during-visit supports notes, vitals, and orders.
2. Post-visit supports plan, follow-up, and instructions; follow-up states move planned → due → completed → overdue.
3. Visits created from any entry point appear on timeline and Recent Records with provenance and audit.
4. Doctor-private notes remain inaccessible to patients under tested authorization rules.
**Non-goals:** Telehealth video, billing.
**Plans:** TBD.

### Phase 9: Vitals and Vital Signs history
**Goal:** Surface sourced, timestamped observations and clinically meaningful Vital Signs history in Overview.
**Depends on:** Phase 8.
**Requirements:** VIT-01, VIT-02, VIT-03, VIT-04, VIT-05, VIT-06, VIT-07, VIT-08.
**Success Criteria** (what must be TRUE):
1. Doctors and nurses can enter observations; Overview cards use persisted values and patient entry remains a supported later source.
2. History supports week/month/multi-month ranges, shows trends only when useful, and flags configured abnormal ranges with units.
3. Every value shows source, time, and entering person; patient-entered values are clearly marked.
4. ECG waveform appears only when real waveform data exists; no chart is decorative.
**Non-goals:** Device integrations, AI interpretation.
**Plans:** TBD.

### Phase 10: Labs
**Goal:** Deliver lab result entry, review, comparison, and follow-up workflows.
**Depends on:** Phase 9.
**Requirements:** LAB-01, LAB-02, LAB-03, LAB-04, LAB-05, LAB-06, LAB-07.
**Success Criteria** (what must be TRUE):
1. Lab records move ordered → pending → resulted → reviewed and show source/review state.
2. Results show units/reference ranges, support abnormal flags and date comparisons, and can be uploaded/attached to the correct event.
3. Overview lab module and timeline projections link to the same records.
4. Unreviewed or critical results surface Needs Attention items.
**Non-goals:** External lab integrations, AI interpretation.
**Plans:** TBD.

### Phase 11: Imaging
**Goal:** Support secure imaging study review in its clinical context.
**Depends on:** Phase 10.
**Requirements:** IMG-01, IMG-02, IMG-03, IMG-04, IMG-05, IMG-06.
**Success Criteria** (what must be TRUE):
1. Imaging progresses through ordered → performed → report → media → review.
2. Authorized users can view thumbnails and standard images/PDF reports in a study viewer.
3. Timeline thumbnail opens the correct study in context and preserves patient/study association.
4. Media is protected by signed access and has no public URL.
**Non-goals:** DICOM/PACS, AI image reading.
**Plans:** TBD.

### Phase 12: Allergies
**Goal:** Make allergy status review safe, with critical allergy information persistently visible.
**Depends on:** Phase 11.
**Requirements:** ALG-01, ALG-02, ALG-03, ALG-04, ALG-05.
**Success Criteria** (what must be TRUE):
1. Allergy entries capture substance, reaction, severity, status, and verification.
2. Allergy changes retain provenance and audit history.
3. Critical allergy remains visible in patient identity area across tabs and filters; verification confirms it cannot be hidden.
4. Allergies are available in the Allergies tab.
**Non-goals:** Drug-allergy rules engine.
**Plans:** TBD.

### Phase 13: Genetics
**Goal:** Present structured genetic findings and their source documents in a restrained module.
**Depends on:** Phase 12.
**Requirements:** GEN-01, GEN-02, GEN-03, GEN-04.
**Success Criteria** (what must be TRUE):
1. Genetics tab presents structured findings and links each to its source document.
2. Records retain provenance/audit and show an honest empty state when none exist.
3. Genetics presentation uses no emphasis beyond the theme's secondary modules.
**Non-goals:** Genetic analysis, risk scoring, pharmacogenomic engines.
**Plans:** TBD.

### Phase 14: Prescription Intelligence
**Goal:** Convert prescription images into editable, source-linked data that becomes authoritative only after clinician confirmation.
**Depends on:** Phase 13.
**Requirements:** RXI-01, RXI-02, RXI-03, RXI-04, RXI-05, RXI-06, RXI-07, RXI-08, RXI-09, RXI-10, RXI-11, RXI-12, RXI-13.
**Success Criteria** (what must be TRUE):
1. Camera/upload entry works from Add Patient and a patient workspace; images are preprocessed and extracted through a provider abstraction.
2. Extraction captures structured patient/diagnosis/medication/dose/frequency/duration fields, confidence, ambiguity, and ranked candidates; uncertain drug names are always flagged.
3. Verification presents original image beside editable fields and prevents authoritative writes until clinician confirmation.
4. Confirmed data appears as linked medications/visits/diagnoses on timeline; stored artifacts support reconstruction of original → extracted → corrected → verified.
5. Owner-approved consent and PHI minimization govern provider use; failures recover visibly and measured accuracy report exists before convergence.
**Non-goals:** Generalized document intelligence (P3).
**Plans:** TBD.

### Phase 15: Needs Attention, Command Palette, global search
**Goal:** Make actionable clinical attention, common commands, and global record search immediately available.
**Depends on:** Phase 14.
**Requirements:** ATT-01, ATT-02, ATT-03, ATT-04, ATT-05, ATT-06, ATT-07, ATT-08.
**Success Criteria** (what must be TRUE):
1. Required attention sources appear with three explainable severities on Provider Home and patient workspaces without flooding the UI with red.
2. Selecting an attention item opens the exact action location.
3. Ctrl/Cmd+K commands find patient, add patient, start visit, add medication/vital, and open timeline.
4. Global search finds patients, conditions, medications, and events under appropriate access controls.
**Non-goals:** AI-generated attention items, push notifications.
**Plans:** TBD.

### Phase 16: Patient Intelligence (AI Analytics tab)
**Goal:** Provide source-grounded AI summaries that save reading time without making clinical decisions.
**Depends on:** Phase 15.
**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09.
**Success Criteria** (what must be TRUE):
1. AI Analytics answers the specified change/importance/new-since-last-visit/six-month-summary questions and covers medication changes, abnormal trends, missing follow-up, and documentation inconsistencies.
2. Every output statement links to source events and is labeled AI-generated, timestamped, and regenerable.
3. AI output never writes to the record automatically; saving to a note requires explicit clinician confirmation.
4. Provider abstraction, PHI minimization, inspectable sent-data summary, and recoverable failure states are available.
5. No diagnosis, treatment recommendation, predictive disease probability, or autonomous alert is generated.
**Non-goals:** Predictive disease probabilities, diagnosis, treatment recommendations, autonomous alerts.
**Plans:** TBD.

### Phase 17: Patient Home
**Goal:** Deliver a calm, responsive patient experience for next actions, health context, and quick logging.
**Depends on:** Phase 16.
**Requirements:** PAT-01, PAT-02, PAT-03, PAT-04, PAT-05, PAT-06, PAT-07, PAT-08, PAT-09, PAT-10.
**Success Criteria** (what must be TRUE):
1. Next-action card offers “Log taken”; health snapshot uses plain-language target ranges and Egypt units.
2. Patient can quick-log symptoms, vitals, and optional mood; care plan shows daily checklist, next appointment, and goal.
3. Doctor-private notes remain hidden; patient-entered values appear on provider timeline marked patient-reported.
4. Arabic/English, RTL, touch-first mobile web, and ref-B3 layout with ref-A styling work.
5. Owner approves screenshots; no gamified or 3D elements are present.
**Non-goals:** Points, levels, badges, streaks, payments, telehealth.
**Plans:** TBD.

### Phase 18: Care Tasks and adherence
**Goal:** Turn care plans into daily tasks and make adherence visible as a neutral, sourced observation.
**Depends on:** Phase 17.
**Requirements:** CARE-01, CARE-02, CARE-03, CARE-04, CARE-05, CARE-06.
**Success Criteria** (what must be TRUE):
1. Care plans generate medication, measurement, and activity tasks; patients can record completion and see a subtle count.
2. Providers see an Overview adherence summary phrased as an observation with patient-reported source.
3. Reminders use messaging only when Phase 019/020 channels are available and consented.
4. No punitive score, rewards, points, levels, or streaks appear.
**Non-goals:** Rewards, points, levels, streaks.
**Plans:** TBD.

### Phase 19: Communication core
**Goal:** Establish the internal communication model, consent controls, and delivery-state behavior.
**Depends on:** Phase 18.
**Requirements:** COM-01, COM-02, COM-03, COM-04, COM-05, COM-06, COM-07, COM-08.
**Success Criteria** (what must be TRUE):
1. Communication model supports conversations, participants, messages, channels, delivery/read status, attachments, and consent.
2. In-app communication and profile-dropdown entry support templated reminders and confirmations.
3. Channel opt-in/opt-out is recorded; messages cannot send without channel consent.
4. Delivery failures are visible, and the clinical record remains the source of truth.
**Non-goals:** External channels, video.
**Plans:** TBD.

### Phase 20: WhatsApp and Telegram adapters
**Goal:** Connect WhatsApp then Telegram through the internal messaging abstraction with consent and server-side credentials.
**Depends on:** Phase 19.
**Requirements:** MSG-01, MSG-02, MSG-03, MSG-04, MSG-05, MSG-06, MSG-07, MSG-08.
**Success Criteria** (what must be TRUE):
1. WhatsApp and then Telegram adapters map provider delivery states to internal delivery status.
2. Required approved templates follow verified D10 rules.
3. Prescription PDFs are sent only after clinician confirmation; provider credentials remain server-side.
4. Nonconsented messages are blocked and logged; failures and retries are handled visibly.
**Non-goals:** Marketing broadcasts, clinical decisions through chat.
**Plans:** TBD.

### Phase 21: Telehealth
**Goal:** Combine a purchased video consultation with the patient workspace and visit documentation.
**Depends on:** Phase 20.
**Requirements:** TELE-01, TELE-02, TELE-03, TELE-04, TELE-05, TELE-06, TELE-07.
**Success Criteria** (what must be TRUE):
1. Appointment workflow supports start, consultation, documentation, and visit completion.
2. Video is shown beside the workspace/timeline; doctor can read timeline and write visit note during the call.
3. Purchased provider, connection-quality states, failure/recovery states, and telehealth queue are supported.
4. Session consent is captured and recording remains off unless separately approved.
**Non-goals:** Building a video stack, group calls.
**Plans:** TBD.

### Phase 22: Payments and billing
**Goal:** Add a payment/business layer isolated from clinical workflows.
**Depends on:** Phase 21.
**Requirements:** PAY-01, PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08.
**Success Criteria** (what must be TRUE):
1. Fees, invoices, receipts, payment status, doctor earnings, and patient payment flow are supported through D9-confirmed provider abstractions.
2. Reconciliation states are explainable and refunds follow an explicit workflow.
3. Financial data remains out of clinical screens/timeline except an encounter link.
4. The app stores no card data and every payment state is understandable.
**Non-goals:** Accounting, insurance claims.
**Plans:** TBD.

### Phase 23: Offline and synchronization
**Goal:** Support a safe, explicitly bounded offline workflow with truthful sync states and conflict handling.
**Depends on:** Phase 22.
**Requirements:** SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, SYNC-06, SYNC-07, SYNC-08.
**Success Criteria** (what must be TRUE):
1. Supported drafts/entry move through local draft, outbox, syncing, server acknowledgment, and confirmed states.
2. UI distinguishes local draft, queued, syncing, synced, failed, and conflict and never claims local-only data is saved.
3. Conflicts can be resolved and are never overwritten silently.
4. Local data is encrypted and cleared at sign-out; stale-risk actions such as prescribing are blocked offline.
**Non-goals:** Full offline-first operation for every feature.
**Plans:** TBD.

### Phase 24: FHIR interoperability mapping layer
**Goal:** Exchange validated clinical data through a documented FHIR mapping layer without exposing FHIR as the product UX.
**Depends on:** Phase 23.
**Requirements:** FHIR-01, FHIR-02, FHIR-03, FHIR-04, FHIR-05, FHIR-06, FHIR-07.
**Success Criteria** (what must be TRUE):
1. Required internal records map to listed FHIR resources for import and export, with documented validated mappings.
2. Authorized users can export valid bundles and import supported resources.
3. Every exchange requires consent and produces audit events.
4. Imported data remains unverified until reviewed and cannot write unverified values into authoritative records.
**Non-goals:** Live external-system integrations beyond FHIR mapping (P3).
**Plans:** TBD.

### Phase 25: Security and compliance hardening
**Goal:** Close blocking safety/security findings and establish the owner decision for real-data readiness.
**Depends on:** Phase 24.
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09, SEC-10.
**Success Criteria** (what must be TRUE):
1. Adversarial RLS/RBAC/tenant-isolation and storage/signed-URL reviews close all blocking findings.
2. Session/sensitive-action protections, clinical-role MFA, PHI log scan, and dependency audit are complete.
3. Backup/recovery, data export/deletion, and consent controls are reviewed and verified.
4. Hosting/legal review, provider DPAs, and breach-response plan satisfy the documented gate conditions.
5. Real patient data remains blocked unless the owner signs the compliance gate; otherwise synthetic-only mode continues.
**Non-goals:** New features.
**Plans:** TBD.

### Phase 26: Cross-product QA, accessibility, performance, final visual QA
**Goal:** Verify release readiness across product behavior, accessibility, performance, visual fidelity, and clinician usability.
**Depends on:** Phase 25.
**Requirements:** QA-01, QA-02, QA-03, QA-04, QA-05, QA-06, QA-07, QA-08.
**Success Criteria** (what must be TRUE):
1. Every screen receives final visual QA against ref-A/ref-B in LTR and RTL with owner approval.
2. WCAG 2.2 AA-targeted keyboard/screen-reader accessibility, large-synthetic-data performance, cross-browser/mobile behavior, and error/empty-state recovery are verified.
3. Regression suite passes, production build succeeds, and clinician usability test covers all three specified questions.
4. Final convergence passes with all blocking findings closed.
**Non-goals:** New features.
**Plans:** TBD.

## Progress

**Execution Order:**
Phases execute in the fixed owner-approved sequence: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25 → 26.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, app shell, design-system infrastructure, i18n/RTL base, visual-regression harness | 0/TBD | Not started | - |
| 2. Identity, organizations, roles, RBAC, RLS, audit foundation | 0/TBD | Not started | - |
| 3. Clinical domain core: care-event model, provenance, synthetic seed data, timeline query API | 0/TBD | Not started | - |
| 4. Patient Workspace shell + Overview | 0/TBD | Not started | - |
| 5. D3 Clinical Timeline | 0/TBD | Not started | - |
| 6. Provider Home + Patient Folders + manual new patient | 0/TBD | Not started | - |
| 7. Medications | 0/TBD | Not started | - |
| 8. Visits | 0/TBD | Not started | - |
| 9. Vitals and Vital Signs history | 0/TBD | Not started | - |
| 10. Labs | 0/TBD | Not started | - |
| 11. Imaging | 0/TBD | Not started | - |
| 12. Allergies | 0/TBD | Not started | - |
| 13. Genetics | 0/TBD | Not started | - |
| 14. Prescription Intelligence | 0/TBD | Not started | - |
| 15. Needs Attention, Command Palette, global search | 0/TBD | Not started | - |
| 16. Patient Intelligence (AI Analytics tab) | 0/TBD | Not started | - |
| 17. Patient Home | 0/TBD | Not started | - |
| 18. Care Tasks and adherence | 0/TBD | Not started | - |
| 19. Communication core | 0/TBD | Not started | - |
| 20. WhatsApp and Telegram adapters | 0/TBD | Not started | - |
| 21. Telehealth | 0/TBD | Not started | - |
| 22. Payments and billing | 0/TBD | Not started | - |
| 23. Offline and synchronization | 0/TBD | Not started | - |
| 24. FHIR interoperability mapping layer | 0/TBD | Not started | - |
| 25. Security and compliance hardening | 0/TBD | Not started | - |
| 26. Cross-product QA, accessibility, performance, final visual QA | 0/TBD | Not started | - |
