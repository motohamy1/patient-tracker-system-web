# Patient Clinical Workspace

## What This Is

A premium, dual-sided healthcare platform for providers and patients. The provider experience serves **understand → decide → document → track** across a longitudinal clinical workspace; the patient experience serves **understand → follow → record → communicate** with lower density but identical design language. One coherent clinical workspace, not a collection of unrelated SaaS dashboards. (Source: PRODUCT-MASTER-SPEC.md §Purpose, §4.)

## Core Value

> Understand the patient → act on what matters → track what happens next.

If everything else fails, the clinician must be able to understand a patient's longitudinal story and act on it inside one workspace.

## Business Context

- **Customer**: Provider organizations/practices and their patients (dual-sided).
- **Revenue model**: Provider-side business surfaces plus the payments layer (spec §17 — Phase 018); exact pricing/funnel not yet specified by the product owner.
- **Success metric**: TBD by product owner — not specified in the control pack.
- **Strategy notes**: None yet; PRODUCT-MASTER-SPEC.md is the sole product-direction source.

## Requirements

### Validated

- **Phase 001 requirements GOV-01, GOV-02, GOV-03, GOV-04, GOV-05, GOV-06** — Validated in Phase 1: Project Constitution + Reference UI Specification (completed 2026-10-06). Evidence: the eight governance artifacts under `docs/governance/` plus `.planning/phases/01-project-constitution-reference-ui-specification/01-VERIFICATION.md` (status passed, 28/28 must-haves).
- The remaining 21 roadmap phases stay unvalidated — greenfield rebuild, ship to validate.

### Active

Committed scope = the 22-phase roadmap derived from PRODUCT-MASTER-SPEC.md §19 (Phase 001–022):

- [x] Phase 001 — Project Constitution + Reference UI Specification (constitution, UI design contract, invariants, semantic tokens, visual QA/responsive/motion rules, anti-generic constraints) — validated 2026-10-06
- [ ] Phase 002 — Foundation and App Shell (Next.js shell, routes, layout primitives, tokens, typography, surfaces, buttons, pills, compact controls, modal/sheet primitives, accessibility baseline, motion foundation)
- [ ] Phase 003 — Authentication, Organizations, RBAC and RLS (auth, role resolution, org membership, provider/patient authorization, server-protected routes, DB policies, RLS, sensitive-mutation protection, audit foundation)
- [ ] Phase 004 — Provider Home + Patient Folder Workspace (visual folder collection, compact search, Recent/Today/Needs Attention/Critical, new-patient entry, contextual quick actions)
- [ ] Phase 005 — Patient Workspace / Overview (exact tab structure + command surface: identity, current summary, vitals context, timeline region, recent records, lab snapshot, compact temporal navigation)
- [ ] Phase 006 — D3 Clinical Timeline (unified event projection, horizontal pan, semantic zoom, temporal scale, event clustering, branches, event cards, bottom scrubber, event selection/detail, keyboard/touch, large-dataset performance)
- [ ] Phase 007 — Visits Workflow (Pre-Visit → During Visit → After Visit, creation, documentation, follow-up, timeline projection)
- [ ] Phase 008 — Medications (lifecycle start → active → change → pause/stop → historical; dosage/frequency/route/duration; CDSS-ready data architecture without premature unsafe decision-making)
- [ ] Phase 009 — Labs + Imaging (clinical lifecycles, provenance, document/media relationships, timeline projection)
- [ ] Phase 010 — Allergies + Genetics (clinically appropriate record views with strong provenance and permissions)
- [ ] Phase 011 — AI Analytics / Patient Intelligence (assistive: change detection, summarization, attention signals, trend interpretation, documentation assistance)
- [ ] Phase 012 — Prescription OCR + Document Intelligence (complete human-in-the-loop ingestion workflow)
- [ ] Phase 013 — Patient Home (lower information density, identical design language)
- [ ] Phase 014 — Care Tasks / Adherence (subtle tracking and adherence feedback)
- [ ] Phase 015 — Communication (unified conversation model, provider/patient surfaces)
- [ ] Phase 016 — WhatsApp + Telegram (channel adapters, notification workflows)
- [ ] Phase 017 — Telehealth (consultation workflow integrated with patient context)
- [ ] Phase 018 — Payments (provider/patient payment abstraction and UI)
- [ ] Phase 019 — Offline / Sync (local draft/outbox/sync/conflict semantics)
- [ ] Phase 020 — Security / Audit Hardening (auth, RLS, org isolation, sensitive data, documents, auditability, sessions, API exposure, privacy failure modes)
- [ ] Phase 021 — Interoperability (FHIR mapping where justified)
- [ ] Phase 022 — Final Product QA and Convergence (visual, interaction, responsive, accessibility, performance, authorization, regression QA, production build)

Spec Phase 000 (Greenfield Preflight + Product Baseline) is satisfied by this GSD initialization run: repository reset committed, control pack preserved, reference assets stabilized under `docs/reference/`, GSD established with `.planning/` as persistent state.

### Out of Scope

Hard prohibitions from PRODUCT-MASTER-SPEC.md §27, each with its reason:

- Hardcoded specialty (e.g. "Cardiology") in the shell — specialty labels may exist only as real, data-driven concepts with a specified product purpose (§3.3).
- Frontend-only role switching — role must come from trusted server-side identity and DB membership data (§3.1).
- Authorization based only on client state — backend/DB policy layer must enforce authorization independently of the frontend (§3.1).
- Generic tables replacing the folder-first patient collection — the folder grid is the primary patient-discovery interaction (§5).
- Replacing D3 timeline requirements with a static chart — D3.js is mandatory; the timeline is a core product engine (§8.1, §3.5).
- Adding random extra navbar categories — patient workspace primary navigation is exactly Overview | AI Analytics | Visits | Medications | Labs | Imaging | Allergies | Genetics (§6, §3.4).
- Generic dashboard design unrelated to the reference — the reference image is the visual source of truth (§2).
- Saturated multi-color redesign — restrained semantic accents; never every folder a different saturated color (§2.2, §5).
- Excessive glassmorphism — depth must be subtle and controlled (§2.4).
- Excessive neumorphism — controls must remain distinguishable (§2.4).
- Excessive gamification — clinical product; no points, levels, fireworks, cartoon rewards (§14).
- Autonomous clinical AI decisions — AI is assistive only; no autonomous diagnosis or prescribing (§10, §11 Phase 011).
- Silently saving uncertain OCR output — clinician verification with original image visible is required (§11).
- Implementing future phases during the current phase — phase discipline (§19, §27).
- Declaring a feature complete solely because the build passes — build success is necessary but never sufficient (§20.7).

Also out of scope for v1: FHIR-shaped UI screens (mapping may come later in Phase 021 without forcing FHIR-shaped screens, §13); CDSS decision support (Phase 008 prepares the data architecture but does not implement unsafe decision-making); messaging channels beyond in-app/WhatsApp/Telegram (§15).

## Context

- **Greenfield rebuild.** The old implementation was deleted from the working tree and committed as a deliberate reset (`132afb6`); it survives only as git history (`d69f1f8` and earlier) and is diagnostic evidence only — never a design or architecture source (§1, §19 Phase 000).
- **Authority.** PRODUCT-MASTER-SPEC.md is the authoritative product control pack. GSD artifacts (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, STATE.md, phase CONTEXT/UI-SPEC/RESEARCH/PLAN/VERIFICATION/UAT) operationalize it and must not silently contradict it. When implementation conflicts with the spec or an approved GSD artifact, the spec wins unless the product owner approves a change (§0, §1).
- **Source-of-truth hierarchy** (§1): approved project Constitution → primary Reference UI image → Reference UI Specification and UI Invariants → approved feature spec → approved technical plan → approved tasks → existing repository → agent preference. The existing repository is never higher than approved design/specification.
- **Reference assets** (per-surface primaries, binding on design grammar — layout, geometry, interaction patterns — never sample clinical content, §1, §3.3):
  - `docs/reference/provider-home-primary.jpg` — Provider Home primary: folder grid, Today's Schedule, Critical Alerts, yellow accent.
  - `docs/reference/patient-workspace-timeline-primary.jpg` — Patient Workspace + D3 timeline primary: timeline and bottom scrubber.
  - `docs/reference/patient-home-primary.jpg` — Patient Home primary: Next Action, Health Snapshot, Quick Log, My Care Plan.
  - `docs/reference/patient-tracking-dashboard.jpg` — **diagnostic evidence only**: the source of the §3.3 Cardiology failure, the §3.4 duplicate filter row, the §3.5 static-timeline failure, and the §3.7 color drift. Never a design source.
- **Visual language** (§2): premium, clinical, calm, highly organized, information-dense but easy to scan, modern, tactile, restrained. Three color families: dark olive/khaki structural framing and navigation, warm ivory/off-white workspace surfaces, bright vivid yellow used selectively. Never generic Tailwind blue/indigo/purple healthcare colors.
- **Known problems to eliminate** (§3): unauthorized cross-role dashboard switching, unauthorized clinical data entry forms, hardcoded Cardiology shell content, incorrect secondary filter row, static timeline, reference-mismatched timeline language, incorrect colors, heavy inconsistent layout.
- **Execution framework.** GSD is mandatory (§20). Model orchestration separates planning/review (GLM-5.3) from routine execution (GLM-5.3-Flash) per §0.1; Phases 003 (RBAC/RLS) and 006 (D3 timeline) are flagged high-risk — first implementation passes there may be escalated to the stronger model.
- **Environment/runtime constraints to preserve**: Windows 10 workstation, bash shell, Node ≥18 available, git on `main`. GSD agents (gsd-project-researcher, gsd-research-synthesizer, gsd-roadmapper) are not installed for this runtime, so project research and roadmap were authored inline during initialization; installing agents is a separate future decision (`npx @opengsd/gsd-core@latest --global`).

## Constraints

- **Tech stack**: Next.js application shell (§19 Ph002); Supabase/PostgreSQL relational clinical data model (§13); D3.js mandatory for the timeline (§8.1) with React responsible for app UI/state composition.
- **Design tokens**: semantic tokens only, no scattered raw hex; exact values frozen after visual review against the reference (§2.2). Token categories include frame, frameForeground, canvas, surface, surfaceMuted, surfaceRaised, textPrimary, textSecondary, borderSubtle, accent, accentSoft, success, warning, critical, info (15 frozen tokens in `docs/governance/tokens.json`; `accentSoft` admitted at the D-08 owner design gate on 2026-10-06).
- **Motion**: two-layer architecture — Framer Motion for component/layout/panel transitions, GSAP for complex SVG drawing and timeline choreography; all motion fast, smooth, subtle, interruptible, reduced-motion compatible (§9).
- **Security**: authorization determined server-side and enforced by database/API layer (RLS where applicable); frontend route guards supplementary only; never trust role info from localStorage, browser state, or URL parameters (§3.1, §12).
- **Navigation**: patient workspace primary nav is exactly the 8 tabs in §6; no Vital Signs primary tab (vitals belong inside Overview); Communication is a provider/profile communication surface, not a primary clinical tab (§3.4, §15).
- **Data**: relational domain model Organization → Membership → User → Patient → Encounter/Visit → Clinical Events → Medications/Labs/Imaging/Vitals/Allergies/Genetics/Documents/Care Tasks/Communications; no unstructured JSON blob; the timeline is a projection, never canonical storage (§13, §8.2).
- **Provenance**: every clinically meaningful record carries source, creator, created, updater, updated, verification state, AI-extraction state, and encounter/document relationship where applicable; AI-extracted data must not appear indistinguishable from clinician-verified data (§23, §10).
- **Error/empty/loading**: every major workspace has deliberate loading, empty, error, retry, permission-denied, and offline/sync states; no generic "Loading…" screens (§24).
- **Performance**: explicit attention to timeline rendering cost, event clustering, re-renders, network waterfalls, image/document loading, large patient collections, pagination/virtualization, animation cost, mobile performance (§25).
- **Responsive**: web and mobile share design language but not identical layouts; desktop gets horizontal timeline, dense folders, larger surfaces; mobile adapts for touch, compact navigation, reduced density (§26).
- **Accessibility**: baseline in Phase 002; keyboard/touch considerations for the timeline (§8.3); visual/interaction/accessibility QA gates in Phase 022 (§22).
- **Process**: planning is mandatory before implementation (§20.3); UI phases have an additional design gate with visual review against the reference (§20.4, §21); role-based acceptance testing across Doctor, Nurse, Receptionist, Patient, and unauthorized accounts (§22); no autonomous execution for the initial rebuild (§20.9); human review stop after initialization before Phase 001 begins (§29 Step 4).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Greenfield rebuild in place; old implementation deleted and kept as git history | Spec §19 Phase 000 and §1: old repo is diagnostic evidence only, never patched forward | — Pending |
| Per-surface reference primaries (provider home / patient workspace+timeline / patient home); old screenshot demoted to `patient-tracking-dashboard.jpg` | Each surface has a binding visual source; the old screenshot documents the failures being eliminated (§3.3–§3.5) | — Pending |
| Patient workspace primary nav is exactly Overview \| AI Analytics \| Visits \| Medications \| Labs \| Imaging \| Allergies \| Genetics | §6 exact tab structure; no specialty/Vital Signs/Communication primary tabs (§3.4) | — Pending |
| Provider patient collection is a visual folder grid (folder-first), with Recent/Today/Needs Attention/Critical/Search coexisting | §5 folder principle; folders are premium digital clinical folders, not gamification | — Pending |
| D3 timeline as a projection over a unified Care/Clinical Event model | §8.1–§8.2: D3 mandatory; database remains source of truth; timeline is a view, not canonical storage | — Pending |
| Server/DB-enforced RBAC + RLS; no client-side role state trusted | §3.1, §12: frontend toggle must never grant cross-workspace access (§19 Phase 003 acceptance condition) | — Pending |
| GLM-5.3 for planning/research/architecture/review; GLM-5.3-Flash for execution, via `model_overrides` in `.planning/config.json` | §0.1 strong-thinker + cheap-executor orchestration; Phase 003/006 flagged high-risk with escalation path | — Pending |
| Human review stop after initialization before Phase 001 begins | §20.9 forbids autonomous execution for the initial rebuild; §29 Step 4 requires artifact review first | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Business Context check (if present) — customer, revenue model, success metric still accurate?
4. Audit Out of Scope — reasons still valid?
5. Update Context with current state (users, feedback, metrics)

---
*Last updated: 2026-10-06 after Phase 1 completion (Project Constitution + Reference UI Specification)*
