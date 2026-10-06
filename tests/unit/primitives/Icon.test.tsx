// Icon unit tests. The stroke width is read from the rendered DOM node, never
// from the source text, so a wrapper that stopped emitting it fails here.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Menu } from 'lucide-react';
import { makeIcon } from '@/components/primitives/Icon';

const Glyph = makeIcon(Menu);

function render(html: string): Element {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const node = parsed.body.firstElementChild;
  if (!node) throw new Error('Icon rendered no element');
  return node;
}

describe('Icon — the single 1.5px stroke wrapper (D-21)', () => {
  it('renders a stroke width of exactly 1.5 on the SVG node', () => {
    const svg = render(renderToStaticMarkup(<Glyph />));
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg.getAttribute('stroke-width')).toBe('1.5');
  });

  it('keeps 1.5 even when a call site forces a different value (stroke set after the spread)', () => {
    // The type omits `strokeWidth`, so this line is only reachable with the
    // suppression below — it proves the runtime ordering, not a public prop.
    // @ts-expect-error strokeWidth is omitted from the public props type (T-02-28).
    const forced = renderToStaticMarkup(<Glyph strokeWidth={2} />);
    expect(render(forced).getAttribute('stroke-width')).toBe('1.5');
  });

  it('is decorative by default and opts out when a label supplies a name', () => {
    const decorative = render(renderToStaticMarkup(<Glyph />));
    expect(decorative.getAttribute('aria-hidden')).toBe('true');
    expect(decorative.hasAttribute('aria-label')).toBe(false);

    const labelled = render(renderToStaticMarkup(<Glyph aria-label="Open menu" />));
    expect(labelled.getAttribute('aria-label')).toBe('Open menu');
    expect(labelled.hasAttribute('aria-hidden')).toBe(false);
  });

  it('defaults to the 16px step and renders the 24px step', () => {
    const small = render(renderToStaticMarkup(<Glyph />));
    expect(small.getAttribute('width')).toBe('16');
    expect(small.getAttribute('height')).toBe('16');

    const large = render(renderToStaticMarkup(<Glyph size="lg" />));
    expect(large.getAttribute('width')).toBe('24');
    expect(large.getAttribute('height')).toBe('24');
  });
});
