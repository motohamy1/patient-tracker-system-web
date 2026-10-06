// TabBar unit tests. Server-render based (react-dom/server + a parsed DOM): the
// TabBar is a Server Component, so static markup is the form it ships in.
//
// The load-bearing assertions: exactly eight canonical tabs by accessible name,
// the same ink on the active and inactive items (active state is fill plus
// shadow, never a color swap, §4.3), and a horizontally scrolling strip rather
// than a collapsed disclosure pattern. What is NOT automated here: the rendered
// touch-target size (jsdom computes no layout) — that row stays a reviewer check
// against docs/governance/responsive-rules.md §4.
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ReactElement } from 'react';
import { TabBar, WORKSPACE_TABS } from '@/components/primitives/TabBar';
import type { TabItem } from '@/components/primitives/TabBar';

function render(element: ReactElement): Element {
  const parsed = new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
  const node = parsed.body.firstElementChild;
  if (!node) throw new Error('TabBar rendered no element');
  return node;
}

function classesOf(node: Element): string[] {
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

const NAV_ITEMS: readonly TabItem[] = WORKSPACE_TABS.map((label, index) => ({
  value: label,
  label,
  href: `/provider/patients/p-1/${index}`,
}));

const PANEL_ITEMS: readonly TabItem[] = WORKSPACE_TABS.map((label) => ({
  value: label,
  label,
}));

describe('TabBar — the canonical eight-tab set (T-02-41)', () => {
  it('renders exactly eight items whose accessible names are the eight labels in order', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    const links = Array.from(root.querySelectorAll('a'));
    expect(links).toHaveLength(8);
    expect(links.map((link) => link.textContent)).toEqual([...WORKSPACE_TABS]);
  });

  it('marks the active item with aria-current and no other item', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Labs" ariaLabel="Patient sections" />,
    );
    const active = root.querySelector('[aria-current="page"]');
    expect(active).not.toBeNull();
    expect(active?.textContent).toBe('Labs');
    expect(root.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it('drives a panel with role=tab and aria-selected instead of aria-current', () => {
    const root = render(
      <TabBar items={PANEL_ITEMS} value="Visits" ariaLabel="Patient sections" />,
    );
    expect(root.getAttribute('role')).toBe('tablist');
    const tabs = Array.from(root.querySelectorAll('[role="tab"]'));
    expect(tabs).toHaveLength(8);
    expect(tabs.filter((tab) => tab.getAttribute('aria-selected') === 'true')).toHaveLength(1);
    expect(root.querySelector('[aria-current]')).toBeNull();
  });
});

describe('TabBar — same ink, fill-plus-shadow active state (§4.3)', () => {
  it('gives the active and inactive labels the same ink classes', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    const links = Array.from(root.querySelectorAll('a'));
    const active = links.find((link) => link.textContent === 'Overview') as Element;
    const inactive = links.find((link) => link.textContent === 'Labs') as Element;
    const inkOf = (node: Element) =>
      classesOf(node)
        .filter((name) => name.startsWith('text-'))
        .sort();
    expect(inkOf(active)).toEqual(inkOf(inactive));
    expect(inkOf(active)).toContain('text-text-primary');
  });

  it('carries shadow-raised on the active item and no shadow on the inactive ones', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    const links = Array.from(root.querySelectorAll('a'));
    const active = links.find((link) => link.textContent === 'Overview') as Element;
    const inactive = links.find((link) => link.textContent === 'Labs') as Element;
    expect(classesOf(active)).toContain('bg-surface-raised');
    expect(classesOf(active)).toContain('shadow-raised');
    expect(classesOf(inactive).filter((name) => name.startsWith('shadow-'))).toEqual([]);
    expect(classesOf(inactive)).not.toContain('bg-surface-raised');
  });

  it('paints no accent anywhere in the group (INV-05)', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    for (const node of Array.from(root.querySelectorAll('*'))) {
      expect(classesOf(node).some((name) => name.includes('accent'))).toBe(false);
    }
    expect(classesOf(root).some((name) => name.includes('accent'))).toBe(false);
  });
});

describe('TabBar — the mobile strip scrolls rather than collapsing (T-02-40)', () => {
  it('styles the container as a horizontal scroll strip with no scrollbar', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    const containerClasses = classesOf(root);
    expect(containerClasses).toContain('overflow-x-auto');
    expect(containerClasses.some((name) => name.includes('scrollbar-width'))).toBe(true);
    expect(containerClasses).toContain('rounded-pill');
  });

  it('renders no hamburger-only disclosure pattern', () => {
    const root = render(
      <TabBar items={NAV_ITEMS} value="Overview" ariaLabel="Patient sections" />,
    );
    expect(root.querySelector('[aria-expanded]')).toBeNull();
    expect(root.querySelector('[aria-haspopup]')).toBeNull();
    for (const node of Array.from(root.querySelectorAll('*'))) {
      expect(classesOf(node).some((name) => name.includes('hamburger'))).toBe(false);
    }
  });
});
