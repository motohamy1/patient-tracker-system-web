# Project Research Summary

## Scope

Greenfield research for the Patient Clinical Workspace: a dual-sided premium clinical workspace (EHR-style longitudinal record) — providers: understand → decide → document → track; patients: understand → follow → record → communicate. Target direction fixed by the control pack: Next.js (App Router) + TypeScript, Supabase (Postgres + Auth + RLS + Storage), D3.js v7 (mandatory) for the clinical timeline, Framer Motion + GSAP two-layer motion, Tailwind v4 with semantic tokens (olive/ivory/yellow clinical palette), Zod, Vitest + Playwright.

Research dimensions: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md (all in `.planning/research/`).

## Key Findings

### Stack (STACK.md — verified against registries, 2025)
- **Next.js 16.3.8 / TypeScript 5.9.x** (High): App Router with server components + server actions; TS 7.0.2 exists but the ecosystem (incl. Next.js) has not verified it — pin TS 5.9.x. (Medium confidence on the TS pin.)
- **Supabase `@supabase/ssr` 0.12.7 + supabase-js 2.117.2** (High): session-cookie auth with RLS on 100% of tables; service-role key confined to Edge Functions only.
- **D3 v7 modules** (High): `d3-scale` 4.0.2, `d3-zoom` 3.0.0, `d3-selection` 3.0.0, `d3-axis` 3.0.0; `d3-quadtree` 3.0.1 / `d3-hierarchy` 3.1.2 justified only for branch-collision/clustering. Integration pattern: React owns structure/state; D3 owns scales/zoom imperatively through refs to avoid per-frame re-renders.
- **Motion `motion` (Framer Motion) 14.0.0 for layout/entrance + GSAP 3.15.0 for SVG path/timeline choreography** (High); never both libraries for the same animation.
- **Zod 4.6.5, Tailwind CSS 4.3.3 with CSS-variable semantic tokens, Vitest 5.0.3 + Playwright 1.63.0 (visual regression for reference-fidelity gates)** (High).
- **OCR**: provider-agnostic vision/document-AI adapter; vendor deliberately open (Medium confidence) — normalized against ICD-10/RxNorm.
- **What NOT to use** (High): no charting library substituting D3 for the timeline; no default shadcn/Tailwind-blue healthcare theme (semantic tokens only); no ORM/data path that bypasses RLS.

### Features (FEATURES.md — competitor-verified: Epic MyChart, Oracle next-gen EHR, patient-engagement vendors)
- **Table stakes (13)**: auth/sessions; org + membership + role resolution; RLS + authorization-aware clinical entry; folder-first patient collection; 8-tab patient workspace; visits workflow; medication lifecycle; labs/imaging; allergies/genetics; in-app secure messaging; audit foundation; deliberate loading/empty/error/permission states; responsive layout with semantic-token fidelity.
- **Differentiators (13)**: D3 timeline engine; unified clinical-event projection; assistive AI patient intelligence; prescription OCR with human-in-the-loop verification; provenance-first records; WhatsApp + Telegram adapters; context-integrated telehealth; payments abstraction; subtle care tasks/adherence; offline draft/outbox/sync/conflict; restrained olive/ivory/yellow design language; FHIR mapping; low-density patient home.
- **Anti-features (18)**: the 13 §27 hard prohibitions in feature form plus "build passes = done" and scope traps (generic chart substitution, default blue healthcare skin, opportunistic future-phase implementation).
- **MVP mapping**: 13 v1 launch items mapped to spec phases; v2 deferrals: CDSS, FHIR-shaped screens, predictive risk scoring, population analytics.

### Architecture (ARCHITECTURE.md — 10 cited sources)
- **Authorization chain is verbatim architecture**: auth → trusted identity → org membership → role resolution → authorization → permitted workspace; `resolveAccess()` request-cached server-side; RLS on every table including the projection; service-role confined to Edge Functions.
- **`clinical_events` is a trigger-maintained projection (CQRS-lite, NOT event sourcing)**: all 17 spec §8.2 event types enumerated; Postgres triggers maintain the projection in the same transaction as canonical writes, so the timeline can never diverge from canonical rows; compound indexes on `(patient_id, occurred_at)`; status lifecycles emit new events.
- **OCR pipeline = 9 persisted stages** (spec §11 verbatim), including clinician verification with the image beside fields and low-confidence highlighted; unverified drafts are never authoritative.
- **High-risk phases**: Phase 003 (RLS; mitigate with pgTAP-style policy tests shipped in every migration — no table without policies in the same migration) and Phase 006 (D3 timeline; freeze event taxonomy + projection schema in-phase, performance acceptance at high event counts).

### Pitfalls (PITFALLS.md — 18 cited sources incl. CVE-2025-29927)
- Top failures with owning phases: client-state privilege escalation (P3); service-role key bypassing RLS (P3); timeline jank at thousands of events (P6); OCR silently persisting low-confidence fields (P12); provenance collapse (AI-extracted indistinguishable from clinician-verified, P11/P12); generic-SaaS visual drift away from olive/ivory/yellow (P1/P2 review gates); over-densification; Next.js App Router caching leaking PHI between users (P2, mitigated by explicit cache directives/revalidate discipline); middleware-only authorization — CVE-2025-29927 middleware-bypass directly justifies the §3.1 frontend-toggle gate (P3); PHI in logs/analytics (P20); offline drafts presented as saved (P19).
- Every pitfall carries warning signs, prevention, owning phase, and confidence.

## Implications for Roadmap

1. **Phase 1 (Constitution)** must freeze the semantic tokenizer on the three reference color families and register per-surface reference primacy before any component exists — retro-fitting tokens is the §3.7 failure mode.
2. **Phase 3 (RBAC/RLS) is the risk gate**: policy tests ship in the same migration as every table; the Phase-003 acceptance condition (frontend toggle must not grant access) is verified against cache, middleware, and URL manipulation — not just UI hiding.
3. **Phase 6 (Timeline) needs its data contract first**: event-type taxonomy and `clinical_events` projection schema are frozen inside Phase 6's plan; performance acceptance at high event counts is a success criterion, not an optimization afterthought.
4. **Phases 11/12 (AI, OCR) inherit the provenance gate**: provenance fields and AI-extraction state are structural (§23), so Phase 11/12 UI work is mostly presentation over already-provenanced data — provenance columns must exist by Phase 9.
5. **Phase 12 OCR** selects the vision/OCR vendor adapter inside the phase (deliberately open); the interface contract is the commitment, not the vendor.
6. **Phase 19 (Offline)** defines the six sync states before any optimistic UI exists in earlier phases reads them as "pending" — earlier phases must not present local state as saved.
7. **Visual fidelity is testable**: Playwright visual regression against reference-derived baselines belongs in the Phase 1 QA rules and runs from Phase 2 onward.

## Sources

- `.planning/research/STACK.md` — registry-verified versions; Next.js/Supabase/D3/motion/Tailwind/Vitest/Playwright docs (URLs in file's Sources section).
- `.planning/research/FEATURES.md` — Epic MyChart 2025 Best in KLAS (techtarget.com); Oracle next-gen AI-driven EHR announcement (Aug 2025); HealthIT.gov Patient Engagement Playbook; ASTP/HINTS 2024-2025 data briefs; patient-engagement vendor feature sets (Luma Health, Wapa Health, MEDITECH, TELUS, TigerConnect); AI governance literature (npj Digital Medicine EHR+genAI; keep-the-human-in-the-loop PMC; AI prescription verification governance PMC; ASHP 2025) — 18 URLs in file.
- `.planning/research/ARCHITECTURE.md` — Supabase RLS/roles/SSR docs; two multi-tenant RLS reference repos; multi-tenant Postgres trade-off article; PostgreSQL trigger docs; pg-audit-json; CQRS projections overview; PRODUCT-MASTER-SPEC.md §3.1–3.8, §8–13, §15–19, §23, §27 — 10 sources in file.
- `.planning/research/PITFALLS.md` — Supabase RLS leak postmortems + Advisors docs; Next.js caching docs and "Our Journey with Caching"; CVE-2025-29927 (GHSA/NVD/NCSC); D3 large-dataset performance threads; Datadog/Sentrik PHI-in-logs guidance; PRODUCT-MASTER-SPEC.md §3, §8, §10, §11, §18, §27 — 18 URLs in file.
- PRODUCT-MASTER-SPEC.md — authoritative control pack (§0.1 model orchestration, §19 phases, §27 prohibitions, §29 review gate).
