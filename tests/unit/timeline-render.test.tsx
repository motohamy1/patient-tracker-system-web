// tests/unit/timeline-render.test.tsx — the timeline's rendered grammar
// (TL-01/TL-02; ticket 06-01; reference §5 axis language; INV-15/INV-16).
//
// jsdom has no ResizeObserver, so the band renders at its first-paint width
// (the desktop content width) — which makes the markup fully deterministic:
// node counts, tick labels and geometry can be asserted rather than eyeballed.
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TimelineBand } from '@/components/workspace/TimelineBand';
import { projectCareEvents } from '@/lib/timeline/events';
import { ClinicalTimeline } from '@/components/timeline/ClinicalTimeline';
import { frameX } from '@/lib/timeline/zoom';
import type { CareEvent } from '@/lib/timeline/events';

const PATIENT = {
  id: '11111111-1111-4111-8111-111111111111',
  createdAt: '2025-05-12T08:00:00Z',
  updatedAt: '2026-10-06T09:30:00Z',
};

const INVITES = [{ id: 'inv-1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null }];

function renderBand(events: Parameters<typeof TimelineBand>[0]['events']): Document {
  const markup = renderToStaticMarkup(createElement(TimelineBand, { events }));
  return new DOMParser().parseFromString(markup, 'text/html');
}

describe('ClinicalTimeline — real nodes on a real axis', () => {
  it('renders one mark per real event-or-cluster — nothing fabricated', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    const doc = renderBand(events);
    const marks = doc.querySelectorAll('g[data-role="node"]');
    // 3 real events, two of them inside one quarter → 2 marks (1 + cluster of 2)
    expect(marks).toHaveLength(2);
    expect(Array.from(marks).map((m) => m.getAttribute('data-count'))).toEqual(['1', '2']);
    // the cluster badge carries the count in the accent family (INV-05 list)
    expect(doc.querySelector('circle.fill-accent')).not.toBeNull();
    // individual nodes are token-painted, no accent (reserved list, INV-05)
    const individual = marks[0].querySelector('circle');
    expect(individual?.getAttribute('class')).toContain('fill-surface');
    expect(individual?.getAttribute('class')).toContain('stroke-text-primary');
  });

  it('renders the reference lattice: 1px hairline axis + month dividers + labels', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    const doc = renderBand(events);
    const lines = Array.from(doc.querySelectorAll('line'));
    for (const line of lines) {
      expect(line.getAttribute('stroke-width')).toBe('1');
      expect(line.getAttribute('class')).toBe('stroke-border-subtle');
    }
    const labels = Array.from(doc.querySelectorAll('text')).map((t) => t.textContent);
    expect(labels).toContain('Jun');
    expect(labels).toContain('Oct');
    expect(labels).toContain('2026');
    // no clinical vocabulary is invented where the schema has no data
    expect(labels.join(' ')).not.toMatch(/Visit|Medication|Lab|Imaging/);
  });

  it('names the timeline for assistive tech with a real summary', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    const doc = renderBand(events);
    const svg = doc.querySelector('svg');
    // `group`, not `img`: the timeline now exposes interactive event nodes to
    // assistive tech (06-06), and an `img` role would hide them.
    expect(svg?.getAttribute('role')).toBe('group');
    expect(svg?.getAttribute('aria-label')).toBe(
      'Timeline with 3 events, 2025-05-12 to 2026-10-06, 1 cluster in view',
    );
  });

  it('states the empty timeline honestly (no event, no axis)', () => {
    const doc = renderBand([]);
    expect(doc.querySelector('svg')).toBeNull();
    expect(doc.body.textContent).toContain('No timeline events yet');
    expect(doc.body.textContent).toContain('Visits, medications and results will appear here as care progresses.');
    expect(doc.body.textContent).toContain('Document a visit to place the first event.');
  });

  it('keeps the frame: recessed fill, no border, raised-on-canvas separation', () => {
    const markup = renderToStaticMarkup(
      createElement(TimelineBand, { events: projectCareEvents(PATIENT, INVITES) }),
    );
    expect(markup).toContain('bg-surface-muted');
    // no Tailwind border UTILITY (a stroke token is not a border — match
    // class-list positions, so `stroke-border-subtle` cannot false-positive)
    expect(markup).not.toMatch(/[\s"']border-[a-z]/);
    expect(markup).not.toContain('scrubber');
    expect(markup).toContain('<h2');
  });
});

// ── ticket 06-02: the zoom layer ────────────────────────────────────────────

const ZOOM_EVENTS: CareEvent[] = [
  { id: 'a', kind: 'record-created', category: 'lifecycle', at: '2025-05-12T08:00:00Z', label: 'Record created', source: { table: 'patients', column: 'created_at' }, verification: 'system-generated' },
  { id: 'b', kind: 'record-updated', category: 'lifecycle', at: '2026-09-03T09:00:00Z', label: 'Record updated', source: { table: 'patients', column: 'updated_at' }, verification: 'system-generated' },
  { id: 'c', kind: 'record-updated', category: 'lifecycle', at: '2026-09-03T10:00:00Z', label: 'Record updated', source: { table: 'patients', column: 'updated_at' }, verification: 'system-generated' },
  { id: 'd', kind: 'record-updated', category: 'lifecycle', at: '2026-09-03T11:00:00Z', label: 'Record updated', source: { table: 'patients', column: 'updated_at' }, verification: 'system-generated' },
  { id: 'e', kind: 'record-updated', category: 'lifecycle', at: '2026-09-03T12:00:00Z', label: 'Record updated', source: { table: 'patients', column: 'updated_at' }, verification: 'system-generated' },
  { id: 'f', kind: 'record-updated', category: 'lifecycle', at: '2026-10-06T09:30:00Z', label: 'Record updated', source: { table: 'patients', column: 'updated_at' }, verification: 'system-generated' },
];

function renderTimeline(events: readonly CareEvent[], initialTransform?: { k: number; tx: number }): Document {
  const markup = renderToStaticMarkup(
    createElement(ClinicalTimeline, { events, initialTransform }),
  );
  return new DOMParser().parseFromString(markup, 'text/html');
}

describe('ClinicalTimeline — the zoom layer (TL-03/TL-04)', () => {
  it('positions every mark at k * baseX + tx — translate only, never scale', () => {
    const transform = { k: 2, tx: -40 };
    const doc = renderTimeline(ZOOM_EVENTS, transform);
    const marks = Array.from(
      doc.querySelectorAll<SVGGElement>('g[data-base-x]'),
    );
    expect(marks.length).toBeGreaterThan(0);
    for (const mark of marks) {
      const baseX = Number(mark.dataset.baseX);
      const expected = `translate(${frameX(transform.k, transform.tx, baseX)},0)`;
      expect(mark.getAttribute('transform')).toBe(expected);
      // nothing in the scene scales — no CTM trickery anywhere
      expect(mark.getAttribute('transform')).not.toContain('scale');
    }
    // circles stay circles: no rx/ry, no scale on the marks
    expect(doc.querySelector('svg')?.outerHTML).not.toContain('scale(');
  });

  it('clusters dense stretches into an accent count badge (INV-05 reserved list)', () => {
    const doc = renderTimeline(ZOOM_EVENTS);
    const badge = doc.querySelector('circle.fill-accent');
    expect(badge).not.toBeNull();
    const badgeGroup = badge?.closest('g');
    const count = badgeGroup?.querySelector('text');
    expect(count?.textContent).toBe('5');
    // the count text is dead-centered on the badge by BOTH anchors
    expect(count?.getAttribute('text-anchor')).toBe('middle');
    expect(count?.getAttribute('dominant-baseline')).toBe('central');
    expect(count?.getAttribute('x')).toBe('0');
    expect(count?.getAttribute('y')).toBe(badge?.getAttribute('cy'));
  });

  it('keeps the axis hairline fixed at 1px regardless of zoom', () => {
    const zoomed = renderToStaticMarkup(
      createElement(ClinicalTimeline, { events: ZOOM_EVENTS, initialTransform: { k: 4, tx: -120 } }),
    );
    const axisMatch = zoomed.match(/<line x1="0" x2="1024"[^>]*>/);
    expect(axisMatch).not.toBeNull();
    expect(axisMatch![0]).toContain('stroke-width="1"');
    expect(axisMatch![0]).toContain('stroke-border-subtle');
  });

  it('reports the real range and cluster count in its accessible name', () => {
    const doc = renderTimeline(ZOOM_EVENTS);
    const label = doc.querySelector('svg')?.getAttribute('aria-label');
    expect(label).toBe('Timeline with 6 events, 2025-05-12 to 2026-10-06, 1 cluster in view');
  });

  it('keeps the mark count bounded at deep zoom (TL-09)', () => {
    const dense: CareEvent[] = Array.from({ length: 500 }, (_, i) => ({
      id: `d-${i}`,
      kind: 'record-updated',
      category: 'lifecycle',
      at: new Date(new Date('2026-01-01T00:00:00Z').getTime() + i * 3_600_000).toISOString(),
      label: 'Record updated',
      source: { table: 'patients', column: 'updated_at' },
      verification: 'system-generated',
    }));
    const doc = renderTimeline(dense);
    // 500 events, one per hour, ~21 days visible at base zoom → week buckets
    const marks = doc.querySelectorAll('g[data-role="node"]');
    expect(marks.length).toBeLessThan(80);
    // every mark carries exactly one circle (node rim or cluster badge)
    for (const mark of marks) {
      expect(mark.querySelectorAll('circle')).toHaveLength(1);
    }
  });
});
