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
    // the cluster's count sits in a chartreuse badge on the disc's shoulder
    // (the reference's dense-zoom mark) — never painted with the reserved accent
    const cluster = doc.querySelector('g[data-role="node"][data-count="2"]');
    const badge = cluster?.querySelector('g circle.fill-marker');
    expect(badge).not.toBeNull();
    expect(badge?.parentElement?.querySelector('text')?.textContent).toBe('2');
    // the reserved accent appears nowhere in the band (INV-05)
    expect(doc.querySelector('.fill-accent')).toBeNull();
    // the individual mark is a MILESTONE (record-created is a milestone kind),
    // so it carries the reference's chartreuse disc and ink document glyph
    const individual = marks[0].querySelector('circle');
    expect(individual?.getAttribute('class')).toContain('fill-marker');
    expect(individual?.getAttribute('class')).toContain('stroke-timeline-ink');
  });

  it('renders the reference lattice: full-height month dividers + the ink axis', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    const doc = renderBand(events);
    // the month dividers are the only `timelineGrid` rules in the band
    const dividers = Array.from(doc.querySelectorAll('line')).filter((line) =>
      line.getAttribute('class')?.includes('timeline-grid'),
    );
    expect(dividers.length).toBeGreaterThan(0);
    for (const line of dividers) {
      expect(line.getAttribute('stroke-width')).toBe('1');
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

  it('keeps the frame: the band is the canvas field, separated by shadow and radius only', () => {
    const markup = renderToStaticMarkup(
      createElement(TimelineBand, { events: projectCareEvents(PATIENT, INVITES) }),
    );
    // the reference band is the SAME fill as the page — no third elevation and
    // no recessed panel, only the two soft shadows and the rounded silhouette
    expect(markup).toContain('bg-canvas');
    expect(markup).toContain('rounded-card');
    expect(markup).toContain('shadow-band-inner');
    expect(markup).toContain('shadow-band-edge');
    expect(markup).not.toContain('bg-surface-muted');
    // no Tailwind border UTILITY (INV-15/INV-16 — a perimeter edge never
    // appears; match class-list positions so `stroke-border-subtle` cannot
    // false-positive)
    expect(markup).not.toMatch(/[\s"']border-[a-z]/);
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

  it('clusters dense stretches into a count badge on the disc shoulder (INV-05 reserved list)', () => {
    const doc = renderTimeline(ZOOM_EVENTS);
    const cluster = doc.querySelector('g[data-role="node"][data-count="5"]');
    expect(cluster).not.toBeNull();
    const badge = cluster?.querySelector('g circle.fill-marker');
    expect(badge).not.toBeNull();
    // the count sits in the badge, dead-centred by BOTH anchors
    const count = badge?.parentElement?.querySelector('text');
    expect(count?.textContent).toBe('5');
    expect(count?.getAttribute('text-anchor')).toBe('middle');
    expect(count?.getAttribute('dominant-baseline')).toBe('central');
    expect(count?.getAttribute('x')).toBe('0');
    expect(count?.getAttribute('y')).toBe('0');
    // the reserved accent never appears anywhere in the band (INV-05)
    expect(doc.querySelector('.fill-accent')).toBeNull();
  });

  it('keeps the axis ink stroke at the reference weight (INV-05 reserved list)', () => {
    const zoomed = renderToStaticMarkup(
      createElement(ClinicalTimeline, { events: ZOOM_EVENTS, initialTransform: { k: 4, tx: -120 } }),
    );
    const axisMatch = zoomed.match(/<line x1="0" x2="1024"[^>]*stroke-timeline-ink[^>]*>/);
    expect(axisMatch).not.toBeNull();
    // the reference draws the axis at 1.4px in `timelineInk`, not as an accent
    expect(axisMatch![0]).toContain('stroke-width="1.4"');
    expect(axisMatch![0]).not.toMatch(/accent/);
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
    // every mark is one node rim or one cluster disc + its badge — never an
    // unbounded pile of circles
    for (const mark of marks) {
      expect(mark.querySelectorAll('circle').length).toBeLessThanOrEqual(2);
    }
  });
});
