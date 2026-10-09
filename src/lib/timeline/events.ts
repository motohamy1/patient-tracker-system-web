// src/lib/timeline/events.ts — the unified Care Event model and projection
// (TL-02, PRODUCT-MASTER-SPEC.md §8.2).
//
// The timeline is a PROJECTION over the clinical-event model; the database
// stays the source of truth. Every event on the axis is a real stored record
// read server-side under org RLS — nothing is fabricated (§27, Phase-5 D-18
// precedent). Where the schema has no clinical tables yet (visits land in
// Phase 007, medications 008, labs/imaging 009, allergies/genetics 010), the
// projection maps the record's own lifecycle events and the invite trail,
// which are the honest facts available today. A lifecycle event renders AS a
// lifecycle event — it is never relabelled as a clinical event to make the
// timeline look populated.
//
// Extension seam (one mapper per source table, all merged here):
//   Phase 007+ adds clinical mappers that push `CareEvent` values of the
//   clinical kinds into the same union; the engine, zoom, scrubber, branches
//   and card all read this model and do not change.
//
// Provenance is carried on every event (§23): source (where it came from),
// createdAt (when the record says it happened) and verification state —
// AI-extracted data must never look clinician-verified.
import type { PatientRecord } from '@/lib/patients/queries';
import type { PatientInviteRow } from '@/lib/patients/queries';

/**
 * The event vocabulary: §8.2's clinical kinds (which future phases supply)
 * plus the lifecycle kinds real today. Clinical kinds are declared here so
 * the engine's type surface is final even while producers arrive phase by
 * phase — a later table only ADDS a mapper, never a new union member.
 */
export type CareEventKind =
  // clinical (§8.2) — produced by phases 007..010
  | 'visit'
  | 'diagnosis'
  | 'symptom'
  | 'medication-started'
  | 'medication-changed'
  | 'medication-stopped'
  | 'lab-ordered'
  | 'lab-result'
  | 'imaging-ordered'
  | 'imaging-result'
  | 'vital-measurement'
  | 'procedure'
  | 'hospitalization'
  | 'document'
  | 'follow-up'
  | 'care-plan-change'
  | 'patient-reported-event'
  // lifecycle (today's honest sources)
  | 'record-created'
  | 'record-updated'
  | 'invite-sent'
  | 'invite-redeemed';

/** Which broad strip of the clinical record an event belongs to (filter axis). */
export type CareEventCategory = 'clinical' | 'lifecycle';

/** Where the event was read from — the provenance trail (§23). */
export type CareEventSource =
  | { table: 'patients'; column: 'created_at' | 'updated_at' }
  | { table: 'invitations'; column: 'created_at' | 'redeemed_at' };

export type VerificationState =
  | 'clinician-verified'
  | 'ai-extracted'
  | 'system-generated';

export type CareEvent = {
  id: string;
  kind: CareEventKind;
  category: CareEventCategory;
  /** The moment the record says this happened (drives the axis position). */
  at: string;
  /** One calm sentence-case label (§7 copy contract). */
  label: string;
  /** Subtle sub-line under the node when zoomed in; real values only. */
  detail?: string;
  source: CareEventSource;
  verification: VerificationState;
  /** Related sub-events (milestone branches, TL-05) — empty today. */
  children?: readonly CareEvent[];
};

const CLINICAL_KINDS: ReadonlySet<CareEventKind> = new Set([
  'visit',
  'diagnosis',
  'symptom',
  'medication-started',
  'medication-changed',
  'medication-stopped',
  'lab-ordered',
  'lab-result',
  'imaging-ordered',
  'imaging-result',
  'vital-measurement',
  'procedure',
  'hospitalization',
  'document',
  'follow-up',
  'care-plan-change',
  'patient-reported-event',
]);

export function categoryOf(kind: CareEventKind): CareEventCategory {
  return CLINICAL_KINDS.has(kind) ? 'clinical' : 'lifecycle';
}

/** Sentence-case labels for every declared kind (the §7 copy contract). */
export const CARE_EVENT_LABELS: Record<CareEventKind, string> = {
  visit: 'Visit',
  diagnosis: 'Diagnosis',
  symptom: 'Symptom',
  'medication-started': 'Medication started',
  'medication-changed': 'Medication changed',
  'medication-stopped': 'Medication stopped',
  'lab-ordered': 'Lab ordered',
  'lab-result': 'Lab result',
  'imaging-ordered': 'Imaging ordered',
  'imaging-result': 'Imaging result',
  'vital-measurement': 'Vital measurement',
  procedure: 'Procedure',
  hospitalization: 'Hospitalization',
  document: 'Document',
  'follow-up': 'Follow-up',
  'care-plan-change': 'Care plan change',
  'patient-reported-event': 'Patient-reported event',
  'record-created': 'Record created',
  'record-updated': 'Record updated',
  'invite-sent': 'Invite sent',
  'invite-redeemed': 'Invite redeemed',
};

/**
 * Project every real, patient-scoped event available today into one
 * chronological axis set. Pure: callers pass the records they already hold
 * so the projection adds no I/O and the same input always yields the same
 * output (unit-testable, deterministic).
 *
 * `updated_at` on a patient row is bumped by the DB trigger on every change
 * (migration 0005) — until the diff-reading audit surface is authorized for
 * staff roles (Phase-5 05-VERIFICATION §5 item 1), the label stays honest:
 * "Record updated".
 */
export function projectCareEvents(
  patient: Pick<PatientRecord, 'id' | 'createdAt' | 'updatedAt'>,
  invitations: readonly PatientInviteRow[],
): CareEvent[] {
  const events: CareEvent[] = [
    {
      id: `patient:${patient.id}:created`,
      kind: 'record-created',
      category: categoryOf('record-created'),
      at: patient.createdAt,
      label: CARE_EVENT_LABELS['record-created'],
      source: { table: 'patients', column: 'created_at' },
      verification: 'system-generated',
    },
  ];

  if (patient.updatedAt !== patient.createdAt) {
    events.push({
      id: `patient:${patient.id}:updated`,
      kind: 'record-updated',
      category: categoryOf('record-updated'),
      at: patient.updatedAt,
      label: CARE_EVENT_LABELS['record-updated'],
      source: { table: 'patients', column: 'updated_at' },
      verification: 'system-generated',
    });
  }

  for (const invite of invitations) {
    events.push({
      id: `invite:${invite.id}:sent`,
      kind: 'invite-sent',
      category: categoryOf('invite-sent'),
      at: invite.createdAt,
      label: CARE_EVENT_LABELS['invite-sent'],
      source: { table: 'invitations', column: 'created_at' },
      verification: 'system-generated',
    });
    if (invite.redeemedAt !== null) {
      events.push({
        id: `invite:${invite.id}:redeemed`,
        kind: 'invite-redeemed',
        category: categoryOf('invite-redeemed'),
        at: invite.redeemedAt,
        label: CARE_EVENT_LABELS['invite-redeemed'],
        source: { table: 'invitations', column: 'redeemed_at' },
        verification: 'system-generated',
      });
    }
  }

  // Chronological, stable on identical timestamps by id (no visual jitter).
  return events.sort((a, b) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id));
}

/** Optional category filter for the timeline (TL-07); undefined = all. */
export function filterByCategory(
  events: readonly CareEvent[],
  category: CareEventCategory | undefined,
): CareEvent[] {
  if (category === undefined) return [...events];
  return events.filter((event) => event.category === category);
}

/** The categories actually present in a set — the filter chips are data-driven. */
export function availableCategories(
  events: readonly CareEvent[],
): readonly CareEventCategory[] {
  const present = new Set(events.map((event) => event.category));
  return (['clinical', 'lifecycle'] as const).filter((category) => present.has(category));
}
