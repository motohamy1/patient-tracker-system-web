// Surface unit tests. Server-render based (react-dom/server + a parsed DOM):
// these primitives are Server Components, so static markup is the form they
// actually ship in, and every assertion here is about class strings, attribute
// values and element tags — all of which survive static markup intact. No
// @testing-library/* is installed and none is added (02-VALIDATION.md Wave 0).
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { Surface } from '@/components/primitives/Surface';

function render(element: ReactElement): Element {
  const parsed = new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
  const node = parsed.body.firstElementChild;
  if (!node) throw new Error('Surface rendered no element');
  return node;
}

const CASES = [
  { variant: 'canvas', expected: 'bg-canvas', role: 'page field' },
  {
    variant: 'surface',
    expected: 'bg-surface rounded-lg p-lg shadow-raised',
    role: 'default card',
  },
  {
    variant: 'surfaceMuted',
    expected: 'bg-surface-muted rounded-lg p-lg',
    role: 'inset panel, deliberately shadow-free',
  },
  {
    variant: 'surfaceRaised',
    expected: 'bg-surface-raised rounded-xl p-xl shadow-raised',
    role: 'elevated card',
  },
] as const;

describe('Surface — the four frozen variants (D-25)', () => {
  it.each(CASES)('renders $variant ($role) as exactly "$expected"', ({ variant, expected }) => {
    expect(render(<Surface variant={variant} />).getAttribute('class')).toBe(expected);
  });

  it('carries no shadow class on surfaceMuted (INV-13)', () => {
    expect(render(<Surface variant="surfaceMuted" />).getAttribute('class')).not.toContain('shadow-');
  });

  it('carries no perimeter edge class on any variant (INV-16)', () => {
    for (const { variant } of CASES) {
      const classAttribute = render(<Surface variant={variant} />).getAttribute('class') ?? '';
      expect(classAttribute, `${variant} must not be outlined`).not.toMatch(/(^|\s)(border|ring)-/);
    }
  });

  it('uses only the frozen elevation utilities across the card variants', () => {
    const shadowTokens = CASES.map(({ variant }) =>
      (render(<Surface variant={variant} />).getAttribute('class') ?? '')
        .split(/\s+/)
        .filter((name) => name.startsWith('shadow-')),
    );
    expect(shadowTokens).toEqual([[], ['shadow-raised'], [], ['shadow-raised']]);
  });
});

describe('Surface — composition', () => {
  it('renders the requested element tag through `as`', () => {
    expect(render(<Surface as="section" />).tagName).toBe('SECTION');
    expect(render(<Surface as="article" />).tagName).toBe('ARTICLE');
    expect(render(<Surface />).tagName).toBe('DIV');
  });

  it('merges a caller className last instead of replacing the variant classes', () => {
    const node = render(<Surface variant="surface" className="mt-lg" />);
    expect(node.getAttribute('class')).toBe('bg-surface rounded-lg p-lg shadow-raised mt-lg');
  });

  it('selects the sparse padding step with `size` and never pads the canvas field', () => {
    expect(render(<Surface variant="surface" size="xl" />).getAttribute('class')).toBe(
      'bg-surface rounded-lg p-xl shadow-raised',
    );
    expect(render(<Surface variant="canvas" size="xl" />).getAttribute('class')).toBe('bg-canvas');
  });
});
