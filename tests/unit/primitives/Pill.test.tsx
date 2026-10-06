// Pill unit tests. Server-render based (react-dom/server + a parsed DOM): the
// Pill is a Server Component, so static markup is the form it ships in. Every
// assertion is about class strings, attributes and text content, all of which
// survive static markup intact. No @testing-library/* is installed.
//
// What is NOT automated here: the rendered contrast ratio of the label ink
// against the fill. jsdom computes no color, so that row stays a reviewer check
// against docs/governance/visual-qa-rules.md. What IS automated is the
// machine-checkable half of "color is never the only channel": the tone class
// appears only on the decorative dot, and the neutral form renders no dot at
// all, so the meaning survives with every tint removed (§4.3, INV-04).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { Pill } from '@/components/primitives/Pill';

function render(element: ReactElement): Element {
  const parsed = new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
  const node = parsed.body.firstElementChild;
  if (!node) throw new Error('Pill rendered no element');
  return node;
}

function classesOf(node: Element): string[] {
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

const TONED = ['success', 'info', 'warning'] as const;

describe('Pill — a tone paints only the dot, never the label (INV-04, §4.3)', () => {
  it.each(TONED)('paints %s as a muted chip with textPrimary ink and no shadow', (tone) => {
    const node = render(<Pill tone={tone} label="Stable" />);
    const classes = classesOf(node);
    expect(classes).toContain('bg-surface-muted');
    expect(classes).toContain('text-text-primary');
    expect(classes).toContain('rounded-pill');
    expect(classes.filter((name) => name.startsWith('shadow-'))).toEqual([]);
  });

  it.each(TONED)('renders the %s tone class on the dot only', (tone) => {
    const node = render(<Pill tone={tone} label="Stable" />);
    const dot = node.querySelector('span');
    expect(dot).not.toBeNull();
    expect(classesOf(dot as Element)).toContain(`bg-${tone}`);

    // The tone appears exactly once in the whole subtree — on the dot.
    const occurrences = node.outerHTML.match(new RegExp(`bg-${tone}`, 'g')) ?? [];
    expect(occurrences).toHaveLength(1);
    expect(classesOf(node)).not.toContain(`bg-${tone}`);
  });

  it('never paints a tone as the label ink', () => {
    for (const tone of TONED) {
      expect(render(<Pill tone={tone} label="Stable" />).outerHTML).not.toMatch(
        /text-(success|info|warning)/,
      );
    }
  });
});

describe('Pill — the tint-removed specimen still reads as a status', () => {
  it('renders the neutral form with no dot element at all', () => {
    const node = render(<Pill tone="neutral" label="Not recorded" />);
    expect(node.querySelector('span')).toBeNull();
  });

  it('keeps the label text in the accessible tree with the tone removed', () => {
    const node = render(<Pill tone="neutral" label="Not recorded" />);
    expect(node.textContent).toBe('Not recorded');
    expect(classesOf(node)).toContain('text-text-primary');
  });
});
