// tests/unit/timeline-cards.test.tsx — the band's floating-card layer
// (quick task 261012-e2y; §23/§27; INV-08).
//
// The cards are the patient's REAL events — nothing invented. These tests
// pin that: card text equals the CareEvent values passed in, zero cards for
// a record without featured kinds, the medication chip variant, byte-stable
// SSR markup, and zero fabricated chart paths (the old illustration's
// area-chart/rhythm paths are gone from the band).
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimelineCards, type TimelineCardPlacement } from '@/components/timeline/TimelineCards';
import type { CareEvent } from '@/lib/timeline/events';

/** Synthetic clinical values that must NEVER appear in the band's DOM. */
const FABRICATED_VALUES = [
  '160/110',
  'Recurrent headache',
  'Normal sinus',
  'Aug 14',
  'Aspirin',
  'Metformin',
];

const MEDICATION_EVENT: CareEvent = {
  id: 'med-event-1',
  kind: 'medication-started',
  category: 'clinical',
  at: '2026-02-10T08:30:00Z',
  label: 'Medication started: Lisinopril',
  source: { table: 'medication_events', column: 'at' },
  verification: 'clinician-verified',
};

const VISIT_EVENT: CareEvent = {
  id: 'visit-1',
  kind: 'visit',
  category: 'clinical',
  at: '2026-03-02T13:00:00Z',
  label: 'Cardiology consult',
  detail: 'Building A',
  source: { table: 'visits', column: 'scheduled_at' },
  verification: 'clinician-verified',
};

const RECORD_CREATED: CareEvent = {
  id: 'record-created',
  kind: 'record-created',
  category: 'lifecycle',
  at: '2025-05-12T08:00:00Z',
  label: 'Record created',
  source: { table: 'patients', column: 'created_at' },
  verification: 'system-generated',
};

function place(event: CareEvent, index: number): TimelineCardPlacement {
  return { event, leftPx: 24 + index * 240, topPx: index % 2 === 0 ? 72 : 210 };
}

function render(cards: ReadonlyArray<TimelineCardPlacement>): string {
  return renderToStaticMarkup(
    createElement(TimelineCards, { cards, onSelect: () => undefined }),
  );
}

function parse(markup: string): Document {
  return new DOMParser().parseFromString(markup, 'text/html');
}

describe('TimelineCards — real data only, wired controls (INV-08)', () => {
  it('renders card text from the real CareEvent values — zero invented figures', () => {
    const doc = parse(render([place(VISIT_EVENT, 0), place(MEDICATION_EVENT, 1)]));
    expect(doc.body.textContent).toContain('Cardiology consult');
    expect(doc.body.textContent).toContain('Building A');
    expect(doc.body.textContent).toContain('2026-03-02');
    expect(doc.body.textContent).toContain('Medication started: Lisinopril');
    for (const fabricated of FABRICATED_VALUES) {
      expect(doc.body.textContent).not.toContain(fabricated);
    }
  });

  it('renders zero cards when no event has a featured kind', () => {
    const RECORD_UPDATED: CareEvent = {
      id: 'a',
      kind: 'record-updated',
      category: 'lifecycle',
      at: '2026-06-01T00:00:00Z',
      label: 'Record updated',
      source: { table: 'patients', column: 'updated_at' },
      verification: 'system-generated',
    };
    expect(render([place(RECORD_UPDATED, 0)])).toBe('');
    // an empty record renders zero cards
    expect(render([])).toBe('');
  });

  it('renders medication events as the olive chip variant', () => {
    const doc = parse(render([place(MEDICATION_EVENT, 0)]));
    const button = doc.querySelector('button');
    expect(button).not.toBeNull();
    expect(button?.className).toContain('bg-olive-chip');
    expect(button?.getAttribute('type')).toBe('button');
  });

  it('exposes every card as a real accessible button — no decorative layer', () => {
    const doc = parse(render([place(VISIT_EVENT, 0), place(MEDICATION_EVENT, 1), place(RECORD_CREATED, 2)]));
    const buttons = Array.from(doc.querySelectorAll('button'));
    expect(buttons).toHaveLength(3);
    for (const button of buttons) {
      expect(button.getAttribute('type')).toBe('button');
      expect(button.getAttribute('aria-label')).toBeTruthy();
      // the drawn expand badge lives INSIDE the button, so it answers a click
      expect(button.querySelector('span')).not.toBeNull();
    }
  });

  it('is byte-stable across two static renders with the same events', () => {
    const cards = [place(VISIT_EVENT, 0), place(MEDICATION_EVENT, 1), place(RECORD_CREATED, 2)];
    expect(render(cards)).toBe(render(cards));
  });

  it('renders zero chart paths — no fabricated axis data in the card layer', () => {
    const markup = render([place(VISIT_EVENT, 0), place(MEDICATION_EVENT, 1)]);
    const doc = parse(markup);
    // the old illustration drew its area chart and ECG rhythm as fabricated
    // <path> marks; the real-data card layer draws only the expand-badge
    // glyph (the drawn arrow inside the wired button)
    const paths = Array.from(doc.querySelectorAll('path'));
    for (const path of paths) {
      expect(path.getAttribute('d')).toBe('M7 7l10 10M17 7v10H7');
    }
  });
});
