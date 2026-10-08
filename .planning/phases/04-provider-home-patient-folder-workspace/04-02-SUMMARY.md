---
phase: 04-provider-home-patient-folder-workspace
plan: 02
subsystem: patients-server-layer
tags: [queries, server-actions, zod, search, pagination, invite]
requires:
  - 04-01 (patients table, CAN_MANAGE_PATIENTS, regenerated database.types.ts)
provides:
  - src/lib/patients/schemas.ts (createPatientSchema, changePatientStatusSchema, listPatientsQuerySchema, patientIdSchema)
  - src/lib/patients/queries.ts (listPatients: composed search+filter+cumulative page + exact total; escapeLike)
  - src/lib/patients/actions.ts (createPatientAction, changePatientStatusAction, sendPatientInviteAction — RESULT-type)
affects:
  - 04-03 (page.tsx consumes listPatients { rows, hasMore, total })
  - 04-04 (NewPatientControl / QuickActionsOverlay call the three actions)
tech-stack:
  added: []
  patterns: ["Zod parse → capability gate → write → revalidatePath (RESULT union)", "single ilike on search_text (never .or() with user text)", "cumulative range(0, shown+limit) + limit+1 hasMore probe"]
key-files:
  created:
    - src/lib/patients/schemas.ts
    - src/lib/patients/queries.ts
    - src/lib/patients/actions.ts
    - tests/unit/patient-queries.test.ts
    - tests/unit/patient-actions.test.ts
  modified: []
decisions:
  - REAL BUG CAUGHT BY TESTS: WorkspaceResolution carries no uid — invite creation now reads created_by from supabase.auth.getClaims().sub (never getSession, never actor.uid on a type that lacks it).
  - One strict id gate (patientIdSchema = z.string().uuid()) replaces a hand-rolled looser regex; v4 gen_random_uuid() ids pass, hand-shaped fakes fail loudly.
  - Today-window: the day string must be YYYY-MM-DD (schema regex) before it may enter a PostgREST .or() string; window = local midnight → +24h (D-14).
  - Fetch is cumulative 0..shown+limit (checker BLOCKER fix): Load more appends; an offset window would drop already-loaded rows (UX-07).
  - Accent-folding (unaccent) is recorded ACCEPTED DEBT for Phase 4 (04-RESEARCH Pitfall 5): "Élodie" is not findable via "elodie".
verification:
  - npx vitest run tests/unit/patient-queries.test.ts tests/unit/patient-actions.test.ts: 23 passed
  - npm run lint: exit 0 (rerun with tsc at phase integration)
---

# 04-02 Summary — server data layer

The retrieval and mutation semantics of Phase 4 are implemented as tested
server functions: one indexed query composes D-11/D-17..D-20 (escaped ilike,
filter predicates, local-day window, stable order, cumulative paging, exact
total), and the three actions enforce Zod-first validation with
capability-gated RESULT outcomes that never write trigger-owned columns.
