// State-baseline unit proof (UX-01, 03-UI-SPEC §8.5): the skeleton shape
// (bg-surface-muted blocks at radius.md, no border, no third shadow, no
// animate-spin) and the error/retry EmptyState composition (exact §Copywriting
// strings, aria-busy while retrying, retry never blanks the state).
import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LoadingSkeleton } from '@/components/state/LoadingSkeleton';
import { StateVariant } from '@/components/state/StateVariant';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  motion: {
    button(props: Record<string, any>) {
      const { children, whileHover, whileTap, transition, ...rest } = props;
      return createElement('button', rest, children);
    },
  },
}));

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function classesOf(node: Element | null): string[] {
  if (!node) throw new Error('expected an element');
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

describe('LoadingSkeleton — UX-01 §8.5', () => {
  it('paints blocks with bg-surface-muted and radius.md, gap-lg apart', () => {
    const body = parse(<LoadingSkeleton />).body;
    const wrapperDiv = body.querySelector('div');
    expect(classesOf(wrapperDiv)).toContain('gap-lg');
    expect(classesOf(wrapperDiv)).toContain('flex');
  });

  it('every block is bg-surface-muted and rounded-md', () => {
    const doc = parse(<LoadingSkeleton />);
    const blocks = Array.from(doc.querySelectorAll('div > div'));
    expect(blocks.length).toBeGreaterThan(0);
    for (const block of blocks) {
      expect(classesOf(block)).toContain('bg-surface-muted');
      expect(classesOf(block)).toContain('rounded-md');
    }
  });

  it('carries no border class and no animate-spin class anywhere', () => {
    const doc = parse(<LoadingSkeleton bars={['sm', 'md', 'lg']} />);
    for (const node of Array.from(doc.querySelectorAll('*'))) {
      const classes = classesOf(node);
      expect(classes.some((name) => name.startsWith('border-'))).toBe(false);
      expect(classes.some((name) => /^animate-(spin|pulse)$/.test(name))).toBe(false);
    }
  });

  it('pulses via the skeleton-pulse CSS class, disabled under prefers-reduced-motion', () => {
    const markup = renderToStaticMarkup(<LoadingSkeleton />);
    expect(markup).toContain('skeleton-pulse');
    expect(markup).toContain('prefers-reduced-motion: reduce');
  });
});

describe('StateVariant — UX-01 §8.5 error/retry', () => {
  it("renders the exact §Copywriting title and body", () => {
    const doc = parse(<StateVariant surface="members" />);
    expect(doc.querySelector('h2')?.textContent).toBe("Couldn't load members");
    expect(doc.querySelector('p')?.textContent).toBe('Check your connection and try again.');
  });

  it('renders a secondary Try again action', () => {
    const action = parse(<StateVariant surface="members" />).querySelector('button');
    expect(action?.textContent).toBe('Try again');
    expect(classesOf(action)).toContain('bg-surface-raised');
  });

  it('keeps the EmptyState rendered and flags the button aria-busy while retrying', () => {
    const doc = parse(<StateVariant surface="members" retrying />);
    expect(doc.querySelector('h2')).not.toBeNull();
    const action = doc.querySelector('button');
    expect(action?.getAttribute('aria-busy')).toBe('true');
  });

  it('omits aria-busy when not retrying', () => {
    const doc = parse(<StateVariant surface="members" />);
    expect(doc.querySelector('button')?.getAttribute('aria-busy')).toBeNull();
  });
});
