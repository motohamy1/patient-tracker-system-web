// CompactControl unit tests. Server-render based (react-dom/server + a parsed
// DOM): the control is a Server Component, so static markup is the form it
// ships in.
//
// What is NOT automated here: the rendered contrast ratio of the placeholder ink
// against the fill (jsdom computes no color, so that row stays a reviewer check
// against docs/governance/visual-qa-rules.md) and the rendered touch-target size
// (jsdom computes no layout — the 44px minimum is asserted only as the
// `min-h-11` / `min-w-11` class the contract prescribes, never as a measured
// pixel). Writing a test that appeared to prove either would be worse than
// leaving the row to the reviewer.
//
// The expected inset fill is DERIVED from docs/governance/tokens.json →
// review.gateStatus rather than restated, and the exported INSET_FILL constant
// is asserted against that derivation, so re-opening the D-27 gate cannot leave
// a stale expectation in this file.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { Bell } from 'lucide-react';
import { CompactControl, INSET_FILL } from '@/components/primitives/CompactControl';
import { TabBar } from '@/components/primitives/TabBar';

const TOKENS = JSON.parse(
  readFileSync(path.join(process.cwd(), 'docs', 'governance', 'tokens.json'), 'utf8'),
);
const GATE_STATUS: string = TOKENS.review.gateStatus;
const EXPECTED_INSET =
  GATE_STATUS === 'reopened-rejected' ? 'bg-surface-raised shadow-raised' : 'bg-surface-muted';

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function classesOf(node: Element | null): string[] {
  if (!node) throw new Error('expected an element');
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

function firstElement(doc: Document): Element {
  const node = doc.body.firstElementChild;
  if (!node) throw new Error('CompactControl rendered no element');
  return node;
}

describe('CompactControl — the gate-selected inset fill (T-02-39)', () => {
  it('exports the fill the gate status selects', () => {
    expect(INSET_FILL).toBe(EXPECTED_INSET);
  });

  it('resolves the search wrapper and the TabBar container to the same INSET_FILL', () => {
    const searchWrapper = parse(
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="search-1"
        placeholder="Search patients"
      />,
    ).querySelector('div');
    const tabContainer = firstElement(
      parse(<TabBar items={[{ value: 'home', label: 'Home' }]} value="home" ariaLabel="Tabs" />),
    );
    for (const cls of EXPECTED_INSET.split(/\s+/)) {
      expect(classesOf(searchWrapper)).toContain(cls);
      expect(classesOf(tabContainer)).toContain(cls);
    }
  });
});

describe('CompactControl — search', () => {
  it('renders a native search input with a programmatic label', () => {
    const doc = parse(
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="search-1"
        placeholder="Search patients"
      />,
    );
    const input = doc.querySelector('input');
    expect(input?.getAttribute('type')).toBe('search');
    expect(doc.querySelector('label[for="search-1"]')?.textContent).toBe('Search patients');
  });

  it('uses the inset fill, the pill radius and the two band heights with no border', () => {
    const doc = parse(
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="search-1"
        placeholder="Search patients"
      />,
    );
    const wrapper = classesOf(doc.querySelector('div'));
    expect(wrapper).toContain('rounded-pill');
    expect(wrapper).toContain('min-h-11');
    expect(wrapper).toContain('md:min-h-8');
    expect(wrapper).toContain('px-lg');
    expect(wrapper).toContain('text-text-primary');
    for (const cls of EXPECTED_INSET.split(/\s+/)) expect(wrapper).toContain(cls);
    expect(wrapper.some((name) => name.startsWith('border-'))).toBe(false);
  });
});

describe('CompactControl — iconToggle', () => {
  it('requires an accessible name and marks the pressed state', () => {
    const button = firstElement(
      parse(
        <CompactControl variant="iconToggle" ariaLabel="Toggle notifications" pressed={false} icon={Bell} />,
      ),
    );
    expect(button.getAttribute('aria-label')).toBe('Toggle notifications');
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('carries the raised fill and shadow only in the on state', () => {
    const off = classesOf(
      firstElement(
        parse(
          <CompactControl variant="iconToggle" ariaLabel="Toggle notifications" pressed={false} icon={Bell} />,
        ),
      ),
    );
    expect(off).toContain('min-h-11');
    expect(off).toContain('min-w-11');
    expect(off.filter((name) => name.startsWith('shadow-'))).toEqual([]);

    const on = classesOf(
      firstElement(
        parse(
          <CompactControl variant="iconToggle" ariaLabel="Toggle notifications" pressed icon={Bell} />,
        ),
      ),
    );
    expect(on).toContain('bg-surface-raised');
    expect(on).toContain('shadow-raised');
  });
});

describe('CompactControl — rangeToggle', () => {
  it('is transparent and shadow-free when inactive and raised when active', () => {
    const inactive = classesOf(
      firstElement(
        parse(<CompactControl variant="rangeToggle" ariaLabel="Range" label="Month" active={false} />),
      ),
    );
    expect(inactive).toContain('bg-transparent');
    expect(inactive).not.toContain('bg-surface-raised');
    expect(inactive.filter((name) => name.startsWith('shadow-'))).toEqual([]);

    const active = classesOf(
      firstElement(
        parse(<CompactControl variant="rangeToggle" ariaLabel="Range" label="Month" active />),
      ),
    );
    expect(active).toContain('bg-surface-raised');
    expect(active).toContain('shadow-raised');
  });
});

describe('CompactControl — no compact control renders a border (INV-15)', () => {
  it('emits no border-prefixed class on any rendered element of any variant', () => {
    const documents = [
      parse(
        <CompactControl
          variant="search"
          label="Search patients"
          inputId="search-1"
          placeholder="Search patients"
        />,
      ),
      parse(
        <CompactControl variant="iconToggle" ariaLabel="Toggle notifications" pressed={false} icon={Bell} />,
      ),
      parse(<CompactControl variant="rangeToggle" ariaLabel="Range" label="Month" active={false} />),
    ];
    for (const doc of documents) {
      for (const node of Array.from(doc.querySelectorAll('*'))) {
        expect(classesOf(node).some((name) => name.startsWith('border-'))).toBe(false);
      }
    }
  });
});
