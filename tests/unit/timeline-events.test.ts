// tests/unit/timeline-events.test.ts — the unified Care Event projection
// (TL-02, §8.2; ticket 06-01; §27 honesty).
//
// The projection is the one seam every later clinical phase plugs into, so
// this file pins its contract: real stored facts only, stable ids,
// chronological order, the closed kind vocabulary, and the honest behaviour
// when nothing else exists yet.
import { describe, expect, it } from 'vitest';
import {
  CARE_EVENT_LABELS,
  availableCategories,
  categoryOf,
  filterByCategory,
  projectCareEvents,
  type CareEventKind,
} from '@/lib/timeline/events';

const PATIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2025-05-12T08:00:00Z',
  updatedAt: '2026-10-06T09:30:00Z',
};

const INVITES = [
  {
    id: 'inv-1',
    createdAt: '2026-09-01T10:00:00Z',
    redeemedAt: null,
  },
  {
    id: 'inv-2',
    createdAt: '2026-08-02T10:00:00Z',
    redeemedAt: '2026-08-03T12:00:00Z',
  },
];

describe('projectCareEvents — real records only (§27)', () => {
  it('projects the record lifecycle and the invite trail in chronological order', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    expect(events.map((e) => e.kind)).toEqual([
      'record-created', // 2025-05-12
      'invite-sent', // 2026-08-02
      'invite-redeemed', // 2026-08-03
      'invite-sent', // 2026-09-01
      'record-updated', // 2026-10-06
    ]);
  });

  it('emits no "updated" event for an untouched record', () => {
    const events = projectCareEvents({ ...PATIENT, updatedAt: PATIENT.createdAt }, []);
    expect(events.map((e) => e.kind)).toEqual(['record-created']);
  });

  it('carries provenance on every event (§23)', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    for (const event of events) {
      expect(event.source.table === 'patients' || event.source.table === 'invitations').toBe(true);
      expect(event.verification).toBe('system-generated');
      expect(CARE_EVENT_LABELS[event.kind]).toBe(event.label);
      expect(event.children ?? []).toHaveLength(0);
    }
  });

  it('has stable, unique ids and is deterministic', () => {
    const a = projectCareEvents(PATIENT, INVITES);
    const b = projectCareEvents(PATIENT, INVITES);
    expect(a).toEqual(b);
    expect(new Set(a.map((e) => e.id)).size).toBe(a.length);
  });

  it('emits only declared vocabulary kinds', () => {
    const declared = new Set(Object.keys(CARE_EVENT_LABELS) as CareEventKind[]);
    for (const event of projectCareEvents(PATIENT, INVITES)) {
      expect(declared.has(event.kind)).toBe(true);
    }
  });

  it('declares the §8.2 clinical vocabulary for the phases that will supply it', () => {
    // the type surface is final now; producers arrive phase by phase
    const declared = new Set(Object.keys(CARE_EVENT_LABELS) as CareEventKind[]);
    for (const kind of ['visit', 'lab-result', 'medication-started', 'imaging-result'] as const) {
      expect(declared.has(kind)).toBe(true);
    }
    // …and nothing today is relabelled as clinical (§27)
    for (const event of projectCareEvents(PATIENT, INVITES)) {
      expect(event.category).toBe('lifecycle');
    }
  });
});

describe('category filtering (TL-07)', () => {
  it('passes through when no category is selected', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    expect(filterByCategory(events, undefined)).toEqual(events);
  });

  it('reports only the categories actually present', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    expect(availableCategories(events)).toEqual(['lifecycle']);
  });

  it('maps every kind to its category', () => {
    expect(categoryOf('visit')).toBe('clinical');
    expect(categoryOf('record-created')).toBe('lifecycle');
  });
});
