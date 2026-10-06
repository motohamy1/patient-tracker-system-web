// Button unit tests. `motion/react` is mocked at the module boundary so the
// assertions read the props the component actually passes (`whileHover`,
// `whileTap`, `transition`) rather than reaching into internal structure; the
// mock renders a real <button> so every class and attribute assertion stays a
// DOM assertion on static markup.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { X } from 'lucide-react';
import { MOTION } from '@/styles/tokens.generated';
import { Button } from '@/components/primitives/Button';

type CapturedMotion = {
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
  transition?: Record<string, unknown>;
};

const harness = vi.hoisted(() => ({
  reducedMotion: false,
  captured: null as CapturedMotion | null,
}));

vi.mock('motion/react', () => ({
  useReducedMotion: () => harness.reducedMotion,
  motion: {
    button(props: Record<string, any>) {
      const { children, whileHover, whileTap, transition, ...rest } = props;
      harness.captured = { whileHover, whileTap, transition };
      return createElement('button', rest, children);
    },
  },
}));

function render(element: ReactElement): HTMLButtonElement {
  const parsed = new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
  const node = parsed.body.querySelector('button');
  if (!node) throw new Error('Button rendered no <button>');
  return node;
}

function classNamesOf(node: Element): string[] {
  const attribute = node.getAttribute('class') ?? '';
  const names = attribute.split(/\s+/).filter(Boolean);
  if (names.length === 0) throw new Error('Button rendered no classes');
  return names;
}

beforeEach(() => {
  harness.reducedMotion = false;
  harness.captured = null;
});

describe('Button — the four variants (INV-08, INV-05)', () => {
  it('paints primary with accentSoft and never with the raw accent token', () => {
    const classes = classNamesOf(render(<Button variant="primary">Add new patient</Button>));
    expect(classes).toContain('bg-accent-soft');
    expect(classes).not.toContain('bg-accent');
    expect(classes).toContain('text-text-primary');
    expect(classes).toContain('rounded-pill');
    expect(classes).toContain('px-xl');
    expect(classes).not.toContain('shadow-raised');
  });

  it('paints secondary on surfaceRaised with the raised elevation', () => {
    const classes = classNamesOf(render(<Button variant="secondary">Cancel</Button>));
    expect(classes).toContain('bg-surface-raised');
    expect(classes).toContain('text-text-primary');
    expect(classes).toContain('rounded-pill');
    expect(classes).toContain('shadow-raised');
    expect(classes).toContain('px-xl');
  });

  it('paints ghost with no fill, no shadow and the tighter padding step', () => {
    const classes = classNamesOf(render(<Button variant="ghost">Back</Button>));
    expect(classes).toContain('text-text-primary');
    expect(classes).toContain('rounded-pill');
    expect(classes).toContain('px-md');
    expect(classes).not.toContain('shadow-raised');
    expect(classes.filter((name) => name.startsWith('bg-'))).toEqual([]);
  });

  it('paints iconOnly as a raised square carrying an accessible name', () => {
    const button = render(<Button variant="iconOnly" ariaLabel="Close panel" icon={X} />);
    const classes = classNamesOf(button);
    expect(classes).toContain('bg-surface-raised');
    expect(classes).toContain('text-text-primary');
    expect(classes).toContain('rounded-pill');
    expect(classes).toContain('shadow-raised');
    expect(button.getAttribute('aria-label')).toBe('Close panel');
  });

  it('paints every variant with textPrimary and never a secondary or status tint as ink', () => {
    const specimens = [
      render(<Button variant="primary">Primary</Button>),
      render(<Button variant="secondary">Secondary</Button>),
      render(<Button variant="ghost">Ghost</Button>),
      render(<Button variant="iconOnly" ariaLabel="Close panel" icon={X} />),
    ];
    for (const button of specimens) {
      const classes = classNamesOf(button);
      expect(classes).toContain('text-text-primary');
      const tinted = classes.filter((name) =>
        /^text-(text-secondary|frame-foreground|success|warning|critical|info)$/.test(name),
      );
      expect(tinted).toEqual([]);
    }
  });
});

describe('Button — accessible name and touch-target contract (UX-06)', () => {
  it('makes the accessible name mandatory on iconOnly and omits it elsewhere', () => {
    // @ts-expect-error ariaLabel is required when variant is 'iconOnly' (T-02-29).
    const unlabeled = <Button variant="iconOnly" />;
    expect(unlabeled).toBeTruthy();

    const labelled = render(<Button variant="iconOnly" ariaLabel="Close panel" icon={X} />);
    expect(labelled.getAttribute('aria-label')).not.toBe('');

    const text = render(<Button variant="primary">Add new patient</Button>);
    expect(text.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps a 44px target in both axes below 768px and shrinks only text buttons at md', () => {
    const text = classNamesOf(render(<Button variant="primary">Add new patient</Button>));
    expect(text).toContain('min-h-11');
    expect(text).toContain('md:min-h-8');

    const iconOnly = classNamesOf(
      render(<Button variant="iconOnly" ariaLabel="Close panel" icon={X} />),
    );
    expect(iconOnly).toContain('min-h-11');
    expect(iconOnly).toContain('min-w-11');
    expect(iconOnly).not.toContain('md:min-h-8');
  });

  it('disables with reduced opacity, no shadow and the native disabled attribute', () => {
    const disabledButton = render(
      <Button variant="secondary" disabled ariaLabel="Disabled action">
        Disabled
      </Button>,
    );
    const disabledClasses = classNamesOf(disabledButton);
    expect(disabledButton.hasAttribute('disabled')).toBe(true);
    expect(disabledClasses).toContain('opacity-60');
    expect(disabledClasses).toContain('cursor-not-allowed');
    expect(disabledClasses.filter((name) => name.startsWith('shadow-'))).toEqual([]);

    const enabledButton = render(
      <Button variant="secondary" ariaLabel="Enabled action">
        Enabled
      </Button>,
    );
    expect(enabledButton.hasAttribute('disabled')).toBe(false);
    expect(classNamesOf(enabledButton)).toContain('shadow-raised');
  });
});

describe('Button — motion contract (FOUND-05, motion-rules.md §3)', () => {
  it('runs the normal branch at the slower tokenized duration with a tap transform', () => {
    render(<Button variant="primary">Add new patient</Button>);
    const captured = harness.captured;
    expect(captured?.transition?.duration).toBe(MOTION.duration.slowSec);
    expect(Object.keys(captured?.whileTap ?? {})).toContain('scale');
  });

  it('degrades to an opacity-only transition at the fastest duration under reduced motion', () => {
    harness.reducedMotion = true;
    render(<Button variant="primary">Add new patient</Button>);
    const captured = harness.captured;
    expect(captured?.transition?.duration).toBe(MOTION.duration.fastSec);
    expect(captured?.transition?.duration).toBeLessThanOrEqual(MOTION.duration.slowSec);
    expect(Object.keys(captured?.whileTap ?? {})).toEqual(['opacity']);
    expect(Object.keys(captured?.whileHover ?? {})).toEqual(['opacity']);
  });
});
