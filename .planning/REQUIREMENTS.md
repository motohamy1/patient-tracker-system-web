# Requirements: Clinical Patient Workspace

**Defined:** 2026-10-04  
**Core Value:** Understand the patient → act on what matters → track what happens next.

## v1 Requirements

Requirements for the initial release. Each maps to exactly one of roadmap Phases 1–26.

### FND — Foundation (Phase 001)

- [ ] **FND-01**: The application runs as a Next.js App Router project using TypeScript and exposes lint, type-check, test, and CI checks.
- [ ] **FND-02**: Design tokens are available to Tailwind and as CSS custom properties.
- [ ] **FND-03**: The shared layout renders the olive frame and a reusable notch-tab header with close control and title tab.
- [ ] **FND-04**: The design gallery renders the pill tab group, secondary pill row with filter toggle, circular icon button, chip, module surface, status label, dark scrubber, and accent node primitives.
- [ ] **FND-05**: The shared icon set uses theme-matched line icons, and motion primitives use Framer Motion with reduced-motion behavior.
- [ ] **FND-06**: Arabic and English are available from the foundation, with RTL implemented using logical CSS properties; the Arabic companion typeface is recorded as an owner decision.
- [ ] **FND-07**: `/design-gallery` shows every primitive in every state for desktop/mobile and LTR/RTL.
- [ ] **FND-08**: A Playwright visual-regression harness captures the design gallery.
- [ ] **FND-09**: The Supabase client is wired without exposing privileged service credentials to browser code.
- [ ] **FND-10**: Every approved foundation token is traceable to ref-A or explicitly marked for an owner decision, and the gallery receives owner visual approval against ref-A.

**Boundary:** No authentication, clinical data, patient screens, charts, or timeline in this phase. Reference-derived tokens and visual approval are blocked until the five source images are supplied.

### IDN — Identity, organizations, roles, RBAC, RLS, audit (Phase 002)

- [ ] **IDN-01**: A user can authenticate through Supabase Auth and access only a protected, authenticated application route.
- [ ] **IDN-02**: An organization can have memberships linking users to that organization.
- [ ] **IDN-03**: Memberships support Doctor, Nurse, Receptionist, Patient, and Org Admin roles.
- [ ] **IDN-04**: An owner-approved permission matrix defines view, create, edit, delete, and export permissions by role and resource.
- [ ] **IDN-05**: Patient-to-doctor care relationships are represented and enforceable by authorization rules.
- [ ] **IDN-06**: Sessions are maintained and protected routes reject unauthenticated access.
- [ ] **IDN-07**: Clinical roles can use an MFA-ready authentication path.
- [ ] **IDN-08**: Every table is protected by RLS with organization isolation; cross-organization reads and writes are denied.
- [ ] **IDN-09**: Writes and sensitive reads produce auditable events.
- [ ] **IDN-10**: Synthetic test users exist for every supported role.
- [ ] **IDN-11**: Automated negative authorization tests deny a Nurse access to doctor-private notes, a Patient access to another patient, and any user access across organizations; positive cases verify permitted access.
- [ ] **IDN-12**: No service-role key is reachable from client code, and the role permission matrix is approved by the owner.

**Boundary:** No clinical tables and no patient UI beyond sign-in and a role-aware empty shell.

### CDM — Clinical domain core (Phase 003)

- [ ] **CDM-01**: Patient demographics are stored as typed clinical-domain records.
- [ ] **CDM-02**: Visits are stored as typed records.
- [ ] **CDM-03**: Medication records support start, change, pause, and stop events with dose, frequency, route, and duration.
- [ ] **CDM-04**: Vitals and observations are stored as typed records.
- [ ] **CDM-05**: Lab orders and lab results are stored as typed records.
- [ ] **CDM-06**: Imaging studies are stored as typed records.
- [ ] **CDM-07**: Allergies and genetic findings are stored as typed records.
- [ ] **CDM-08**: Documents, diagnoses, symptoms, procedures, and hospitalizations are stored as typed records.
- [ ] **CDM-09**: A unified `care_events` index identifies event type, occurrence time, patient, and source record.
- [ ] **CDM-10**: Care events retain grouping and relationship fields, provenance, and verification state.
- [ ] **CDM-11**: Every clinically relevant record retains creator, creation time, source, AI-generated status, verifier, verification time, and original-source reference.
- [ ] **CDM-12**: Clinical records can be soft-deleted without erasing their audit/provenance history.
- [ ] **CDM-13**: A timeline query returns a patient's events for a requested time window with event filters and clustering hints.
- [ ] **CDM-14**: Database migrations and indexes support the clinical records and timeline query.
- [ ] **CDM-15**: The timeline query meets a latency budget defined in its phase plan against a large synthetic history.
- [ ] **CDM-16**: Clinically coherent synthetic records cover several patients and can be reviewed and approved by the clinician-owner.
- [ ] **CDM-17**: Clinical unit-conversion rules and a data dictionary are documented.
- [ ] **CDM-18**: Phase 002 RLS tests cover every new clinical table, including positive and negative cases.

**Boundary:** No UI, OCR, or AI in this phase; all seed data is synthetic.

### PWS — Patient Workspace shell + Overview (Phase 004)

- [ ] **PWS-01**: The Patient Workspace header identifies the current workspace context and supports folder-to-workspace navigation.
- [ ] **PWS-02**: The primary tabs render in this exact order: Overview, AI Analytics, Visits, Medications, Labs, Imaging, Allergies, Genetics.
- [ ] **PWS-03**: Unbuilt tabs remain visible and show designed, honest empty states.
- [ ] **PWS-04**: The identity card shows expandable patient-information rows, including social history and conditions when available.
- [ ] **PWS-05**: Vital cards show heart rate, blood pressure, oxygen saturation, and temperature with units and last-measured time.
- [ ] **PWS-06**: The event-type filter row is wired to the timeline container, using its real geometry and a restrained placeholder until Phase 005.
- [ ] **PWS-07**: Bottom modules provide the structure for vital-history range controls, recent records, and lab reference-range bars without duplicating later-phase content.
- [ ] **PWS-08**: The doctor profile dropdown contains a Communication entry.
- [ ] **PWS-09**: Workspace loading, empty, and error states are visible and understandable.
- [ ] **PWS-10**: The Overview supports RTL and a touch-designed mobile layout and receives owner screenshot approval against ref-A/ref-B2.

**Boundary:** No timeline rendering, other tab content, or AI.

### TLN — D3 Clinical Timeline (Phase 005)

- [ ] **TLN-01**: The timeline lays out a chronological horizontal axis with month columns, accent event nodes, and a dark “+” node used only for quick-add entry.
- [ ] **TLN-02**: Timeline event branches use orthogonal paths with rounded elbows and can show medication chips, lab and metric modules, and an inline imaging thumbnail.
- [ ] **TLN-03**: D3 computes scales, zoom/pan, paths, and layout geometry while React renders and exclusively owns the DOM.
- [ ] **TLN-04**: Users can pan by drag, touch, and trackpad and can zoom with plus/minus controls.
- [ ] **TLN-05**: Semantic zoom transitions among years, months, weeks, and days while clustering dense periods.
- [ ] **TLN-06**: The bottom scrubber stays synchronized with the viewport and shows year/month ticks, event-type icons with counts, and the visible time window.
- [ ] **TLN-07**: Users can page timeline lanes, read interval labels, and filter by event type.
- [ ] **TLN-08**: Hover, keyboard focus, and touch expose event details without causing layout jumps.
- [ ] **TLN-09**: “Change since” shows average and delta versus the prior period as association, never as causation.
- [ ] **TLN-10**: Keyboard-only users can reach and open every event, and timeline elements expose screen-reader semantics.
- [ ] **TLN-11**: Timeline interaction respects reduced-motion preferences and adapts to RTL and mobile layouts.
- [ ] **TLN-12**: Pan/zoom and rendering meet the plan-defined performance budget on large synthetic histories, including 5,000+ events.
- [ ] **TLN-13**: Visual behavior receives owner approval, and D3 does not mutate React-owned DOM.

**Boundary:** No event editing and no AI summaries.

### PROV — Provider Home + Patient Folders (Phase 006)

- [ ] **PROV-01**: Provider Home renders inside the olive frame with a header containing global patient search, one primary Add Patient control, notifications, and doctor menu with Communication entry.
- [ ] **PROV-02**: Add Patient provides manual entry; its scan path links to Phase 014 rather than implementing OCR early.
- [ ] **PROV-03**: Recent, Today, Needs Attention, and Critical filters appear above the folder grid, do not overlap it, and implement their approved semantics.
- [ ] **PROV-04**: Providers can sort the patient collection.
- [ ] **PROV-05**: Each folder shows patient name, ID, status, last visit, short concern, and overflow actions.
- [ ] **PROV-06**: A folder uses a back panel and tab, front pocket, record-type cards peeking above, patient name and record count at bottom-left, and avatar badge at bottom-right.
- [ ] **PROV-07**: Folder peeking cards show only record types and dates, never clinical images or results.
- [ ] **PROV-08**: Folder colors follow owner decision D11, and folder geometry follows ref-A tokens rather than B4 measurements.
- [ ] **PROV-09**: Providers can switch to a compact list view and open a patient's workspace from the folder.
- [ ] **PROV-10**: Folder hover and focus motion is subtle and respects the product motion language.
- [ ] **PROV-11**: A schedule column, restrained alerts panel, and stats tiles follow the resolved D6/D7 decisions without introducing an unlabeled icon rail or unsupported metrics.
- [ ] **PROV-12**: Provider Home handles empty, loading, and error states and supports RTL and mobile layouts.
- [ ] **PROV-13**: Search and patient-list navigation remain usable for 1,000+ patients through suitable pagination or virtualization.
- [ ] **PROV-14**: The owner approves a text layout proposal and token-built screenshot before the remaining screen is built; final folder colors are approved and there are no overlapping elements or folder clinical images.

**Boundary:** No telehealth queue, earnings, AI risk cards, or payments.

### MED — Medications (Phase 007)

- [ ] **MED-01**: The Medications tab distinguishes current from historical medications.
- [ ] **MED-02**: An authorized prescriber can start, change, pause, stop, or renew a medication and record dose, frequency, route, and duration.
- [ ] **MED-03**: A medication can link to the visit and diagnosis that justify it.
- [ ] **MED-04**: Medication timeline chips display the specified “x” multiplier.
- [ ] **MED-05**: A provider can quick-add from the timeline “+” without leaving context and receives contextual prefill.
- [ ] **MED-06**: Each medication save records provenance and an audit event and appears immediately in the correct timeline position.
- [ ] **MED-07**: Nurses cannot prescribe, enforced and covered by an authorization test.
- [ ] **MED-08**: The medication-entry flow follows the shortest path approved in the phase specification and exposes an interaction-check interface hook.

**Boundary:** No OCR, drug-interaction knowledge base, or billing.

### VIS — Visits (Phase 008)

- [ ] **VIS-01**: The Visits tab supports pre-visit review of the last visit, new results, and outstanding actions.
- [ ] **VIS-02**: During a visit, an authorized provider can record notes, vitals, and orders.
- [ ] **VIS-03**: After a visit, a provider can record a plan, follow-up, and instructions.
- [ ] **VIS-04**: Visit events appear on the clinical timeline regardless of their creation entry point and in Recent Records.
- [ ] **VIS-05**: Follow-ups transition through planned, due, completed, and overdue states.
- [ ] **VIS-06**: Visit records preserve provenance and audit events.
- [ ] **VIS-07**: Doctor-private notes are not visible to patients, verified by an access-control test.

**Boundary:** No telehealth video or billing.

### VIT — Vitals and Vital Signs history (Phase 009)

- [ ] **VIT-01**: Doctors and nurses can record vital observations; the model supports later patient entry without claiming a device integration.
- [ ] **VIT-02**: Overview vital cards display persisted observation values.
- [ ] **VIT-03**: The Vital Signs History module supports week, month, and multi-month ranges.
- [ ] **VIT-04**: A trend is shown only when it communicates more than the underlying number.
- [ ] **VIT-05**: Configurable ranges flag abnormal values with the applicable units.
- [ ] **VIT-06**: Patient-entered values are clearly identified as patient-entered.
- [ ] **VIT-07**: Every value shows its source, recorded time, and the person who entered it.
- [ ] **VIT-08**: An ECG waveform is rendered only when the record contains actual waveform data; charts are not decorative.

**Boundary:** No device integrations or AI interpretation.

### LAB — Labs (Phase 010)

- [ ] **LAB-01**: The Labs tab represents each lab through ordered, pending, resulted, and reviewed states.
- [ ] **LAB-02**: Lab results show reference-range bars and units.
- [ ] **LAB-03**: Results can be flagged abnormal and compared across dates.
- [ ] **LAB-04**: A provider can upload a lab document and attach it to the correct event.
- [ ] **LAB-05**: The Overview Labs module shows lab content and links to the corresponding records.
- [ ] **LAB-06**: Lab orders and results appear as projections on the patient timeline.
- [ ] **LAB-07**: Unreviewed and critical results create Needs Attention items; each result shows source and review state.

**Boundary:** No external lab integrations or AI interpretation.

### IMG — Imaging (Phase 011)

- [ ] **IMG-01**: Imaging studies progress through ordered, performed, report, media, and review states.
- [ ] **IMG-02**: A provider can view thumbnails and open standard images and PDF reports in a study viewer.
- [ ] **IMG-03**: An imaging thumbnail can open its study in context from the timeline.
- [ ] **IMG-04**: Imaging media is stored securely and accessed only through signed access; no medical media is reachable by a public URL.
- [ ] **IMG-05**: Imaging review state is visible to authorized users.
- [ ] **IMG-06**: Opening a thumbnail preserves the association with the correct imaging study and patient context.

**Boundary:** No DICOM/PACS integration or AI image reading.

### ALG — Allergies (Phase 012)

- [ ] **ALG-01**: An allergy record stores substance, reaction, severity, status, and verification state.
- [ ] **ALG-02**: Allergies appear in the Allergies tab.
- [ ] **ALG-03**: A critical allergy remains visible in the patient identity area regardless of selected tab or active filter.
- [ ] **ALG-04**: Allergy changes retain provenance and audit events.
- [ ] **ALG-05**: A verification scenario confirms a critical allergy cannot be hidden by navigation or filtering.

**Boundary:** No drug-allergy rules engine.

### GEN — Genetics (Phase 013)

- [ ] **GEN-01**: The Genetics tab presents structured genetic-finding entries.
- [ ] **GEN-02**: Genetic findings can link to their source documents.
- [ ] **GEN-03**: Genetic records preserve provenance and audit history and show an honest empty state when no findings exist.
- [ ] **GEN-04**: Genetic information receives no visual emphasis beyond the theme's secondary modules.

**Boundary:** No genetic analysis, risk scoring, or pharmacogenomic engine.

### RXI — Prescription Intelligence (Phase 014)

- [ ] **RXI-01**: A prescription image can enter from Add Patient or from a patient workspace through camera capture or upload.
- [ ] **RXI-02**: Prescription images are preprocessed before provider-based vision/OCR extraction.
- [ ] **RXI-03**: Extraction returns patient information, diagnoses, medications, doses, frequency, and duration as structured fields.
- [ ] **RXI-04**: Extracted medications are normalized against an owner-approved, licensed drug catalog.
- [ ] **RXI-05**: Each extracted field has a confidence value and ambiguity detection.
- [ ] **RXI-06**: Uncertain fields, including uncertain drug names, are visibly flagged and offer ranked candidates rather than an unmarked guess.
- [ ] **RXI-07**: The verification screen displays the original image beside editable extracted fields and flags low-confidence fields.
- [ ] **RXI-08**: No extraction is written to the authoritative record until a clinician explicitly confirms it.
- [ ] **RXI-09**: The system retains the original image, raw extraction, corrected values, verifier, and verification time.
- [ ] **RXI-10**: Confirmed prescription data creates linked medication, visit, or diagnosis records on the timeline.
- [ ] **RXI-11**: External processing follows PHI-minimization and owner-approved consent requirements and exposes provider choice through an abstraction.
- [ ] **RXI-12**: Provider failures have visible recovery paths, and an accuracy report exists before convergence.
- [ ] **RXI-13**: The audit trail reconstructs original image → raw extraction → correction → clinician verification.

**Boundary:** No generalized document intelligence for lab reports or discharge summaries (P3).

### ATT — Needs Attention, Command Palette, global search (Phase 015)

- [ ] **ATT-01**: Needs Attention represents critical results, unreviewed abnormal results, overdue follow-ups, unread patient messages, medication issues, missing information, and pending confirmation.
- [ ] **ATT-02**: Attention items use three severities and explain why each severity applies without flooding the UI with red.
- [ ] **ATT-03**: Needs Attention appears on Provider Home and within the relevant patient workspace.
- [ ] **ATT-04**: Selecting an attention item opens the exact location where its action can be taken.
- [ ] **ATT-05**: Ctrl/Cmd+K opens a Command Palette.
- [ ] **ATT-06**: The Command Palette can find a patient, add a patient, start a visit, add a medication, add a vital, and open a timeline.
- [ ] **ATT-07**: Global clinical search finds patients, conditions, medications, and events.
- [ ] **ATT-08**: Attention items and search results are accessible only to appropriately authorized users and do not create AI-generated items or push notifications.

**Boundary:** No AI-generated attention items and no push notifications.

### AI — Patient Intelligence / AI Analytics (Phase 016)

- [ ] **AI-01**: The AI Analytics tab answers what changed, what matters, what is new since the last visit, and summarizes the last six months.
- [ ] **AI-02**: AI summaries can identify medication changes, abnormal trends, missing follow-up, and documentation inconsistencies as source-linked observations.
- [ ] **AI-03**: Every AI statement links to the source event or events supporting it; an unlinked claim is rejected.
- [ ] **AI-04**: Every output is labeled AI-generated, timestamped, and regenerable.
- [ ] **AI-05**: AI output is never written to the record automatically; adding it to a note requires explicit clinician confirmation.
- [ ] **AI-06**: Model access uses a provider abstraction and minimizes PHI sent to the provider.
- [ ] **AI-07**: The clinician can inspect exactly what data was sent to the model.
- [ ] **AI-08**: Provider failure and unavailable-output states are visible and recoverable.
- [ ] **AI-09**: AI remains assistive: it does not diagnose, recommend treatment, predict disease probabilities, or create autonomous alerts.

**Boundary:** No predictive disease probabilities, diagnosis, treatment recommendations, or autonomous alerts.

### PAT — Patient Home (Phase 017)

- [ ] **PAT-01**: Patient Home presents a next-action card with a flat line icon and a clear “Log taken” action.
- [ ] **PAT-02**: The health snapshot presents understandable target ranges and units (kg, mmHg, mg/dL, °C).
- [ ] **PAT-03**: Patients can quick-log symptoms and vitals and optionally mood using neutral line-icon controls; the accent is reserved for active state.
- [ ] **PAT-04**: The care-plan area shows a daily checklist, next appointment, and goal.
- [ ] **PAT-05**: Doctor-private notes are never shown to patients.
- [ ] **PAT-06**: Patient-entered observations appear on the provider timeline and are marked as patient-reported.
- [ ] **PAT-07**: Patient Home supports Arabic, English, RTL, responsive web layout, and touch interaction.
- [ ] **PAT-08**: Patient Home follows ref-B3's layout while using ref-A's visual language.
- [ ] **PAT-09**: The patient can complete the “Log taken” action without gamification or 3D imagery.
- [ ] **PAT-10**: Owner screenshot approval confirms the patient screen's visual and interaction behavior.

**Boundary:** No points, levels, badges, streaks, payments, or telehealth.

### CARE — Care Tasks and adherence (Phase 018)

- [ ] **CARE-01**: A care plan can produce daily medication, measurement, and activity tasks.
- [ ] **CARE-02**: Patients can record task completion and see a subtle completion count such as “3 of 4 done.”
- [ ] **CARE-03**: Providers can see an adherence summary in Overview.
- [ ] **CARE-04**: Adherence is worded as an observation and identifies patient-reported data source.
- [ ] **CARE-05**: Care-task reminders use the Phase 019/020 messaging layer only when that layer is available and consented.
- [ ] **CARE-06**: Completion and adherence are never presented as a punitive score or reward mechanic.

**Boundary:** No rewards, points, levels, or streaks.

### COM — Communication core (Phase 019)

- [ ] **COM-01**: The communication model represents Conversation, Participant, Message, Channel, delivery status, read status, attachments, and consent.
- [ ] **COM-02**: Users can communicate through an in-app channel.
- [ ] **COM-03**: Doctors can open communication from the profile dropdown.
- [ ] **COM-04**: The system supports templated reminders and confirmations.
- [ ] **COM-05**: Channel consent records capture opt-in and opt-out state.
- [ ] **COM-06**: The clinical record remains the source of truth rather than the message thread.
- [ ] **COM-07**: A message cannot be sent without recorded consent for that channel.
- [ ] **COM-08**: Delivery failures are visible to the sender.

**Boundary:** No external messaging channels or video in this phase.

### MSG — WhatsApp and Telegram adapters (Phase 020)

- [ ] **MSG-01**: WhatsApp is connected through the messaging abstraction.
- [ ] **MSG-02**: Telegram is connected through the messaging abstraction after the WhatsApp adapter.
- [ ] **MSG-03**: Channel-required approved templates are applied according to verified D10 rules.
- [ ] **MSG-04**: Provider delivery states map to the internal delivery-status model.
- [ ] **MSG-05**: A prescription PDF can be delivered only after clinician confirmation.
- [ ] **MSG-06**: Provider credentials remain server-side and never reach the client.
- [ ] **MSG-07**: Per-channel consent is enforced; sending without consent is blocked and logged.
- [ ] **MSG-08**: Delivery failures and retry outcomes are visible and handled.

**Boundary:** No marketing broadcasts and no clinical decisions through chat.

### TELE — Telehealth (Phase 021)

- [ ] **TELE-01**: A scheduled appointment can start a telehealth consultation and progress to a completed visit.
- [ ] **TELE-02**: The consultation presents video beside the patient workspace and timeline.
- [ ] **TELE-03**: The doctor can read the timeline and document the visit during the call.
- [ ] **TELE-04**: The chosen video provider is an acquired WebRTC service, not a custom-built video stack.
- [ ] **TELE-05**: The experience shows connection-quality states and designed failure/recovery states.
- [ ] **TELE-06**: Session consent is captured, and recording is disabled unless separately specified and approved.
- [ ] **TELE-07**: Provider Home can show a telehealth queue.

**Boundary:** No custom video stack or group calls.

### PAY — Payments and billing (Phase 022)

- [ ] **PAY-01**: The business layer records fees and invoices separately from clinical records.
- [ ] **PAY-02**: Patients can receive receipts and view payment status.
- [ ] **PAY-03**: Doctors can view earnings.
- [ ] **PAY-04**: Patients can complete payment through provider abstractions for methods confirmed in D9.
- [ ] **PAY-05**: Payment reconciliation states are visible and explainable.
- [ ] **PAY-06**: Refunds follow an explicit workflow.
- [ ] **PAY-07**: Financial data is excluded from the clinical timeline except for a link to the related encounter; it is not shown on clinical screens.
- [ ] **PAY-08**: The app does not store card data and every payment state has an understandable explanation.

**Boundary:** No accounting system or insurance claims.

### SYNC — Offline and synchronization (Phase 023)

- [ ] **SYNC-01**: Supported offline work moves through local draft, outbox, sync, server acknowledgment, and confirmed states.
- [ ] **SYNC-02**: The UI distinguishes local draft, queued, syncing, synced, failed, and conflict states.
- [ ] **SYNC-03**: Users can detect and resolve synchronization conflicts.
- [ ] **SYNC-04**: Conflicts are never overwritten silently.
- [ ] **SYNC-05**: The offline scope supports drafts and entry but blocks stale-risk actions such as prescribing against outdated data.
- [ ] **SYNC-06**: Locally stored data is encrypted.
- [ ] **SYNC-07**: Signing out clears locally stored patient data.
- [ ] **SYNC-08**: The UI never claims data is saved while it exists only locally.

**Boundary:** No full offline-first operation for every feature.

### FHIR — Interoperability mapping layer (Phase 024)

- [ ] **FHIR-01**: The mapping layer maps internal records to FHIR Patient, Practitioner, Organization, Observation, MedicationRequest/MedicationStatement, Condition, AllergyIntolerance, DocumentReference, and Encounter resources.
- [ ] **FHIR-02**: Authorized users can export mapped clinical data as FHIR bundles.
- [ ] **FHIR-03**: Authorized users can import supported FHIR resources through the mapping layer.
- [ ] **FHIR-04**: FHIR imports and exports are validated and mapping behavior is documented.
- [ ] **FHIR-05**: Every exchange requires consent and creates an audit event.
- [ ] **FHIR-06**: Imported data remains unverified until reviewed and cannot write unverified values into authoritative records.
- [ ] **FHIR-07**: Exported bundles pass the applicable validation checks.

**Boundary:** No live external-system integrations beyond the mapping layer (P3).

### SEC — Security and compliance hardening (Phase 025)

- [ ] **SEC-01**: An adversarial review tests RLS, RBAC, and organization isolation and closes blocking findings.
- [ ] **SEC-02**: Storage and signed-URL access are audited so medical media cannot be reached publicly.
- [ ] **SEC-03**: Sessions and sensitive actions receive the required protection, including MFA for clinical roles.
- [ ] **SEC-04**: A PHI-in-logs scan and dependency audit are completed and blocking findings are closed.
- [ ] **SEC-05**: Backup and recovery are verified.
- [ ] **SEC-06**: Data export and deletion workflows are available and reviewed.
- [ ] **SEC-07**: Consent handling is reviewed across product and connected providers.
- [ ] **SEC-08**: The owner reviews hosting region and applicable legal requirements, including Egypt Law No. 151 of 2020 and its regulations, with qualified legal counsel.
- [ ] **SEC-09**: Data-processing agreements are in place with every external provider, and a breach-response plan is established.
- [ ] **SEC-10**: Real patient data remains blocked until the owner signs the compliance gate; if blocking findings remain or the gate is unsigned, the product stays in synthetic-data mode.

**Boundary:** No new features; no real patient data before owner-signed gate.

### QA — Cross-product QA, accessibility, performance, final visual QA (Phase 026)

- [ ] **QA-01**: Every screen receives final visual QA against ref-A theme and ref-B layout references in LTR and RTL.
- [ ] **QA-02**: Accessibility review targets WCAG 2.2 AA and tests keyboard and screen-reader use.
- [ ] **QA-03**: Performance budgets are evaluated on large synthetic datasets.
- [ ] **QA-04**: Cross-browser and mobile behavior is verified.
- [ ] **QA-05**: Error recovery and empty states are reviewed across the product.
- [ ] **QA-06**: The regression suite passes and a production build succeeds.
- [ ] **QA-07**: Clinician usability testing establishes whether clinicians can understand a patient quickly, add information quickly, and identify what needs attention next.
- [ ] **QA-08**: Final convergence passes with all blocking findings closed.

**Boundary:** No new features; visual approval requires the reference assets and owner review.

## v2 Requirements

Deferred until after the 26-phase v1 release; not included in the v1 roadmap.

- **P1**: Native mobile apps (React Native/Expo).
- **P2**: Predictive risk models, only with a clinical validation methodology and regulatory review.
- **P3**: External integrations beyond FHIR mapping (lab systems, PACS, pharmacy/e-prescription) and generalized document intelligence (lab reports, discharge summaries).

## Out of Scope

| Feature | Reason |
|---------|--------|
| Items listed as phase-local boundaries above | Prevents later-phase work or explicitly excluded behavior from leaking into earlier phases. |
| Real patient data before the owner-signed Phase 025 compliance gate | Production data remains prohibited until the hosting/legal review, provider agreements, breach-response plan, and other gate controls are approved. |
| Any design tokens or measurements inferred from absent reference images | The five required assets are missing; inventing image-derived design decisions would contradict the reference authority. |

## Traceability

Complete requirement inventory; phase assignments remain pending until roadmap approval.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FND-01 | TBD | Pending |
| FND-02 | TBD | Pending |
| FND-03 | TBD | Pending |
| FND-04 | TBD | Pending |
| FND-05 | TBD | Pending |
| FND-06 | TBD | Pending |
| FND-07 | TBD | Pending |
| FND-08 | TBD | Pending |
| FND-09 | TBD | Pending |
| FND-10 | TBD | Pending |
| IDN-01 | TBD | Pending |
| IDN-02 | TBD | Pending |
| IDN-03 | TBD | Pending |
| IDN-04 | TBD | Pending |
| IDN-05 | TBD | Pending |
| IDN-06 | TBD | Pending |
| IDN-07 | TBD | Pending |
| IDN-08 | TBD | Pending |
| IDN-09 | TBD | Pending |
| IDN-10 | TBD | Pending |
| IDN-11 | TBD | Pending |
| IDN-12 | TBD | Pending |
| CDM-01 | TBD | Pending |
| CDM-02 | TBD | Pending |
| CDM-03 | TBD | Pending |
| CDM-04 | TBD | Pending |
| CDM-05 | TBD | Pending |
| CDM-06 | TBD | Pending |
| CDM-07 | TBD | Pending |
| CDM-08 | TBD | Pending |
| CDM-09 | TBD | Pending |
| CDM-10 | TBD | Pending |
| CDM-11 | TBD | Pending |
| CDM-12 | TBD | Pending |
| CDM-13 | TBD | Pending |
| CDM-14 | TBD | Pending |
| CDM-15 | TBD | Pending |
| CDM-16 | TBD | Pending |
| CDM-17 | TBD | Pending |
| CDM-18 | TBD | Pending |
| PWS-01 | TBD | Pending |
| PWS-02 | TBD | Pending |
| PWS-03 | TBD | Pending |
| PWS-04 | TBD | Pending |
| PWS-05 | TBD | Pending |
| PWS-06 | TBD | Pending |
| PWS-07 | TBD | Pending |
| PWS-08 | TBD | Pending |
| PWS-09 | TBD | Pending |
| PWS-10 | TBD | Pending |
| TLN-01 | TBD | Pending |
| TLN-02 | TBD | Pending |
| TLN-03 | TBD | Pending |
| TLN-04 | TBD | Pending |
| TLN-05 | TBD | Pending |
| TLN-06 | TBD | Pending |
| TLN-07 | TBD | Pending |
| TLN-08 | TBD | Pending |
| TLN-09 | TBD | Pending |
| TLN-10 | TBD | Pending |
| TLN-11 | TBD | Pending |
| TLN-12 | TBD | Pending |
| TLN-13 | TBD | Pending |
| PROV-01 | TBD | Pending |
| PROV-02 | TBD | Pending |
| PROV-03 | TBD | Pending |
| PROV-04 | TBD | Pending |
| PROV-05 | TBD | Pending |
| PROV-06 | TBD | Pending |
| PROV-07 | TBD | Pending |
| PROV-08 | TBD | Pending |
| PROV-09 | TBD | Pending |
| PROV-10 | TBD | Pending |
| PROV-11 | TBD | Pending |
| PROV-12 | TBD | Pending |
| PROV-13 | TBD | Pending |
| PROV-14 | TBD | Pending |
| MED-01 | TBD | Pending |
| MED-02 | TBD | Pending |
| MED-03 | TBD | Pending |
| MED-04 | TBD | Pending |
| MED-05 | TBD | Pending |
| MED-06 | TBD | Pending |
| MED-07 | TBD | Pending |
| MED-08 | TBD | Pending |
| VIS-01 | TBD | Pending |
| VIS-02 | TBD | Pending |
| VIS-03 | TBD | Pending |
| VIS-04 | TBD | Pending |
| VIS-05 | TBD | Pending |
| VIS-06 | TBD | Pending |
| VIS-07 | TBD | Pending |
| VIT-01 | TBD | Pending |
| VIT-02 | TBD | Pending |
| VIT-03 | TBD | Pending |
| VIT-04 | TBD | Pending |
| VIT-05 | TBD | Pending |
| VIT-06 | TBD | Pending |
| VIT-07 | TBD | Pending |
| VIT-08 | TBD | Pending |
| LAB-01 | TBD | Pending |
| LAB-02 | TBD | Pending |
| LAB-03 | TBD | Pending |
| LAB-04 | TBD | Pending |
| LAB-05 | TBD | Pending |
| LAB-06 | TBD | Pending |
| LAB-07 | TBD | Pending |
| IMG-01 | TBD | Pending |
| IMG-02 | TBD | Pending |
| IMG-03 | TBD | Pending |
| IMG-04 | TBD | Pending |
| IMG-05 | TBD | Pending |
| IMG-06 | TBD | Pending |
| ALG-01 | TBD | Pending |
| ALG-02 | TBD | Pending |
| ALG-03 | TBD | Pending |
| ALG-04 | TBD | Pending |
| ALG-05 | TBD | Pending |
| GEN-01 | TBD | Pending |
| GEN-02 | TBD | Pending |
| GEN-03 | TBD | Pending |
| GEN-04 | TBD | Pending |
| RXI-01 | TBD | Pending |
| RXI-02 | TBD | Pending |
| RXI-03 | TBD | Pending |
| RXI-04 | TBD | Pending |
| RXI-05 | TBD | Pending |
| RXI-06 | TBD | Pending |
| RXI-07 | TBD | Pending |
| RXI-08 | TBD | Pending |
| RXI-09 | TBD | Pending |
| RXI-10 | TBD | Pending |
| RXI-11 | TBD | Pending |
| RXI-12 | TBD | Pending |
| RXI-13 | TBD | Pending |
| ATT-01 | TBD | Pending |
| ATT-02 | TBD | Pending |
| ATT-03 | TBD | Pending |
| ATT-04 | TBD | Pending |
| ATT-05 | TBD | Pending |
| ATT-06 | TBD | Pending |
| ATT-07 | TBD | Pending |
| ATT-08 | TBD | Pending |
| AI-01 | TBD | Pending |
| AI-02 | TBD | Pending |
| AI-03 | TBD | Pending |
| AI-04 | TBD | Pending |
| AI-05 | TBD | Pending |
| AI-06 | TBD | Pending |
| AI-07 | TBD | Pending |
| AI-08 | TBD | Pending |
| AI-09 | TBD | Pending |
| PAT-01 | TBD | Pending |
| PAT-02 | TBD | Pending |
| PAT-03 | TBD | Pending |
| PAT-04 | TBD | Pending |
| PAT-05 | TBD | Pending |
| PAT-06 | TBD | Pending |
| PAT-07 | TBD | Pending |
| PAT-08 | TBD | Pending |
| PAT-09 | TBD | Pending |
| PAT-10 | TBD | Pending |
| CARE-01 | TBD | Pending |
| CARE-02 | TBD | Pending |
| CARE-03 | TBD | Pending |
| CARE-04 | TBD | Pending |
| CARE-05 | TBD | Pending |
| CARE-06 | TBD | Pending |
| COM-01 | TBD | Pending |
| COM-02 | TBD | Pending |
| COM-03 | TBD | Pending |
| COM-04 | TBD | Pending |
| COM-05 | TBD | Pending |
| COM-06 | TBD | Pending |
| COM-07 | TBD | Pending |
| COM-08 | TBD | Pending |
| MSG-01 | TBD | Pending |
| MSG-02 | TBD | Pending |
| MSG-03 | TBD | Pending |
| MSG-04 | TBD | Pending |
| MSG-05 | TBD | Pending |
| MSG-06 | TBD | Pending |
| MSG-07 | TBD | Pending |
| MSG-08 | TBD | Pending |
| TELE-01 | TBD | Pending |
| TELE-02 | TBD | Pending |
| TELE-03 | TBD | Pending |
| TELE-04 | TBD | Pending |
| TELE-05 | TBD | Pending |
| TELE-06 | TBD | Pending |
| TELE-07 | TBD | Pending |
| PAY-01 | TBD | Pending |
| PAY-02 | TBD | Pending |
| PAY-03 | TBD | Pending |
| PAY-04 | TBD | Pending |
| PAY-05 | TBD | Pending |
| PAY-06 | TBD | Pending |
| PAY-07 | TBD | Pending |
| PAY-08 | TBD | Pending |
| SYNC-01 | TBD | Pending |
| SYNC-02 | TBD | Pending |
| SYNC-03 | TBD | Pending |
| SYNC-04 | TBD | Pending |
| SYNC-05 | TBD | Pending |
| SYNC-06 | TBD | Pending |
| SYNC-07 | TBD | Pending |
| SYNC-08 | TBD | Pending |
| FHIR-01 | TBD | Pending |
| FHIR-02 | TBD | Pending |
| FHIR-03 | TBD | Pending |
| FHIR-04 | TBD | Pending |
| FHIR-05 | TBD | Pending |
| FHIR-06 | TBD | Pending |
| FHIR-07 | TBD | Pending |
| SEC-01 | TBD | Pending |
| SEC-02 | TBD | Pending |
| SEC-03 | TBD | Pending |
| SEC-04 | TBD | Pending |
| SEC-05 | TBD | Pending |
| SEC-06 | TBD | Pending |
| SEC-07 | TBD | Pending |
| SEC-08 | TBD | Pending |
| SEC-09 | TBD | Pending |
| SEC-10 | TBD | Pending |
| QA-01 | TBD | Pending |
| QA-02 | TBD | Pending |
| QA-03 | TBD | Pending |
| QA-04 | TBD | Pending |
| QA-05 | TBD | Pending |
| QA-06 | TBD | Pending |
| QA-07 | TBD | Pending |
| QA-08 | TBD | Pending |

**Coverage:**
- v1 requirements: 232 total
- Mapped to phases: 0 (pending roadmap creation)
- Unmapped: 232 (pending roadmap creation)

---
*Requirements defined: 2026-10-04*  
*Last updated: 2026-10-04 after initial requirements derivation*
