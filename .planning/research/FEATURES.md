# Feature Research

**Domain:** Dual-sided premium clinical workspace — EHR-style longitudinal patient record (provider loop: understand → decide → document → track; patient loop: understand → follow → record → communicate), built on Next.js App Router + TypeScript + Supabase (Postgres/RLS/Auth/Storage) with a mandatory D3.js v7 clinical timeline.
**Researched:** 2026-10-05
**Confidence:** HIGH (product control pack `PRODUCT-MASTER-SPEC.md` is authoritative; competitor/market checks confirm the table-stakes vs. differentiator split)

Complexity scale: **S** ≤ 2 days · **M** ≤ 1 week · **L** 2–3 weeks · **XL** > 3 weeks. Every item below also carries a roadmap phase reference so the dependency graph and `ROADMAP.md` stay consistent.

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features clinicians trained on EHRs and patients habituated to MyChart-class portals assume exist. Missing these = product feels incomplete; users give no credit but penalize absence.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Authentication & session management (email/password, server-managed session) | No clinical product may hold PHI without verified identity; secure access is the cornerstone of the HealthIT.gov Patient Engagement Playbook | M | Supabase Auth + `@supabase/ssr` cookie sessions; server-protected routes (Phase 003) |
| Organizations, membership, and server-side role resolution | Multi-clinician practice is the default deployment unit; role is data, never UI state (§3.1) | L | `organization → membership → role → policy` chain in Postgres; client guards are supplementary only (§12) |
| Row-Level Security + authorization-aware clinical entry | Clinical entry must be authorized per role and context for Doctor, Nurse, Receptionist, Patient (§3.2); a privacy failure is existential, not cosmetic | L | RLS policies on every clinical table + backend guards on every mutation (Phase 003, hardened Phase 020) |
| Folder-first patient collection on Provider Home | The provider's first job is locating a patient to open the record; the spec mandates a visual folder grid, not a table (§5) | M | Folder grid + `Recent`, `Today`, `Needs Attention`, `Critical`, compact search, new-patient entry (Phase 004) |
| Patient workspace shell with the exact 8-tab structure | Patients expect an organized record home; the nav contract is fixed: `Overview \| AI Analytics \| Visits \| Medications \| Labs \| Imaging \| Allergies \| Genetics` (§6) | M | Overview = identity, current summary, vitals context, timeline region, recent records, lab snapshot, compact timeline controls (Phase 005) |
| Visits workflow (Pre-Visit → During → After) | The visit is the organizing verb between patient and provider; documentation and follow-up are expected | L | Visit creation, documentation, follow-up, and timeline projection under the approved permission model (Phase 007) |
| Medication lifecycle with full history | Medication safety is regulated and expected; dose/frequency/route/duration are clinically load-bearing | L | start → active → change → pause/stop → historical; architecture pre-wired for CDSS but no unsafe decision logic (§8, Phase 008) |
| Labs + imaging results with provenance | Results are the top patient-portal use case in HINTS/ASTP data; unread results are the classic clinical risk | M | Lifecycles, provenance, document/media relationships, timeline projection (Phase 009) |
| Allergies + genetics record views | Allergy and intolerance lists are a hard expectation; genetic data is increasingly expected alongside them | M | Strong provenance and field-level permissions; clinically appropriate display, no raw-genome dumps (Phase 010) |
| Secure in-app messaging (unified communication model) | Messaging is among the most-used portal features; the communication model is the substrate for every other channel | M | Single thread model, provider inbox + patient threads, attachments, read state (Phase 015) |
| Audit trail foundation | Clinical records are legally auditable; security officers ask about it in the first due-diligence pass | M | Immutable audit rows: who created/updated, what, when, from where; designed in Phase 003, hardened Phase 020 |
| Deliberate loading / empty / error / retry / permission-denied states | A generic data UI in a clinical tool reads as clinical risk, not polish | S | Every surface ships these states explicitly (§24); owned by each feature phase |
| Responsive layout (desktop + mobile, shared design language) | Patients overwhelmingly access portals from phones; the same product must not feel like two products | M | Same tokens and components, deliberately different layout (§26) |
| Referential UI fidelity + semantic design tokens | Visual restraint is the product's brand promise; scattered raw hex and a default blue healthcare skin are prohibited (§2.2) | M | Semantic tokens (`frame`, `canvas`, `surface`, `accent`, `critical`, …) frozen in Phase 001, shipped in Phase 002 |

### Differentiators (Competitive Advantage)

Epic MyChart wins on breadth (150M+ users, 90.2 Best in KLAS 2025). Competing on breadth is unwinnable. The defensible ground is longitudinal clarity, provenance-first intelligence, and design language that is not another blue EHR clone.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| D3-powered interactive clinical timeline (drag-to-pan, semantic zoom, event clustering, branches, bottom scrubber, event selection) | Isolated records → a continuous health journey. Competitor "patient story" surfaces are lists and paginated reports, not a manipulable temporal projection (§8.3–§8.6) | XL | `d3-scale`, `d3-zoom`, `d3-selection`, `d3-axis`; `d3-quadtree`/`d3-hierarchy` justified only for cluster lookup and branch collision; never a static SVG (Phase 006) |
| Unified clinical-event model backing the timeline | One projection keeps the timeline truthful and every tab consistent; competitors reconcile per-surface views by hand | XL | Events are a **projection**, never the canonical store (§8.2, §13); feeds Visits/Medications/Labs/Imaging/Allergies/Genetics (Phase 006) |
| Assistive AI Patient Intelligence (change detection, summarization, attention signals, trend interpretation, documentation assistance) | Oracle's next-gen EHR markets generative AI on the same longitudinal record; the differentiator is *assistive, provenance-separated* intelligence rather than autonomous clinical decisions (§10) | XL | No diagnosis, no prescribing, no auto-dismissed alerts; every AI artifact structurally and visually distinct from clinician-verified data (§23) |
| Prescription OCR with human-in-the-loop verification | Document entry is a top EHR pain point; ASHP's 2025 analysis frames pharmacist verification as a data problem, not an AI problem — the workflow is the product | XL | Original image shown beside extracted fields, low-confidence fields highlighted, nothing authoritative until confirmed (§11, Phase 012) |
| Provenance-first records (AI-extracted ≠ clinician-verified) | Provenance collapse is a patient-safety failure mode, and provenance display is rarely done well in consumer-facing portals | L | source, creator, created, updater, updated, verification state, AI-extraction state, encounter/document link on every clinically meaningful record (§23) |
| WhatsApp + Telegram channel adapters | Large patient populations message rather than log in; Wapa Health and Luma Health validate a WhatsApp-first clinical channel | M | Adapters over the Phase 015 communication model, plus notification workflows — not a second chat implementation (Phase 016) |
| Telehealth consultation integrated with clinical context | A generic video clone ignores the consult; value is the record, timeline, and orders one pane away during the call | L | Consultation session is a clinical event attached to the visit, with the patient record and timeline in context; notifications via the communication model (Phase 017) |
| Payments abstraction with provider/patient UI | Billing is usually bolted on as a separate product; a swappable provider/payer abstraction keeps the revenue layer modular | M | Provider-agnostic adapter boundary; no hard gateway coupling in the data model (Phase 018) |
| Subtle care tasks / adherence (non-gamified) | Adherence is clinically valuable and commercially cheap to ship; gamified versions actively damage clinical trust | S | Plain tasks, due states, adherence feedback; no badges, streaks, or leaderboards (§14, Phase 014) |
| Offline draft / outbox / sync / conflict semantics | Clinic connectivity is unreliable; most competitors either crash or silently merge drafts, which is unacceptable for clinical mutations | L | local draft, queued, syncing, synchronized, failed, conflict — never claims a mutation is saved while local-only (§18, Phase 019) |
| Restrained olive/ivory/yellow clinical design language | After years of blue enterprise EHR dashboards and glass-heavy startup SaaS, a calm ivory-and-olive clinical workspace with a single yellow accent is a genuine visual differentiator | M | Semantic tokens, two-layer motion (Framer Motion for layout, GSAP for SVG/timeline choreography), reduced-motion respected (§2, §9) |
| FHIR interoperability mapping | HIPAA, US portability rules, and information-blocking pressure make FHIR non-optional for institutional buyers | M | Mapping derived from the unified event model in Phase 021; no parallel FHIR-shaped data lake (Phase 021) |
| Patient Home at lower information density | The patient side is a comprehension surface, not a second provider console | M | Next Action, Health Snapshot, Quick Log, My Care Plan — same design language, fewer simultaneous signals (Phase 013) |

### Anti-Features (Commonly Requested, Often Problematic)

The first thirteen rows are the spec's hard prohibitions (§27) in feature form. They are permanent exclusions, not backlog items — no phase may spend effort on them. The remaining rows are adjacent scope traps observed in comparable products.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Frontend-only role switching (a "view as doctor" toggle in the UI) | Feels like a convenience and demos instantly | Authorization is decided client-side; grants cross-workspace access; explicit §27 prohibition | Role resolved from server-side identity + membership + RLS; "a frontend toggle must NOT grant access to another workspace" (§3.1) |
| Client-state-only authorization (role held in localStorage/React state/query param/hidden form) | Fastest prototype path; no backend work | Client state is attacker-controlled; authorization and RLS disagree; explicit §27 prohibition | RLS as the enforcement boundary, server components and server actions as the resolution path; frontend guards supplementary only (§12) |
| Generic tables replacing the folder-first patient collection | Tables look "data-dense and professional" | Directly contradicts the reference visual language and §5; folders carry status, count, and recency that rows flatten | Folder grid with `Recent`, `Today`, `Needs Attention`, `Critical`, `Search` |
| A static chart replacing the D3 timeline | Simpler to build, fewer failure modes, "looks done" | Cannot pan, semantically zoom, cluster, or branch; violates the fixed technology decision (§8.1) and destroys the primary differentiator | D3 v7 engine; no hardcoded fixed drawing, and no generic chart library (Recharts/Chart.js) substitution |
| Random extra navbar categories (e.g. a "Vital Signs" tab, a "Communication" tab, a specialty tab) | Nav with more entries looks richer | Breaks the fixed 8-tab contract, dilutes the patient mental model, and re-creates the hardcoded-specialty failure (§6, §3.3) | The exact 8 tabs; new navigation only through an approved product change |
| Generic dashboard design unrelated to the reference images | A component library gets you to a demo in a day | Explicit §27 prohibition; produces the "generic SaaS" look the product exists to avoid | Per-surface reference primaries as the design source of truth; reference images bind layout grammar only, never sample clinical content (§1) |
| Saturated multi-color redesign | "More colors feel more medical / vivid" | Destroys semantic color language, dilutes brand, contradicts §2.2 | Frozen semantic token palette; color carries clinical meaning (critical/warning/info), never decoration |
| Excessive glassmorphism (blurred translucent cards) | "Premium and modern" | Blurs exactly the dense, scannable clinical content; hurts contrast and legibility; explicit §27 prohibition | Restrained depth model — sharp edges plus a small shadow hierarchy |
| Excessive neumorphism (inset/soft-3D controls) | Trendy, looks distinctive | Fails contrast requirements on a clinical surface and at mobile sizes; explicit §27 prohibition | Flat ivory canvas with semantic raised surfaces |
| Excessive gamification (badges, streaks, confetti, leaderboards) | Believed to "drive patient engagement" | Reads as trivializing health behavior; a clinical-credibility liability; explicit §27 prohibition | Functional care tasks and adherence feedback, plain and factual (§14) |
| Autonomous clinical AI decisions (auto-diagnosis, auto-prescribing, auto-suppressing alerts) | Vendors sell automation; Oracle markets clinical AI at scale | Safety, liability, and governance exposure; violates §27 and the "keep a human in the loop" literature; also the spec's explicit §10 boundary | Assistive only: change detection, summarization, attention signals, trend interpretation, documentation assistance — clinician remains the decider |
| Silently saving uncertain OCR output (persist low-confidence fields as authoritative) | Maximizes throughput on document entry | Incorrect doses/routes/allergies propagate to every downstream tab and to the timeline; explicit §27 prohibition | Original image beside extracted fields, low-confidence highlighting, explicit clinician confirmation before anything becomes authoritative (§11) |
| A generic chart library for the timeline (Recharts, Chart.js, Highcharts) | Prebuilt components, quick start | No semantic zoom, no quadtree clustering, no branch layout — replaces the D3 mandate in effect | D3 modules; `d3-quadtree` for cluster hit-testing, `d3-hierarchy` for branch collision |
| A default shadcn/Tailwind blue-indigo-purple healthcare skin | Ready-made components, instant consistency | Produces the generic look §2.2 prohibits; indistinguishable from any other health SaaS | Semantic tokens authored in Phase 001 and used from the first component |
| Implementing future phases opportunistically (CDSS, FHIR-shaped screens, extra channels) | Feels productive to build ahead | Explicit §27 prohibition; unvalidated clinical risk | Reserve the extension point in the data model (CDSS in Phase 008) and ship on the spec's phase order |
| "Build passes = done" | Cheapest possible verification gate | Explicit §27 prohibition; produces shipped-but-wrong UI and untested authorization | Per-phase verification plus Phase 022's visual, interaction, responsive, a11y, performance, authorization, and regression QA |
| Hardcoded specialty content in the shell (a permanently "Cardiology" workspace) | Looks like a finished demo for one clinic | Explicit §27 prohibition and the §3.3 failure; the shell is specialty-agnostic | Specialty is data, resolved from the organization's profile |

## Feature Dependencies

```
[Auth & Sessions]
    └──requires──> (nothing — foundation)

[Organizations, Membership & Server-side Role Resolution]
    └──requires──> [Auth & Sessions]

[RLS + Authorization-aware Clinical Entry]
    └──requires──> [Organizations, Membership & Role Resolution]

[Patient Directory (folder-first, Provider Home)]
    └──requires──> [RLS + Authorization-aware Clinical Entry]

[Patient Workspace Shell (8 tabs) + Overview]
    └──requires──> [RLS + Authorization-aware Clinical Entry]

[Unified Clinical-Event Model (projection)]
    └──requires──> [Visits] [Medications] [Labs + Imaging] [Allergies + Genetics]
    └──requires──> [RLS + Authorization-aware Clinical Entry]

[D3 Timeline Engine]
    └──requires──> [Unified Clinical-Event Model]

[Visits] ──projects into──> [Unified Clinical-Event Model]
[Medications] ──projects into──> [Unified Clinical-Event Model]
[Labs + Imaging] ──projects into──> [Unified Clinical-Event Model]
[Allergies + Genetics] ──projects into──> [Unified Clinical-Event Model]
[Care Tasks / Adherence] ──projects into──> [Unified Clinical-Event Model]

[Assistive AI Patient Intelligence]
    └──requires──> [Unified Clinical-Event Model]
    └──requires──> [Provenance & Verification data model]

[Prescription OCR + Document Intelligence]
    └──requires──> [Medications lifecycle] (extracted fields need a verified target model)
    └──requires──> [Provenance & Verification data model]
    └──requires──> [Storage + signed document access]

[Communication (unified model)]
    └──requires──> [RLS + Authorization-aware Clinical Entry]

[WhatsApp + Telegram Channel Adapters]
    └──requires──> [Communication (unified model)]

[Telehealth Consultation]
    └──requires──> [Visits (clinical context)]
    ├──enhances──> [Communication (reminders / link delivery)]
    └──projects into──> [Unified Clinical-Event Model]

[Payments]
    └──requires──> [Patient Workspace Shell] (where the bill is presented)

[Offline / Sync (draft · outbox · syncing · synchronized · failed · conflict)]
    └──requires──> [Visits] [Medications] [Labs + Imaging] (the clinical writers that must support drafts)
    └──conflicts──> [Any feature that assumes every mutation is immediately authoritative]

[Security / Audit Hardening]
    └──requires──> [Auth & Sessions] [RLS] [Document access] [Communication] (auditable surfaces)

[FHIR Interoperability Mapping]
    └──requires──> [Unified Clinical-Event Model]

[Design Tokens + Referent UI Contract]
    ──enhances──> [Every UI-bearing phase; retrofitting a token system mid-build is prohibitively expensive]
```

### Dependency Notes

- **D3 Timeline requires the Unified Clinical-Event Model:** the timeline is a projection over events, never the canonical store (§8.2, §13). If Phase 006 lands before the clinical writers, the timeline is an empty shell — the event model and at least one projecting source (Visits) are hard prerequisites.
- **AI Patient Intelligence requires the Unified Clinical-Event Model:** change detection, trend interpretation, and attention signals operate on an event stream, not ad-hoc records. Building it earlier yields demo-only output.
- **Prescription OCR requires the Medications lifecycle:** extracted dose/route/frequency fields need a verified target schema. Migrating unverified extractions into a live medication model afterwards is the expensive, unsafe order — hence Phase 008 before Phase 012.
- **OCR and AI require the Provenance model:** both produce extracted content that must be distinguishable from clinician-verified content (§23). Provenance is not a Phase-020 retrofit for these fields.
- **Channel adapters require the Communication model:** WhatsApp and Telegram are transports over one thread model. Building a second, parallel inbox per channel duplicates moderation, audit, and RLS.
- **Telehealth requires Visits and Communication:** the visit is where a session is registered, and the communication model delivers join links and reminders. Telehealth after Phase 015.
- **Offline/Sync conflicts with immediately-authoritative assumptions:** every clinical writer in Phases 007–010 must tolerate a locally-held draft. This constrains those phases' save semantics even though the feature ships in Phase 019.
- **Security/Audit Hardening requires real surfaces to audit:** auditing auth, documents, sessions, and communication in Phase 020 only makes sense because those surfaces already exist and already emit audit events.
- **FHIR mapping requires the Unified Clinical-Event Model:** the mapping is derived from the projection, not from a second parallel data model.
- **Design tokens enhance every UI phase:** changing the token system after feature UI exists forces a sweeping restyle, so the token contract (Phase 001) and primitives (Phase 002) must be settled first.

## MVP Definition

The v1 scope is the spec's 22-phase sequence. This section states what is essential inside that scope, and what genuinely waits.

### Launch With (v1)

- [ ] Authentication, organizations, server-side RBAC, and RLS — the security baseline for every later phase (§3.1, §3.2, §12)
- [ ] Provider Home with the folder-first patient collection — the provider's entry point (§5)
- [ ] Patient workspace shell with the exact 8 tabs and Overview — the patient's entry point (§6, §7)
- [ ] D3 clinical timeline engine (pan, semantic zoom, clustering, branches, bottom scrubber, selection) — the core differentiator (§8)
- [ ] Visits, medications, labs + imaging, allergies + genetics — the clinical object set that feeds the timeline (Phases 007–010)
- [ ] Assistive AI Patient Intelligence with provenance separation — the intelligence layer, assistive only (§10, §23)
- [ ] Prescription OCR and document intelligence with human-in-the-loop verification (§11)
- [ ] Patient Home plus subtle care tasks / adherence (§13, §14)
- [ ] Communication model with in-app surfaces plus WhatsApp and Telegram adapters (§15, §16)
- [ ] Telehealth consultation integrated with patient context (§16)
- [ ] Payments abstraction and UI (§17)
- [ ] Offline draft / outbox / sync / conflict semantics (§18)
- [ ] Security and audit hardening, then FHIR interoperability mapping (§19 Ph020–021)

### Add After Validation (v1.x)

- [ ] OCR extended to other document types (discharge summaries, referral letters, lab requisitions) — trigger: the prescription verification workflow is reliable in production use
- [ ] Additional messaging transport (SMS) — trigger: the communication model has proven cheap to extend with a third adapter
- [ ] Patient-initiated symptom and vitals logging feeding the same event projection — trigger: Patient Home's Quick Log shows real usage
- [ ] Native mobile shell (PWA install or React Native) — trigger: responsive web measurably fails mobile patient tasks

### Future Consideration (v2+)

- [ ] CDSS decision support (drug–allergy checking, interaction alerts, guideline alerts) — deferred: high governance burden and explicitly deferred by the spec; the data architecture is reserved in Phase 008, nothing more
- [ ] FHIR-shaped provider-facing screens beyond mapping — deferred: Phase 021 mapping is expected to cover the integration need
- [ ] Predictive risk scoring (readmission, deterioration) — deferred: requires a governance and model-monitoring posture that does not exist yet; must remain assistive
- [ ] Care-plan templates and population-level dashboards for organizations — deferred: organizational analytics is a different buyer and a different product surface

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Auth + organizations + server-side RBAC + RLS | HIGH | HIGH | P1 |
| Audit trail foundation | HIGH | MEDIUM | P1 |
| Provider Home + folder-first patient collection | HIGH | MEDIUM | P1 |
| Patient workspace shell + exact 8 tabs + Overview | HIGH | MEDIUM | P1 |
| Unified clinical-event model (projection) | HIGH | HIGH | P1 |
| D3 timeline engine (pan, zoom, clustering, branches, scrubber) | HIGH | HIGH | P1 |
| Visits lifecycle + documentation | HIGH | MEDIUM | P1 |
| Medications lifecycle (CDSS-ready, not CDSS) | HIGH | MEDIUM | P1 |
| Labs + imaging records with provenance and media links | HIGH | MEDIUM | P1 |
| Allergies + genetics with provenance and permissions | HIGH | MEDIUM | P1 |
| Prescription OCR + human-in-the-loop verification | HIGH | HIGH | P1 |
| Assistive AI Patient Intelligence (provenance-separated) | HIGH | HIGH | P1 |
| Patient Home (lower density, same language) | HIGH | MEDIUM | P1 |
| Care tasks / adherence (subtle) | MEDIUM | LOW | P1 |
| Unified communication + in-app surfaces | HIGH | MEDIUM | P1 |
| WhatsApp + Telegram adapters | HIGH | MEDIUM | P1 |
| Telehealth consultation in clinical context | HIGH | MEDIUM | P1 |
| Payments abstraction + UI | MEDIUM | MEDIUM | P1 |
| Design tokens + referent UI contract + QA rules | HIGH | LOW | P1 |
| Offline / sync semantics (draft, outbox, conflict) | HIGH | HIGH | P2 |
| Security / audit hardening | HIGH | MEDIUM | P2 |
| FHIR interoperability mapping | MEDIUM | MEDIUM | P2 |
| CDSS decision support | HIGH | HIGH | P3 |
| Predictive risk scoring | MEDIUM | HIGH | P3 |
| FHIR-shaped provider screens | LOW | MEDIUM | P3 |
| Population analytics dashboards | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Epic MyChart (KLAS 2025 leader) | Oracle next-gen EHR (2025) | Patient-engagement vendors (Luma Health, Wapa Health) | Our Approach |
|---------|--------------|--------------|--------------|--------------|
| Longitudinal patient view | Patient "story" reports and sectioned histories — scrolled and paginated, not manipulated as time | Generative AI over the longitudinal record; visualization is not the product claim | Mostly absent; scheduling/billing panels | D3 timeline as the primary viewing engine over one `clinical_events` projection |
| AI | Long-standing ambient/note assistance inside In Basket | Markets clinical-grade generative AI and ambient capture at enterprise scale | Thin templated outreach AI | Assistive, longitudinal, provenance-separated change detection / attention / trend interpretation; never autonomous |
| Messaging channels | In Basket + SMS notifications | Portal-native messaging | WhatsApp-first (Wapa validates WhatsApp as the channel of record in several markets) | One communication model with in-app, WhatsApp, and Telegram as transports |
| Telehealth | Video visits embedded in MyChart | Folded into the EHR suite | Standalone Twilio/Agora-based products | Consultation as a clinical event with the record and timeline in context |
| Documents / OCR | Upload + manual attachment; some ambient scanning | Broad document capture, enterprise scale | Manual upload | Full human-in-the-loop prescription OCR with confidence highlighting; never persists unverified extraction |
| Payments | Bundled billing | Practice-management billing | Simple embedded payment panels | Provider/payer-agnostic payments abstraction with a swappable adapter boundary |
| Design language | Blue enterprise, form-first | Inherits prior Oracle design language | One small vendor aesthetic each | Frozen olive/ivory/yellow semantic tokens, referent UI contract, restrained depth and motion |
| Offline / sync | Limited; web-first and online | Network application | Cloud-first | Explicit draft / queued / syncing / synchronized / failed / conflict states; never claims an unsaved clinical mutation is saved |
| Authorization | Mature, enterprise IAM | Mature, enterprise IAM | Varies | RLS-enforced, server-resolved role + context, audited, with the frontend toggle provably powerless |

## Sources

- **Competitor and market research:**
  - Epic leads 2025 Best in KLAS for MyChart patient portal (90.2 score, 150M+ users) — https://www.techtarget.com/patientengagement/news/366618817/Epic-leads-2025-Best-in-KLAS-for-MyChart-patient-portal
  - EHR Patient Portals in 2026: Features, Vendors, and What Patients Actually Want — https://ehrsource.com/articles/ehr-patient-portals
  - Oracle ushers in new era of AI-driven electronic health records (2025) — https://oracle.com/news/announcement/oracle-ushers-in-new-era-of-ai-driven-electronic-health-records-2025-08-13
  - Luma Health patient engagement platform (messaging, scheduling, telehealth) — https://go.lumahealth.io/engagement-platform
  - Wapa Health patient engagement on WhatsApp — https://www.wapa.health/features/patient-engagement
  - MEDITECH Patient Empowerment / Expanse Patient Connect — https://ehr.meditech.com/ehr-solutions/patient-empowerment
  - TELUS Health patient portal feature set — https://www.telus.com/en/health/health-professionals/clinics/emr-add-ons/patient-portal
  - TigerConnect patient engagement datasheet (video, voice, text) — https://tigerconnect.com/wp-content/uploads/2024/03/datasheet-patient-engagement-pro.pdf
  - Five key features to look for in an EHR patient portal — http://ehrinpractice.com/five-key-features-to-look-for-in-an-ehr-patient-portal
- **User research and industry standards:**
  - HealthIT.gov Patient Engagement Playbook — https://playbook.healthit.gov/playbook/pe/full
  - HealthIT.gov, Growth of Health IT-Enabled Patient Engagement Capabilities Among U.S. Hospitals 2021–2024 — https://www.healthit.gov/wp-content/uploads/2025/08/Patient-Engagement-Capabilities-Among-Hospitals-DB79_508.pdf
  - HealthIT.gov HINTS Data Brief No. 77, Individuals' Access and Use of Patient Portals and Smartphone Health Apps, 2024 — https://healthit.gov/wp-content/uploads/2025/07/2024-HINTS-Patient-Access-DB77_508.pdf
  - Electronic Health Records Amid the Rise of Generative AI (npj Digital Medicine) — https://www.nature.com/articles/s41746-026-02508-6
  - AI in health: keeping the human in the loop — https://pmc.ncbi.nlm.nih.gov/articles/PMC10280340
  - Governance and responsibility in AI-enabled prescription verification — https://pmc.ncbi.nlm.nih.gov/articles/PMC12978023
  - "AI pharmacist verification is a data problem, not an AI problem" (ASHP Connect, 2025) — https://connect.ashp.org/blogs/ben-michaels/2025/12/03/ai-pharmacist-verification-is-a-data-problemnot-an
- **Product control pack (binding source of truth for every classification above):**
  - `PRODUCT-MASTER-SPEC.md` — §2–§3 visual language and known failures, §5–§8 provider/patient surfaces and timeline engine, §9 motion, §10–§17 feature domains, §18 offline, §19 Phase 000–022, §23 provenance, §27 hard prohibitions.

---
*Feature research for: dual-sided clinical workspace (EHR-style longitudinal patient record)*
*Researched: 2026-10-05*
