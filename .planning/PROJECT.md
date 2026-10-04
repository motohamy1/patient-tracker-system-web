# Clinical Patient Workspace

## What This Is

A UI-first, dual-sided healthcare platform for providers and patients, centered on a longitudinal patient record and care tracking. The provider workspace helps clinicians understand a patient over time, act on what matters, and track what happens next; the patient experience supports clear next actions and care participation.

## Core Value

Understand the patient → act on what matters → track what happens next.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **001** Foundation, app shell, design-system infrastructure, i18n/RTL base, visual-regression harness
- [ ] **002** Identity, organizations, roles, RBAC, RLS, audit foundation
- [ ] **003** Clinical domain core: care-event model, provenance, synthetic seed data, timeline query API
- [ ] **004** Patient Workspace shell + Overview
- [ ] **005** D3 Clinical Timeline
- [ ] **006** Provider Home + Patient Folders + manual new patient
- [ ] **007** Medications
- [ ] **008** Visits
- [ ] **009** Vitals and Vital Signs history
- [ ] **010** Labs
- [ ] **011** Imaging
- [ ] **012** Allergies
- [ ] **013** Genetics
- [ ] **014** Prescription Intelligence
- [ ] **015** Needs Attention, Command Palette, global search
- [ ] **016** Patient Intelligence (AI Analytics tab)
- [ ] **017** Patient Home
- [ ] **018** Care Tasks and adherence
- [ ] **019** Communication core
- [ ] **020** WhatsApp and Telegram adapters
- [ ] **021** Telehealth
- [ ] **022** Payments and billing
- [ ] **023** Offline and synchronization
- [ ] **024** FHIR interoperability mapping layer
- [ ] **025** Security and compliance hardening
- [ ] **026** Cross-product QA, accessibility, performance, final visual QA

### Out of Scope

- **P1 Native mobile apps (React Native/Expo)** — deferred until after the 26-phase web release.
- **P2 Predictive risk models (only with a clinical validation methodology and regulatory review)** — deferred until a valid clinical methodology and regulatory review exist.
- **P3 External integrations beyond FHIR mapping (lab systems, PACS, pharmacy/e-prescription) and generalized document intelligence (lab reports, discharge summaries)** — deferred beyond v1; v1 prescription intelligence remains limited to prescription documents.

## Context

- The product is a clinical workspace, not an EMR CRUD app. The core experience is longitudinal understanding and contextual action.
- The approved stack is Next.js App Router, React, TypeScript, Tailwind CSS driven by design tokens, Supabase (Postgres, Auth, Storage, RLS, Edge Functions), TanStack Query, D3 for timeline geometry, Framer Motion for UI motion, and GSAP only where a documented advantage exists.
- D1 is resolved: Arabic and English are supported from the first component, with RTL via CSS logical properties. Clinical values use Western digits and Egypt-appropriate units: kg, °C, mmHg, and mg/dL. Timeline axes remain chronological left-to-right within RTL pages unless the owner decides otherwise.
- Reference hierarchy: `docs/design/ref-A-theme.png` is the theme authority; `ref-B1` through `ref-B3` guide layout/content structure, restyled with A's tokens; `ref-B4-folder-style.png` guides folder shape/behavior only, never measurements or colors. A wins visual conflicts; B applies only where A is silent. Sample image content is illustrative, not clinical data.
- The five reference images are absent from `docs/design/`. This blocks reference-UI extraction and Phase 1 visual approval. Do not invent image-derived measurements, tokens, or claims of visual approval.
- Patient Workspace primary tabs, exact order: Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics. Vital Signs live inside Overview. Communication is under the doctor's profile dropdown. Unbuilt tabs remain visible with designed honest empty states.
- Patient folders use the B4 form with ref-A styling; peeking cards show only record types and dates, never clinical images, results, or diagnoses. A compact list is the fallback. D11 governs colors. No gamification.
- D3 owns timeline scales, zoom, geometry, and paths; React renders and owns the DOM. D3 must not mutate React-owned DOM. Framer Motion handles UI motion; GSAP requires a documented advantage.
- No gradients, wavy dividers, glassmorphism, heavy neumorphism, 3D illustrations/icons, multicolor chart palettes, pastel alert blocks, cartoon imagery, generic SaaS dashboards, Bootstrap/Material tables, or points, levels, badges, streaks, and confetti without explicit owner approval. Use one accent from ref-A.
- Clinical records are typed, organization-scoped, provenance-bearing, auditable, and soft-deleted. The timeline is a projection, not the source of truth. Clinically relevant records retain source, creator/time, AI-generation status, verification identity/time, and original source reference.
- Synthetic data only until the owner signs the Phase 025 compliance gate. Security requires least privilege, RBAC, organization isolation, RLS on every table, audit of writes and sensitive reads, secure short-lived signed media access (no public medical-file URLs), MFA readiness for clinical roles, no client secrets, and no PHI in logs or analytics.
- AI output is labeled and remains a clinician-confirmed suggestion. It never autonomously diagnoses, prescribes, changes treatment, or silently writes authoritative data. Uncertain extraction is flagged rather than guessed; change-over-time statements are associations, not causal claims.
- Offline states must distinguish local draft, queued, syncing, synced, failed, and conflict; local-only data must never be claimed saved.

## Constraints

- **Technology**: Use the approved stack above; do not swap libraries or add dependencies without a written reason.
- **Privacy and compliance**: Keep all data synthetic until the owner signs the Phase 025 gate, including hosting-region/legal review, provider agreements, and breach-response plan.
- **Security**: Enforce permissions in the database, not only in UI; preserve tenant isolation and auditable access.
- **Clinical safety**: AI suggestions require clinician confirmation; never autonomously diagnose, prescribe, or change treatment.
- **Internationalization**: Arabic and English from the first component; logical CSS properties, RTL support, explicit units, and Western digits for clinical values.
- **Visual authority**: Do not invent image-derived design tokens before the five missing reference assets are supplied and inspected.
- **Scope**: Preserve the owner-defined 26-phase order and boundaries; do not implement later-phase work early or add P1–P3 to v1.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| D1: Arabic and English from the first component | Locked in the product pack and required for RTL-ready foundations | ✓ Approved |
| D2: Vision/OCR provider and consent for prescription-image processing | Needed before selecting a provider or sending image data; minimize PHI and obtain consent | — Owner decision pending; provider abstraction recommended |
| D3: Licensed source for the Egyptian drug catalog | Medication normalization requires an approved, current source | — Owner decision pending; verify licensing before selection |
| D4: Hosting region and production-data legal review | Production data is blocked pending Egypt Law No. 151 of 2020 review and compliance controls | — Owner decision pending; synthetic-only until Phase 025 gate is signed |
| D5: Whether the notch title tab later shows a specialty lens | Avoid implying an unapproved workspace hierarchy | — Owner decision pending; default to current workspace context |
| D6: B1's six unlabeled left-rail icons | Their meanings are unknown | — Owner decision pending; default to drop the rail until meanings are defined, using profile dropdown and command palette |
| D7: Provider Home daily statistics | Wait Times and New Admits depend on potentially unavailable scheduling/admission data | — Owner decision pending; default to Total Patients and Completed today only |
| D8: Telehealth video provider | Provider capability and current commercial terms need verification | — Owner decision pending; buy a WebRTC provider rather than build |
| D9: Payment providers for Egypt | Availability and licensing must be current and verified | — Owner decision pending; verify cards, wallets, and InstaPay-style options before Phase 022 |
| D10: WhatsApp Business Platform rules | Business-initiated messages may require an approved account and templates | — Owner decision pending; confirm current rules before Phase 020 |
| D11: Patient-folder colors | Unrelated saturated colors convey noise or false status | — Owner decision pending; recommended neutral ref-A surface colors, with status on the tab and a small single-accent label; alternative is restrained muted status colors |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason.
2. Requirements validated? → Move to Validated with phase reference.
3. New requirements emerged? → Add to Active.
4. Decisions to log? → Add to Key Decisions.
5. "What This Is" still accurate? → Update if drifted.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections.
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state.

---
*Last updated: 2026-10-04 after initialization*
