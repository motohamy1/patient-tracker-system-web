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
  it('renders exactly one node per projected event — nothing fabricated', () => {
    const events = projectCareEvents(PATIENT, INVITES);
    const doc = renderBand(events);
    const nodes = doc.querySelectorAll('circle');
    expect(nodes).toHaveLength(events.length);
    // nodes are token-painted, no accent yet (reserved list, INV-05)
    for (const node of nodes) {
      expect(node.getAttribute('class')).toContain('fill-surface');
      expect(node.getAttribute('class')).toContain('stroke-text-primary');
      expect(node.getAttribute('class') ?? '').not.toContain('accent');
    }
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
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('Timeline with 3 events, 2025-05-12 to 2026-10-06');
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
