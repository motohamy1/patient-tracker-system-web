// EmptyState unit tests. Server-render based (react-dom/server + a parsed DOM):
// the primitive is a Server Component, so static markup is the form it ships
// in. `motion/react` is mocked at the module boundary exactly as
// tests/unit/primitives/Button.test.tsx does, so the action `Button` renders as
// a real <button> and every assertion is a DOM assertion on static markup.
//
// The absence assertions (body and action) are asserted positively — a null
// query result — rather than by "the render did not throw". What is NOT
// automated here: the rendered contrast of the ink against the raised fill
// (jsdom computes no color), which stays a reviewer row against
// docs/governance/visual-qa-rules.md §1.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';

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

function wrapperOf(element: ReactElement): Element {
  const node = parse(element).body.firstElementChild;
  if (!node) throw new Error('EmptyState rendered no wrapper');
  return node;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EmptyState — slot composition (D-24, 02-UI-SPEC.md §5.5)', () => {
  it('wraps in the surfaceRaised fill with the raised elevation and xl radius', () => {
    const wrapper = wrapperOf(<EmptyState title="No patients yet" />);
    const classes = classesOf(wrapper);
    expect(classes).toContain('bg-surface-raised');
    expect(classes).toContain('shadow-raised');
    expect(classes).toContain('rounded-xl');
    expect(classes).toContain('p-xl');
    expect(classes).toContain('mx-auto');
  });

  it('paints the title with the heading step, semibold weight and textPrimary ink', () => {
    const title = parse(<EmptyState title="No patients yet" />).querySelector('h2');
    const classes = classesOf(title);
    expect(classes).toContain('text-heading');
    expect(classes).toContain('font-semibold');
    expect(classes).toContain('leading-heading');
    expect(classes).toContain('text-text-primary');
  });

  it('omits the body element entirely when no body string is supplied', () => {
    expect(parse(<EmptyState title="No patients yet" />).querySelector('p')).toBeNull();
  });

  it('renders the body with the body step and textPrimary ink when supplied', () => {
    const body = parse(
      <EmptyState title="No patients yet" body="Patient folders appear here once added." />,
    ).querySelector('p');
    const classes = classesOf(body);
    expect(classes).toContain('text-body');
    expect(classes).toContain('font-regular');
    expect(classes).toContain('leading-body');
    expect(classes).toContain('text-text-primary');
  });

  it('omits the action slot entirely when no action is supplied', () => {
    const doc = parse(<EmptyState title="No patients yet" />);
    expect(doc.querySelector('button')).toBeNull();
    expect(doc.querySelector('a')).toBeNull();
  });

  it('renders a secondary button when an action without href is supplied', () => {
    const action = parse(
      <EmptyState title="No patients yet" action={{ label: 'Add new patient' }} />,
    ).querySelector('button');
    const classes = classesOf(action);
    expect(classes).toContain('bg-surface-raised');
    expect(classes).toContain('rounded-pill');
    expect(classes).toContain('shadow-raised');
    expect(classes).toContain('text-text-primary');
    expect(action?.textContent).toBe('Add new patient');
  });

  it('renders a link when the action carries an href', () => {
    const link = parse(
      <EmptyState title="No patients yet" action={{ label: 'Add new patient', href: '/x' }} />,
    ).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/x');
    expect(classesOf(link)).toContain('bg-surface-raised');
  });

  it('renders the 24px icon when supplied and omits it otherwise', () => {
    const withIcon = parse(<EmptyState icon={Inbox} title="No patients yet" />);
    const svg = withIcon.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');

    expect(parse(<EmptyState title="No patients yet" />).querySelector('svg')).toBeNull();
  });
});

describe('EmptyState — the empty variant carries no loading affordance and no status tint', () => {
  it('emits no spinner, skeleton or progress class anywhere in the markup', () => {
    const doc = parse(
      <EmptyState
        icon={Inbox}
        title="No patients yet"
        body="Patient folders appear here once added."
        action={{ label: 'Add new patient' }}
      />,
    );
    for (const node of Array.from(doc.querySelectorAll('*'))) {
      const classes = classesOf(node);
      expect(classes.some((name) => /animate-spin|skeleton|spinner|loading|progress/.test(name))).toBe(
        false,
      );
      expect(classes.some((name) => /^(text|bg)-(success|info|warning|critical)$/.test(name))).toBe(
        false,
      );
      expect(classes.some((name) => name.startsWith('border-'))).toBe(false);
    }
  });
});
