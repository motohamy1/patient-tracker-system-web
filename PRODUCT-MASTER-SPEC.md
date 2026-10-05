# Patient Clinical Workspace — Master Rebuild Control Pack v3 (GSD + Model Orchestration)

## Purpose

The target product is a premium, dual-sided healthcare platform for providers and patients. Its central product idea is:

> Understand the patient → act on what matters → track what happens next.

The product must feel like one coherent clinical workspace, not a collection of unrelated SaaS dashboards.

---

# 0. CRITICAL EXECUTION MODE

You are an AI coding agent working under a strict GSD (Get Shit Done) phase-driven workflow.

This document is the authoritative PRODUCT CONTROL PACK. GSD is the execution/context-management framework. GSD artifacts such as `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md`, `STATE.md`, phase `CONTEXT.md`, `UI-SPEC.md`, `RESEARCH.md`, `PLAN.md`, `VERIFICATION.md`, and `UAT.md` operationalize this document; they must not silently contradict it.

The project is a GREENFIELD REBUILD. The old repository may be inspected as diagnostic evidence only. Do not progressively patch the old implementation into compliance.

You are NOT authorized to:

- invent product requirements;
- redesign the visual language;
- replace the reference UI with a generic healthcare dashboard;
- create a frontend-only role system;
- silently change authorization rules;
- hardcode clinical data that should be data-driven;
- hardcode a specialty such as “Cardiology” into the shell;
- turn every feature into a card grid;
- make the application overly gamified;
- replace D3 with another timeline/visualization engine;
- treat the current broken implementation as the design source of truth;
- implement future phases opportunistically;
- modify unrelated features without an explicit reason;
- let a cheaper execution model reinterpret or expand an approved plan.

When the current implementation conflicts with this document or an approved GSD artifact, this document/specification wins unless the product owner explicitly approves a change.

When a requirement is ambiguous and the ambiguity materially changes behavior, stop and ask for clarification instead of inventing an answer.


## 0.1 MODEL ORCHESTRATION STRATEGY — STRONG THINKER + CHEAP EXECUTOR

The project intentionally separates **thinking/planning/review** from **routine implementation**.

### Primary model roles

**Architect / Planner / Reviewer — GLM-5.3**

Use the stronger GLM model for:

- project initialization and requirement interpretation;
- product/architecture decisions;
- phase discussion and ambiguity resolution;
- UI design-contract generation;
- technical research;
- database/schema design;
- authentication/RBAC/RLS design;
- D3 timeline architecture and interaction design;
- performance architecture;
- security analysis;
- plan creation and plan review;
- verification and convergence;
- visual/UI review;
- diagnosing failures that the execution model cannot resolve safely;
- deciding whether an implementation must be escalated to the stronger model.

**Implementation Executor — GLM-5.3-Flash**

Use the cheaper/faster GLM model for:

- executing already-approved GSD plans;
- writing routine application code;
- implementing isolated components from explicit task instructions;
- tests and straightforward fixes;
- mechanical refactors explicitly described by the plan;
- repetitive wiring, types, schemas, CRUD surfaces, and styling changes that are already specified.

The executor is NOT the product architect. It must execute the approved plan rather than redesign the solution.

### Mandatory control loop

```text
STRONG MODEL
  ↓
Understand phase + inspect context
  ↓
Research / discuss / resolve ambiguity
  ↓
UI contract where applicable
  ↓
Create and verify atomic PLAN.md files
  ↓
HAND OFF
  ↓
CHEAPER EXECUTOR
  ↓
Implement only approved tasks
  ↓
Run task-level verification
  ↓
HAND BACK
  ↓
STRONG MODEL
  ↓
Verify behavior + architecture + security + visual convergence
  ↓
Accept phase OR create correction plans
```

This is preferred over asking one model to both invent the architecture and write every line of code.

### Non-negotiable handoff rule

The strong model must leave enough information in GSD artifacts that the executor does not need to rediscover product intent.

Every implementation plan should make clear, where applicable:

- objective;
- files to inspect first;
- files/modules allowed to change;
- exact behavior;
- data model/API impact;
- authorization requirements;
- UI/reference constraints;
- tests;
- verification commands;
- acceptance criteria;
- explicit non-goals;
- rollback or safety considerations for risky changes.

If the executor discovers that the plan is incomplete, contradictory, or unsafe, it MUST stop at the smallest ambiguity and request clarification/escalation. It must not silently invent a new architecture.

### Risk-based escalation

Cheap execution is the default, NOT an absolute rule.

The stronger model SHOULD execute or directly supervise implementation when the task materially affects:

- authentication or authorization;
- RLS/database security policies;
- clinical-data isolation;
- destructive migrations;
- core data-model changes;
- D3 timeline architecture;
- large-scale performance architecture;
- complex state synchronization;
- interoperability boundaries;
- production security;
- final convergence fixes where a visual mismatch is subtle and reference-critical.

For these tasks, the project may temporarily use GLM-5.3 for execution even though ordinary implementation uses GLM-5.3-Flash.

### Do not confuse “small model” with “low responsibility”

GLM-5.3-Flash may write production code, but only inside an approved scope with explicit verification. It is not allowed to decide that a missing requirement is an invitation to improvise.

### Cost-control principle

Spend the stronger model's budget on **decisions and verification**, not on repetitive typing.

Spend the cheaper model's budget on **execution**, not on product discovery.

The goal is not maximum model usage. The goal is maximum correctness per unit of model cost.

### Current OpenCode Go note

At the time this control pack was prepared, OpenCode Go lists both `GLM-5.3` and `GLM-5.3-Flash`. OpenCode's current documentation also supports assigning different models to different OpenCode agents, so this project should use model-specific agents/configuration rather than relying on one global model for every task.

Always run `/models` and use the model IDs actually exposed by the installed OpenCode Go account before finalizing configuration; the available model lineup can change.

### Recommended GSD model routing

GSD supports per-agent model overrides in `.planning/config.json`. For an OpenCode Go installation, the recommended routing is:

```json
{
  "runtime": "opencode",
  "model_profile": "inherit",
  "model_overrides": {
    "gsd-planner": "opencode-go/glm-5.3",
    "gsd-roadmapper": "opencode-go/glm-5.3",
    "gsd-phase-researcher": "opencode-go/glm-5.3",
    "gsd-project-researcher": "opencode-go/glm-5.3",
    "gsd-research-synthesizer": "opencode-go/glm-5.3",
    "gsd-codebase-mapper": "opencode-go/glm-5.3",
    "gsd-executor": "opencode-go/glm-5.3-flash",
    "gsd-debugger": "opencode-go/glm-5.3-flash",
    "gsd-verifier": "opencode-go/glm-5.3",
    "gsd-plan-checker": "opencode-go/glm-5.3",
    "gsd-integration-checker": "opencode-go/glm-5.3",
    "gsd-nyquist-auditor": "opencode-go/glm-5.3",
    "gsd-ui-researcher": "opencode-go/glm-5.3",
    "gsd-ui-checker": "opencode-go/glm-5.3",
    "gsd-ui-auditor": "opencode-go/glm-5.3",
    "gsd-doc-writer": "opencode-go/glm-5.3-flash",
    "gsd-doc-verifier": "opencode-go/glm-5.3"
  }
}
```

Treat this as the **recommended starting configuration**, not as an immutable requirement. The exact GSD agent catalog can change between releases, so after updating GSD verify the supported agent names and then reapply the same strategy.

If the installed GSD version supports only a subset of these agent names, configure the agents it exposes and keep the conceptual rule:

```text
planning / research / architecture / UI review / verification
→ GLM-5.3

execution / routine debugging / repetitive implementation
→ GLM-5.3-Flash
```

For Phase 003 (RBAC/RLS) and Phase 006 (D3 timeline), treat the first implementation pass as **high-risk**. If the plan checker, verifier, or human review detects architectural uncertainty, temporarily route the affected executor/debugger to GLM-5.3 rather than forcing the cheap model through a difficult task.

---

# 1. SOURCE-OF-TRUTH HIERARCHY

Use this precedence order:

1. Approved project Constitution
2. Primary Reference UI image supplied by the product owner
3. Reference UI Specification and UI Invariants
4. Approved feature specification for the current phase
5. Approved technical plan
6. Approved tasks/checklist
7. Existing repository implementation
8. Agent preference

The existing repository is NEVER a higher authority than the approved design/specification.

The screenshots of the current implementation are diagnostic evidence only. They show what went wrong; they are not design references.

---

# 2. NON-NEGOTIABLE VISUAL SOURCE OF TRUTH

The supplied reference UI image is the primary design reference for the whole product.

The product must evolve the reference design, not replace it.

The following visual language is binding:

## 2.1 Overall visual character

The interface must feel:

- premium;
- clinical;
- calm;
- highly organized;
- information-dense but easy to scan;
- modern;
- tactile;
- restrained;
- visually sophisticated.

It must NOT feel:

- childish;
- cartoon-like;
- gaming-oriented;
- generic SaaS;
- spreadsheet-like;
- overly glossy;
- over-animated;
- excessively glassmorphic;
- excessively neumorphic;
- filled with arbitrary gradients;
- decorated with unrelated 3D illustrations.

## 2.2 Structural color language

The reference establishes three major visual families:

1. Dark olive / khaki structural framing and navigation areas.
2. Warm ivory / off-white clinical workspace surfaces.
3. Bright vivid yellow used selectively for important interactions, timeline milestones, active emphasis, and key state indicators.

Do NOT substitute these with generic Tailwind blue/indigo/purple healthcare colors.

Do NOT choose arbitrary theme colors merely because they look “modern.”

Before final UI implementation, document the chosen color tokens derived from the reference image in a permanent design-token file.

The implementation must use semantic tokens, not scattered raw hex values.

Example semantic token categories:

- frame
- frameForeground
- canvas
- surface
- surfaceMuted
- surfaceRaised
- textPrimary
- textSecondary
- borderSubtle
- accent
- success
- warning
- critical
- info

The exact token values must be frozen after visual review against the reference.

## 2.3 Geometry

The reference uses strong rounded geometry.

Use:

- pills for compact navigation and controls;
- very rounded cards;
- soft container corners;
- smooth transitions between surfaces;
- compact tags/banners;
- thin, precise visual lines.

Avoid:

- sharp corners;
- arbitrary mixed radius systems;
- bulky dashboard tiles;
- huge empty cards that add no information.

## 2.4 Depth and shadows

Depth should be subtle and controlled.

Avoid extreme neumorphism that makes controls difficult to distinguish.

Avoid strong glass blur effects unless directly justified by the reference.

The reference is the visual authority, not the names “Neumorphism” or “Glassmorphism.”

The agent must reproduce the visual grammar, not blindly apply a design trend.

---

# 3. CURRENT IMPLEMENTATION PROBLEMS THAT MUST BE ELIMINATED

The current screenshots reveal several blocking problems.

## 3.1 Unauthorized cross-role dashboard switching

The current implementation allows the same authenticated user to switch between Provider Home / Doctor Workspace and Patient Home through frontend controls.

This is unacceptable.

Role selection is NOT a visual preference.

The authenticated principal's role must come from trusted server-side identity and database membership/authorization data.

A user must not gain access to a provider workspace by changing a client-side toggle, route, local state value, query parameter, or hidden form.

The application must enforce:

Authentication
→ trusted identity
→ organization/membership resolution
→ role resolution
→ authorization
→ permitted workspace

The backend/database policy layer must enforce authorization independently of the frontend.

The frontend may hide controls, but hiding controls is NOT considered security.

## 3.2 Clinical data entry must be authorization-aware

The current implementation exposes a clinical/blood-related data-entry form from the frontend in both the doctor and patient experiences.

This must be corrected.

Any clinical entry action must be authorized by role and context.

Examples:

- Doctor: may create/update clinical records according to permissions.
- Nurse: may enter permitted vitals/demographics and operational data.
- Receptionist: may perform permitted administrative registration/scheduling tasks.
- Patient: may enter patient-generated health observations that are explicitly allowed, but must NOT gain provider-only clinical authoring privileges.

Do not implement “role-based UI” only.

Implement real authorization at the backend/data layer.

## 3.3 Incorrect “Cardiology” shell content

The current Provider/Patient Workspace screenshot shows a prominent “Cardiology” item that does not belong in the product shell under the current specification.

This is a hard failure.

DO NOT hardcode Cardiology.

A specialty/context label may exist only when it is a real, data-driven concept with a specified product purpose.

The default shell must NOT invent specialty labels simply because a reference screenshot contains them.

The system must not copy isolated content from the reference image when the content is not part of the product requirements.

The reference is used for design grammar, layout language, and interaction patterns — not for blindly copying sample clinical content.

## 3.4 Incorrect secondary filter row

The current implementation contains a row such as:

All / Office Visits / Medications / Labs / Procedure / Hospitalizations / Imaging / Filter

This does not match the approved primary navigation model.

The patient workspace primary navigation must be exactly:

Overview
AI Analytics
Visits
Medications
Labs
Imaging
Allergies
Genetics

Vital Signs belong inside Overview.

Communication belongs under the provider/profile communication surface, not as a primary clinical tab.

Do not reintroduce unrelated duplicated navigation rows without an approved specification.

## 3.5 Timeline is too static and insufficiently interactive

The current timeline is visually static and too rigid.

It does not provide the intended exploration model and does not behave like a true interactive longitudinal timeline.

It must be rebuilt as an actual D3-powered interaction system.

The timeline is a core product engine, not an ornamental graphic.

## 3.6 Timeline does not match the reference language

The current timeline differs from the reference in:

- proportions;
- spatial rhythm;
- branch structure;
- event density;
- timeline navigation;
- bottom scrubber behavior;
- relationship between nodes and cards;
- visual hierarchy.

The new timeline must be specification-driven and reference-aligned.

## 3.7 Current colors are incorrect

The current implementation does not match the reference color language closely enough.

Do not patch colors one component at a time.

Rebuild the semantic design-token layer first, then refactor the interface against the tokens.

## 3.8 Current layout is too heavy and inconsistent

The current implementation has oversized sections, bulky controls, and navigation that does not preserve the compact density of the reference.

The new design must preserve the reference's compact clinical rhythm.

---

# 4. PRODUCT MODEL

The system is a dual-sided healthcare platform.

## Provider side

Primary goal:

> Understand → decide → document → track

The provider experience includes:

- provider home;
- patient folder workspace;
- patient workspace;
- timeline;
- visits;
- medications;
- labs;
- imaging;
- allergies;
- genetics;
- AI analytics/patient intelligence;
- communication;
- telehealth;
- staff workflows;
- relevant administrative/business surfaces.

## Patient side

Primary goal:

> Understand → follow → record → communicate

Patient experience includes:

- patient home;
- current care;
- medications;
- appointments;
- health snapshots;
- patient-generated observations;
- documents;
- care tasks/adherence;
- communication;
- relevant payments.

The patient and provider experiences use the same visual design language but DO NOT have identical information density or privileges.

---

# 5. PATIENT FOLDER PRINCIPLE

The provider's patient collection is a visual representation of a patient list.

The default representation is a set/grid of elegant digital folders.

The folder concept is NOT gamification.

The folders must:

- resemble premium digital clinical folders;
- remain visually restrained;
- preserve the reference design language;
- expose concise patient identity/context;
- support rapid scanning;
- open the patient's workspace on interaction.

Each folder may display:

- patient name;
- minimal age/sex or relevant identity information;
- patient ID/MRN when appropriate;
- a compact status label/banner;
- last relevant activity;
- small contextual indicators.

Possible status concepts:

- Stable
- Follow-up
- Needs Review
- Critical
- New

Status must use subtle semantic accents rather than turning the screen into a rainbow.

Never make every folder a different saturated color.

The folder grid must remain the main patient-discovery interaction on Provider Home.

Search and filter must coexist with the folder grid.

Recommended retrieval controls:

- Recent
- Today
- Needs Attention
- Critical
- Search

A compact list/dense-view fallback may be added later, but folder view is the primary visual representation.

---

# 6. PATIENT WORKSPACE STRUCTURE

The patient workspace is the central clinical area.

The primary navigation is EXACTLY:

1. Overview
2. AI Analytics
3. Visits
4. Medications
5. Labs
6. Imaging
7. Allergies
8. Genetics

No extra specialty tab.

No duplicate “All” clinical navigation unless a dedicated approved specification requires it.

No “Cardiology” tab/label by default.

No Vital Signs primary tab.

No Communication primary clinical tab.

Communication appears through the provider/profile communication controls and/or approved communication surfaces.

---

# 7. OVERVIEW

Overview is the patient's command surface.

The purpose is not to show every possible data point.

The purpose is to answer:

- Who is this patient?
- What matters now?
- What changed?
- What is currently active?
- What needs follow-up?
- What does the recent longitudinal record show?

The Overview must contain:

- compact patient identity area;
- concise current clinical context;
- vital-sign snapshot/history where appropriate;
- interactive timeline;
- recent records;
- laboratory snapshot/summary where appropriate;
- contextual status/attention indicators;
- compact temporal navigation.

Avoid huge redundant cards.

---

# 8. TIMELINE PRODUCT SPECIFICATION

The timeline is one of the product's strongest differentiators.

It must not be a static decorative SVG.

## 8.1 Required technology

D3.js is mandatory.

D3 controls timeline-specific visualization behavior including:

- scales;
- positioning;
- event mapping;
- SVG paths;
- branches;
- zooming;
- pan behavior;
- temporal domain changes;
- timeline-level interactions.

React remains responsible for application UI/state composition.

Do not build the entire application as D3.

## 8.2 Event concept

The timeline must be driven by a unified Care/Clinical Event model rather than tightly coupling visualization logic to individual tables.

Possible event types:

- visit;
- diagnosis;
- symptom;
- medication-started;
- medication-changed;
- medication-stopped;
- lab-ordered;
- lab-result;
- imaging-ordered;
- imaging-result;
- vital-measurement;
- procedure;
- hospitalization;
- document;
- follow-up;
- care-plan-change;
- patient-reported-event.

The database remains the source of truth.

The timeline is a projection/view over the clinical event model.

## 8.3 Interaction requirements

The timeline must support:

- drag-to-pan;
- horizontal exploration;
- semantic zoom;
- event clustering when zoomed out;
- increasing event detail when zoomed in;
- temporal scrubbing;
- selecting an event;
- opening event details;
- contextual expansion;
- category filtering;
- accessible interaction where practical;
- responsive behavior.

## 8.4 Semantic zoom

The user must not be forced to inspect hundreds of events individually.

At broad zoom levels:

- show temporal clusters;
- show important milestones;
- reduce detail;
- preserve chronology.

At narrower zoom levels:

- reveal individual events;
- reveal event relationships;
- reveal detailed micro-cards.

The timeline should feel more like an explorable clinical map than a long static list.

## 8.5 Branches

Main milestones may have branches to related sub-events.

Branches should be:

- thin;
- precise;
- visually calm;
- smoothly curved where appropriate;
- spatially predictable;
- collision-aware.

Do not allow random crossing spaghetti-like paths.

## 8.6 Bottom time scrubber

The scrubber must be compact and visually integrated with the reference design.

It must allow quick movement through:

- months;
- years;
- event density;
- current timeline range.

The scrubber must not become a giant secondary navigation bar.

---

# 9. MOTION SYSTEM

Use a deliberate two-layer motion architecture.

## Framer Motion

Use for:

- component entrance/exit;
- layout transitions;
- panels;
- sheets;
- folder-to-workspace transitions where suitable;
- compact micro-interactions.

## GSAP

Use when genuinely advantageous for:

- complex SVG drawing;
- timeline path animation;
- timeline choreography;
- advanced interaction sequences.

Do not automatically use both libraries for every animation.

All motion must remain:

- fast;
- smooth;
- subtle;
- interruptible;
- purposeful;
- compatible with reduced-motion preferences.

The design must never feel gamified because of animation.

---

# 10. AI PRINCIPLES

AI is an assistive layer, not an autonomous clinician.

Avoid autonomous clinical decisions.

Initial AI Patient Intelligence capabilities should prioritize:

- What changed?
- What matters?
- What is new?
- What needs attention?
- Summarize recent history.
- Summarize the last period.
- Highlight abnormal or notable trends.
- Identify missing follow-up/documentation.
- Assist with documentation.

Any clinically meaningful AI output must have appropriate provenance and human review.

Distinguish:

- patient-entered;
- staff-entered;
- doctor-entered;
- imported;
- AI-extracted;
- AI-generated;
- verified by clinician;
- system-derived.

Never silently transform AI output into authoritative clinical truth.

---

# 11. PRESCRIPTION OCR / DOCUMENT INTELLIGENCE

The prescription scanner is a major ingestion workflow.

Required conceptual pipeline:

Prescription image
→ image preprocessing
→ OCR/vision extraction
→ structured extraction
→ medical entity normalization
→ ambiguity/confidence analysis
→ clinician verification
→ persistence
→ projection into patient record/timeline

The doctor must always see the original image alongside extracted information during verification.

Low-confidence or ambiguous fields must be highlighted.

Do not guess unclear medication names, doses, durations, or diagnoses.

Possible candidate matches may be shown, but the clinician must make the final confirmation.

Store source/provenance metadata where appropriate.

The same document-intelligence architecture should later support:

- lab reports;
- discharge summaries;
- referrals;
- external imaging reports;
- prior prescriptions.

---

# 12. AUTHORIZATION / RBAC ARCHITECTURE

Minimum roles:

- Provider/Doctor
- Nurse
- Receptionist
- Patient
- Admin/Organization Owner where required

Do not assume all providers have identical permissions.

Authorization must be determined server-side and enforced by the database/API layer.

Frontend route guards are supplementary only.

Requirements include:

- authenticated identity;
- organization membership;
- role resolution;
- resource ownership/access rules;
- least privilege;
- Row Level Security where applicable;
- protected document access;
- audit logging for sensitive mutations.

A provider cannot become a patient through a UI toggle unless the database identity genuinely has both roles and the product explicitly supports multi-role accounts.

A patient cannot become a provider by manipulating the frontend.

A client cannot grant itself permissions.

Never trust role information supplied solely by localStorage, browser state, or URL parameters.

---

# 13. DATA ARCHITECTURE PRINCIPLES

Use a relational domain model appropriate for clinical longitudinal records.

Supabase/PostgreSQL is the intended backend foundation.

The data model must support relationships such as:

Organization
→ Membership
→ User
→ Patient
→ Encounter/Visit
→ Clinical Events
→ Medications
→ Labs
→ Imaging
→ Vitals
→ Allergies
→ Genetics
→ Documents
→ Care Tasks
→ Communications

Avoid building an unstructured JSON blob that becomes impossible to query or secure.

Avoid making the timeline itself the canonical storage model.

The architecture should be compatible with future interoperability mapping such as FHIR without forcing the UI into FHIR-shaped screens.

---

# 14. PATIENT EXPERIENCE

The patient interface shares the visual DNA of the reference but is less dense.

The patient experience must NOT become a gamified app.

Primary concepts:

- Today's Care
- Next Action
- Medications
- Appointments
- Health Snapshot
- Quick Log
- Care Plan
- Documents
- Communication

Adherence can be represented subtly through progress and completion states.

Avoid:

- excessive points;
- levels;
- fireworks;
- cartoon rewards;
- aggressive gamification language.

---

# 15. COMMUNICATION

Communication is a system-level capability, not a clinical primary tab.

Use a unified conversation abstraction with channels such as:

- in-app;
- WhatsApp;
- Telegram.

Clinical truth must remain in the clinical record.

Messaging should not become an uncontrolled shadow medical record.

---

# 16. TELEHEALTH

Do not build a generic Zoom clone.

The core workflow is:

Appointment
→ Start consultation
→ Video surface
→ Patient context
→ Timeline/clinical workspace
→ Visit documentation
→ Complete visit

The clinical workspace remains visible and usable during the consultation.

---

# 17. PAYMENTS

Payments are a business layer.

Provider surfaces may include:

- earnings overview;
- invoice/payment status;
- consultation fee status.

Patient surfaces may include:

- fee;
- invoice;
- payment;
- receipt.

Do not pollute clinical timeline content with unnecessary financial information.

Use an abstraction for payment providers so the clinical domain is not hardcoded to a single payment provider.

---

# 18. OFFLINE / RESILIENCE

The application should be resilient to intermittent connectivity.

Do not equate client cache with confirmed persistence.

If offline workflows are introduced, explicitly track:

- local draft;
- queued;
- syncing;
- synchronized;
- failed;
- conflict.

Never tell the user a sensitive clinical mutation is permanently saved while it exists only locally.

---

# 19. PHASE ROADMAP

Implement the project in independently specified phases.

Do not implement all phases in one pass.

## Phase 000 — Greenfield Preflight + Product Baseline

Goal:

Prepare a clean repository and establish the project as a greenfield rebuild while preserving the master specification and reference assets.

Do NOT treat the old implementation as a candidate design or architecture to patch forward.

Preflight outputs:

- confirm the new repository/workspace is clean;
- preserve this master control pack inside the new project;
- place the primary reference UI image(s) in a stable `/docs/reference/` location;
- record the old repository only as diagnostic evidence if it is available;
- identify environment/runtime constraints that must be preserved or intentionally changed;
- confirm the intended stack and deployment assumptions before implementation;
- identify any high-impact ambiguity that must be resolved before Phase 001;
- establish GSD as the project workflow and `.planning/` as the persistent project state.

The old implementation may be inspected for lessons such as authorization failures, hardcoded content, timeline limitations, and visual drift, but it must not become the source of truth.

No product feature implementation.
No UI implementation.
No speculative refactoring of the old repository.

Completion condition:

The project can be initialized by GSD from this control pack, the reference asset is available to the agent, and the first implementation phase has a clear approved scope.

## Phase 001 — Project Constitution + Reference UI Specification

Use GSD's UI-design workflow for this phase where supported (for example `/gsd-ui-phase 1`).

Create:

- permanent project constitution;
- reference UI specification / UI design contract;
- UI invariants;
- semantic design tokens;
- visual QA rules;
- responsive design rules;
- motion rules;
- explicit anti-generic-SaaS and anti-gamification constraints.

The primary reference image must be explicitly treated as the visual source of truth.

No product feature implementation yet.

This phase must be approved before feature-heavy implementation begins.

## Phase 002 — Foundation and App Shell

Build only:

- Next.js application shell;
- route structure;
- layout primitives;
- semantic design tokens;
- typography;
- surfaces;
- buttons;
- pills;
- compact controls;
- modal/sheet primitives;
- accessibility baseline;
- motion foundation.

No fake clinical dashboard.

No fake patient data beyond isolated development fixtures.

## Phase 003 — Authentication, Organizations, RBAC and RLS

Implement:

- authentication;
- role resolution;
- organization membership;
- provider/patient authorization;
- server-protected routes;
- database policies;
- RLS;
- sensitive mutation protection;
- audit foundation.

Acceptance condition:

A frontend toggle must NOT grant access to another workspace.

## Phase 004 — Provider Home + Patient Folder Workspace

Build the provider home.

The hero interaction is the visual patient-folder collection.

Include:

- compact search;
- patient folders;
- Recent;
- Today;
- Needs Attention;
- Critical;
- new patient entry point;
- contextual quick actions.

Do not add unrelated specialty labels.

## Phase 005 — Patient Workspace / Overview

Build the patient workspace shell and exact tab structure:

Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics

Overview contains:

- patient identity;
- current summary;
- vitals context;
- timeline region;
- recent records;
- lab snapshot where relevant;
- compact timeline controls.

## Phase 006 — D3 Clinical Timeline

Implement the actual timeline engine.

Required:

- unified event projection;
- horizontal pan;
- semantic zoom;
- temporal scale;
- event clustering;
- branches;
- event cards;
- bottom scrubber;
- event selection;
- contextual detail;
- keyboard/touch considerations;
- large dataset performance.

The timeline must not be hardcoded as a fixed static drawing.

## Phase 007 — Visits Workflow

Implement:

Pre-Visit → During Visit → After Visit

Include visit creation, documentation, follow-up, and timeline projection according to approved data model/permissions.

## Phase 008 — Medications

Implement medication lifecycle:

start → active → change → pause/stop → historical

Include dosage/frequency/route/duration where required by the approved specification.

Prepare the data architecture for future CDSS without prematurely implementing unsafe decision-making.

## Phase 009 — Labs + Imaging

Implement their clinical lifecycles, provenance, document/media relationships, and timeline projection.

## Phase 010 — Allergies + Genetics

Implement clinically appropriate record views with strong provenance and permissions.

## Phase 011 — AI Analytics / Patient Intelligence

Implement assistive AI capabilities focused on:

- change detection;
- summarization;
- attention signals;
- trend interpretation;
- documentation assistance.

Do not implement autonomous diagnosis or autonomous prescribing.

## Phase 012 — Prescription OCR + Document Intelligence

Implement the complete human-in-the-loop ingestion workflow.

## Phase 013 — Patient Home

Implement the patient workspace with lower information density but identical design language.

## Phase 014 — Care Tasks / Adherence

Implement subtle care-task tracking and adherence feedback.

Do not introduce gaming-heavy UI.

## Phase 015 — Communication

Implement unified communication model and provider/patient communication surfaces.

## Phase 016 — WhatsApp + Telegram

Implement channel adapters and notification workflows.

## Phase 017 — Telehealth

Implement consultation workflow integrated with patient context.

## Phase 018 — Payments

Implement provider/patient payment abstraction and UI.

## Phase 019 — Offline / Sync

Implement local draft/outbox/sync/conflict semantics.

## Phase 020 — Security / Audit Hardening

Audit:

- auth;
- RLS;
- organization isolation;
- sensitive data access;
- documents;
- auditability;
- session behavior;
- API exposure;
- privacy failure modes.

## Phase 021 — Interoperability

Add FHIR/interoperability mapping where justified by the approved scope.

## Phase 022 — Final Product QA and Convergence

Perform:

- visual QA;
- interaction QA;
- responsive QA;
- accessibility QA;
- performance QA;
- authorization QA;
- regression QA;
- production build verification.

---

# 20. GSD WORKFLOW FOR EVERY PHASE

GSD is the required execution framework for this rebuild.

Do not use the old Spec-Kit command sequence from the previous version of this document.

## 20.1 Project bootstrap

Start the new repository with GSD using this master control pack as the product-direction source.

Preferred command when supported by the installed GSD version:

```text
/gsd-new-project --auto @PRODUCT-MASTER-SPEC.md
```

If the installed GSD version does not support `--auto`, run:

```text
/gsd-new-project
```

and explicitly provide this document to the project initialization flow.

After initialization, review the generated:

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/config.json`

The generated artifacts must preserve the requirements and prohibitions in this document.

## 20.2 Standard phase lifecycle

For each phase, use the current GSD command set supported by the installed version. The intended lifecycle is:

```text
DISCUSS / SPECIFY
      ↓
UI DESIGN CONTRACT (when UI is involved)
      ↓
RESEARCH + PLAN
      ↓
PLAN CHECK / VERIFICATION
      ↓
EXECUTE
      ↓
VERIFY / UAT
      ↓
UI REVIEW (when UI is involved)
      ↓
CONVERGE / CORRECT
      ↓
PHASE ACCEPTED
```

Typical commands include:

```text
/gsd-spec-phase N
/gsd-discuss-phase N
/gsd-ui-phase N
/gsd-plan-phase N
/gsd-execute-phase N
/gsd-verify-work N
/gsd-ui-review N
```

Use only commands actually present in the installed GSD version. GSD evolves; do not invent command names if the installed skill exposes a different equivalent.

## 20.3 Planning is mandatory before implementation

Do not jump directly from a roadmap item to code.

A phase must have approved planning artifacts before execution.

The plan must cover:

- user problem;
- exact scope;
- requirements;
- acceptance criteria;
- edge cases;
- loading/empty/error/permission states;
- responsive behavior;
- accessibility;
- security/authorization;
- data impact;
- API boundaries;
- file/module boundaries;
- tests and verification;
- explicit non-goals.

## 20.4 UI phases have an additional design gate

For frontend/UI phases:

1. inspect the primary reference;
2. create/update the GSD UI design contract;
3. define the visual invariants that must not drift;
4. plan implementation against that contract;
5. execute;
6. perform visual review against the actual rendered UI;
7. reject and correct visual drift before accepting the phase.

Do not allow the executor to invent a replacement design system during implementation.

## 20.5 Execution model rule

The default executor is GLM-5.3-Flash.

The stronger GLM-5.3 model owns the planning/research/architecture/review loop.

The executor must:

- read the relevant GSD artifacts first;
- inspect the exact files named by the plan;
- implement only the approved tasks;
- run the required verification;
- preserve existing approved behavior outside scope;
- report deviations instead of silently solving them with new assumptions.

## 20.6 Verification model rule

Verification is not delegated blindly to the same cheap execution pass that wrote the code.

For important phases, the stronger model should perform the final convergence review after execution.

At minimum verify:

- requirements coverage;
- functional behavior;
- authorization/security;
- data integrity/provenance;
- UI/reference fidelity;
- responsive behavior;
- accessibility;
- performance;
- tests/builds.

## 20.7 Phase completion rule

A phase is complete only when:

- approved plans were executed;
- required tests passed or documented exceptions were approved;
- GSD verification/UAT artifacts are acceptable;
- visual review passed for UI work;
- no blocking authorization/security mismatch remains;
- no future-phase work was silently introduced;
- actual behavior matches the approved product specification.

A successful build is necessary but never sufficient.

## 20.8 Correction loop

If verification finds a gap:

```text
VERIFICATION / UAT GAP
        ↓
STRONG MODEL DIAGNOSIS
        ↓
SMALL CORRECTION PLAN
        ↓
CHEAP EXECUTION WHEN SAFE
        ↓
STRONG MODEL RE-VERIFICATION
```

Do not restart an entire phase because of a localized defect.

Do not let a local fix silently expand into a new feature.

## 20.9 Do not use autonomous execution for the initial rebuild

Do not begin this project with a fully autonomous “build everything” command.

The first phases establish the constitution, reference contract, architecture, and security model. Human approval remains part of the control loop until the project demonstrates stable convergence.

# 21. REFERENCE-UI ACCEPTANCE GATE

Before a phase is accepted, visually inspect the actual implementation against the primary reference.

Check:

- outer structure;
- color relationships;
- spacing rhythm;
- compactness;
- card proportions;
- pill controls;
- typography hierarchy;
- timeline proportions;
- node/branch behavior;
- bottom scrubber;
- visual density;
- accent restraint.

Reject the phase if it looks like a generic SaaS dashboard even when the requested functionality works.

Reject the phase if new features introduce a different visual language.

Reject the phase if the implementation starts becoming overly gamified.

---

# 22. ROLE-BASED ACCEPTANCE GATE

Test with at least:

Doctor account
Nurse account
Receptionist account
Patient account
Unauthorized account

Verify:

- route access;
- component access;
- API access;
- database access;
- mutation permissions;
- document access;
- clinical data visibility.

The same browser UI must not be able to switch a user's privilege level.

---

# 23. DATA PROVENANCE ACCEPTANCE GATE

Every clinically meaningful record should have an appropriate provenance concept.

At minimum, where applicable:

- source;
- creator;
- created time;
- updater;
- updated time;
- verification state;
- AI extraction state;
- relationship to encounter/document.

AI-extracted data must not appear indistinguishable from clinician-verified data.

---

# 24. ERROR / EMPTY / LOADING REQUIREMENT

Every major workspace must have deliberate:

- loading state;
- empty state;
- error state;
- retry behavior;
- permission-denied state;
- offline/sync state where applicable.

Do not use generic “Loading…” screens throughout the product.

Do not leave blank panels when data is unavailable.

---

# 25. PERFORMANCE REQUIREMENTS

The product's defining experience is smooth interaction.

Therefore the implementation must explicitly consider:

- timeline rendering cost;
- event clustering;
- unnecessary re-renders;
- network waterfalls;
- image/document loading;
- large patient collections;
- pagination or virtualization where appropriate;
- animation cost;
- mobile performance.

Do not trade clinical usability for unnecessary visual effects.

---

# 26. RESPONSIVE REQUIREMENTS

Web and mobile share design language but not necessarily identical layouts.

Desktop may use:

- horizontal timeline;
- dense patient folders;
- larger information surfaces.

Mobile must adapt for:

- touch;
- smaller width;
- compact navigation;
- reachable controls;
- reduced density;
- safe interaction.

Do not simply shrink the desktop version.

---

# 27. HARD PROHIBITIONS

The following are explicit violations:

- hardcoded Cardiology in the shell without a data-driven requirement;
- frontend-only role switching;
- authorization based only on client state;
- generic tables replacing the folder-first patient collection;
- replacing D3 timeline requirements with a static chart;
- adding random extra navbar categories;
- generic dashboard design unrelated to the reference;
- saturated multi-color redesign;
- excessive glassmorphism;
- excessive neumorphism;
- excessive gamification;
- autonomous clinical AI decisions;
- silently saving uncertain OCR output;
- implementing future phases during the current phase;
- declaring a feature complete solely because the build passes.

---

# 28. FINAL AGENT OPERATING RULE

At the beginning of every phase, say internally:

“What is the smallest approved scope that must be implemented, and what artifacts authorize it?”

At the end of every phase, say internally:

“Does the actual implementation match the approved product behavior, authorization model, and reference visual language?”

If the answer is no, do not claim completion.

The goal is not to produce the maximum amount of code.

The goal is to produce the smallest correct implementation that moves the platform toward the intended product without regressions.

---

# 29. FIRST COMMAND TO EXECUTE

The old Spec-Kit command `/speckit.constitution` is intentionally removed from this version.

## Step 1 — Open the new clean repository

Place this file in the repository as:

```text
PRODUCT-MASTER-SPEC.md
```

Place the primary reference image(s) under:

```text
/docs/reference/
```

Keep the old project outside the new implementation path or as a separate backup/inspection source.

## Step 2 — Connect OpenCode Go

In OpenCode:

```text
/connect
```

Select OpenCode Go, then use:

```text
/models
```

to confirm that the intended models are available.

Recommended roles for this project:

```text
PLANNING / ARCHITECTURE / REVIEW
→ GLM-5.3

IMPLEMENTATION / ROUTINE FIXES
→ GLM-5.3-Flash
```

The model IDs must be taken from the current `/models` output rather than assumed from an old configuration.

## Step 3 — Initialize GSD

Preferred, if supported by the installed GSD version:

```text
/gsd-new-project --auto @PRODUCT-MASTER-SPEC.md
```

Otherwise:

```text
/gsd-new-project
```

and provide `PRODUCT-MASTER-SPEC.md` during initialization.

## Step 4 — STOP after planning initialization

Do NOT start application coding immediately.

Review the generated:

```text
.planning/PROJECT.md
.planning/REQUIREMENTS.md
.planning/ROADMAP.md
.planning/STATE.md
.planning/config.json
```

Confirm that:

- the project is recognized as a greenfield rebuild;
- the reference image is part of the design source of truth;
- patient folders are folder-first, not a generic table/list;
- the exact patient workspace tabs are preserved;
- D3 is mandatory for the clinical timeline;
- frontend-only role switching is prohibited;
- server/database authorization and RLS are mandatory;
- “Cardiology” is not hardcoded into the shell;
- visual language remains restrained and reference-aligned;
- future phases are not pulled into early phases;
- model orchestration separates planning/review from routine execution.

Only after this review should Phase 001 begin.

## Step 5 — Phase loop

For each phase, follow the GSD lifecycle and the model orchestration strategy in Section 20.

Typical sequence:

```text
/gsd-discuss-phase N
/gsd-ui-phase N              # when frontend/UI work exists
/gsd-plan-phase N
/gsd-execute-phase N
/gsd-verify-work N
/gsd-ui-review N             # when frontend/UI work exists
```

If the installed GSD version exposes a slightly different command spelling or workflow, use the installed command set while preserving the same gates and control logic.

## Final operating principle

Do not ask the strongest model to spend most of its budget typing repetitive code.

Do not ask the cheapest model to make architectural or product decisions.

Use:

```text
STRONG THINKING
→ precise plan
→ CHEAP EXECUTION
→ STRONG VERIFICATION
```

That is the intended operating model for this rebuild.



# 30. TOOLING MAINTENANCE NOTE

This control pack intentionally avoids hardcoding OpenCode/GSD behavior that can change over time.

Before starting a new milestone or if commands behave differently:

- run `/models` in OpenCode;
- inspect the installed GSD command/help output;
- preserve this document as the product authority;
- update only the tooling-specific parts when a framework changes;
- never weaken product, security, authorization, or visual acceptance gates merely because a tool command changed.

The product specification should remain stable even if the AI tooling changes.

# END OF REBUILD CONTROL PACK
