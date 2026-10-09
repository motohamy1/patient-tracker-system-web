// src/lib/dev/timeline-fixture.ts — DEV-ONLY SYNTHETIC TIMELINE DATA
// (authorized preview for the timeline's branch/reveal behaviour).
//
// READ THIS BEFORE TREATING ANYTHING HERE AS REAL. This module is SYNTHETIC
// sample data for a development preview of the clinical timeline. It is NOT
// real patient information, NOT a schema and NOT a source of truth. Labels,
// dates and sub-event relationships are invented for layout purposes only.
//
// WHY IT IS ALLOWED TO EXIST (same fences as `mock-clinical.ts`):
//   1. LOCATION — it lives in `src/lib/dev/`, the sanctioned fixture home.
//   2. NOT IN A PRODUCT ROUTE — its only permitted consumer is the dev
//      gallery page (`src/app/dev/gallery/page.tsx`); no file under the real
//      `/provider` or `/patient` trees may import it (the reachability test
//      enforces "gallery is the single allowed importer" for `lib/dev`).
//   3. GATED OUT OF PRODUCTION — the gallery 404s unless the D-26 dev-route
//      gate flag is set, so this data is unreachable in every deployment.
//   4. THE PRODUCT PATH NEVER IMPORTS IT — `ClinicalTimeline` receives events
//      as props from the server projection; under today's schema that
//      projection produces no clinical events and no sub-events, so the
//      branch layer is dormant in the product and only this fixture can
//      exercise it (§27: no fabricated clinical history).
//
// DELETE THIS FILE once a real clinical phase (007+) supplies events with
// sub-events. It is scaffolding, not product.
import type { CareEvent } from '@/lib/timeline/events';

const CLINICIAN_VERIFIED = 'clinician-verified' as const;

function event(
  id: string,
  kind: CareEvent['kind'],
  category: CareEvent['category'],
  at: string,
  label: string,
  children?: readonly CareEvent[],
): CareEvent {
  return {
    id,
    kind,
    category,
    at,
    label,
    source: { table: 'patients', column: 'created_at' },
    verification: CLINICIAN_VERIFIED,
    children,
  };
}

/**
 * A deterministic preview set: visits down the axis, some carrying lab and
 * medication sub-events on branches. Fixed dates (no Date.now) so the
 * gallery and any snapshot stay stable.
 */
export const DEV_TIMELINE_EVENTS: CareEvent[] = [
  event('dev-e1', 'record-created', 'lifecycle', '2025-02-10T09:00:00Z', 'Record created'),
  event('dev-e2', 'visit', 'clinical', '2025-03-04T10:15:00Z', 'Initial consultation', [
    event('dev-e2-a', 'vital-measurement', 'clinical', '2025-03-04T10:25:00Z', 'Blood pressure recorded'),
    event('dev-e2-b', 'lab-ordered', 'clinical', '2025-03-04T10:40:00Z', 'Full blood count ordered'),
  ]),
  event('dev-e3', 'lab-result', 'clinical', '2025-03-11T08:30:00Z', 'Full blood count resulted'),
  event('dev-e4', 'medication-started', 'clinical', '2025-03-18T14:00:00Z', 'Medication started', [
    event('dev-e4-a', 'follow-up', 'clinical', '2025-04-01T09:00:00Z', 'Dose reviewed'),
  ]),
  event('dev-e5', 'visit', 'clinical', '2025-06-02T11:00:00Z', 'Follow-up visit', [
    event('dev-e5-a', 'lab-result', 'clinical', '2025-06-02T11:30:00Z', 'Metabolic panel'),
    event('dev-e5-b', 'imaging-ordered', 'clinical', '2025-06-02T11:45:00Z', 'Chest imaging ordered'),
    event('dev-e5-c', 'care-plan-change', 'clinical', '2025-06-02T12:00:00Z', 'Care plan updated'),
  ]),
  event('dev-e6', 'imaging-result', 'clinical', '2025-06-09T15:20:00Z', 'Chest imaging resulted'),
  event('dev-e7', 'medication-changed', 'clinical', '2025-08-21T13:10:00Z', 'Medication changed'),
  event('dev-e8', 'visit', 'clinical', '2025-11-05T09:45:00Z', 'Annual review'),
  event('dev-e9', 'symptom', 'clinical', '2026-01-14T18:00:00Z', 'Patient-reported symptom'),
  event('dev-e10', 'visit', 'clinical', '2026-04-22T10:30:00Z', 'Review visit', [
    event('dev-e10-a', 'document', 'clinical', '2026-04-22T10:35:00Z', 'Referral letter'),
  ]),
  event('dev-e11', 'medication-stopped', 'clinical', '2026-07-30T16:00:00Z', 'Medication stopped'),
];
