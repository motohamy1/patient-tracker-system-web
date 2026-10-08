// tests/unit/patient-folder-grid.test.tsx — the folder card + grid unit proof
// (PROV-01/PROV-03, UX-07; D-10/D-12/D-20; 04-UI-SPEC §4.1/§4.2/§4.7).
//
// Static render idiom of tests/unit/membership-surface.test.tsx:
// react-dom/server + a parsed DOM, `server-only` and `next/navigation` mocked,
// `motion/react` mocked to the no-op button, and the Phase-4 action/query
// modules mocked at their factory boundary so nothing touches a network.
//
// Asserted: the D-10 status mapping for all five statuses (label AND token
// utility, in EXACTLY two tinted places), the card's link target, the
// minimization contract (no phone, no DOB), the per-filter and search empty
// copy, the cumulative "Load more" href, the 3-column grid class, and the
// Server-Component / no-border source contracts.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
const queries = vi.hoisted(() => ({ listPatients: vi.fn(), escapeLike: vi.fn() }));
const actions = vi.hoisted(() => ({
  createPatientAction: vi.fn(),
  changePatientStatusAction: vi.fn(),
  sendPatientInviteAction: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/navigation', () => ({ useRouter: () => nav }));
vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children?: unknown }) => children,
  motion: {
    div(props: Record<string, any>) {
      const { children, initial, animate, exit, transition, ...rest } = props;
      return createElement('div', rest, children);
    },
    button(props: Record<string, any>) {
      const { children, whileHover, whileTap, transition, ...rest } = props;
      return createElement('button', rest, children);
    },
  },
}));
vi.mock('@/lib/patients/queries', () => queries);
vi.mock('@/lib/patients/actions', () => actions);

import { FolderCard } from '@/components/patients/FolderCard';
import { FolderGrid, buildLoadMoreHref } from '@/components/patients/FolderGrid';
import type { PatientFolderRow } from '@/lib/patients/queries';

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function render(element: ReactElement): string {
  return renderToStaticMarkup(element);
}

function classesOf(doc: Document): string[] {
  return Array.from(doc.querySelectorAll('*'))
    .flatMap((node) => (node.getAttribute('class') ?? '').split(/\s+/))
    .filter(Boolean);
}

function sourceOf(parts: string[]): string {
  return readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');
}

const cardSource = () => sourceOf(['src/components/patients/FolderCard.tsx']);
const gridSource = () => sourceOf(['src/components/patients/FolderGrid.tsx']);

function row(overrides: Partial<PatientFolderRow> = {}): PatientFolderRow {
  return {
    id: 'p1',
    firstName: 'Amina',
    lastName: 'Hassan',
    dob: '1984-05-12',
    sex: 'F',
    mrn: 'MRN-0001',
    status: 'stable',
    userId: 'user-1',
    lastActivityAt: '2026-10-07T09:30:00Z',
    age: 42,
    ...overrides,
  };
}

const STATUS_CASES = [
  { status: 'stable', label: 'Stable', token: 'bg-success' },
  { status: 'follow_up', label: 'Follow-up', token: 'bg-warning' },
  { status: 'needs_review', label: 'Needs review', token: 'bg-info' },
  { status: 'critical', label: 'Critical', token: 'bg-critical' },
  { status: 'new', label: 'New', token: 'bg-info' },
] as const;

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FolderCard — the D-10 status grammar (PROV-03)', () => {
  it.each(STATUS_CASES)('renders $label with its $token line and dot', ({ status, label, token }) => {
    const html = render(createElement(FolderCard, { patient: row({ status }) }));
    const doc = parse(createElement(FolderCard, { patient: row({ status }) }));

    // The status line: 2px (h-0.5), rounded, in the D-10 token utility.
    const line = classesOf(doc)
      .filter((name) => name === 'h-0.5')
      .length;
    expect(line).toBe(1);
    expect(doc.body.innerHTML).toContain(`h-0.5 w-full rounded-pill ${token}`);

    // The Pill label is present and its dot carries the same token.
    expect(doc.body.textContent).toContain(label);
    const pill = Array.from(doc.querySelectorAll('span')).find(
      (node) =>
        (node.getAttribute('class') ?? '').includes('inline-flex') &&
        node.textContent === label,
    );
    expect(pill).toBeDefined();
    expect(pill?.querySelector(`.${token}`)).not.toBeNull();
    expect(pill?.getAttribute('class') ?? '').not.toContain(token);

    // EXACTLY two tinted places on the whole card: the line and the dot.
    expect(html.match(new RegExp(token, 'g')) ?? []).toHaveLength(2);
  });

  it('anchors the whole card to the patient workspace', () => {
    const doc = parse(createElement(FolderCard, { patient: row({ id: 'abc-123' }) }));
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('/provider/patients/abc-123');
  });

  it('never prints phone or DOB, and does print name, MRN and age · sex (minimization)', () => {
    const html = render(createElement(FolderCard, { patient: row() }));
    expect(html).not.toMatch(/phone/i);
    expect(html).not.toContain('1984-05-12');
    expect(html).toContain('Amina Hassan');
    expect(html).toContain('MRN-0001');
    expect(html).toContain('42 · F');
    expect(html).toContain('Last activity');
    expect(html).toContain('2026-10-07');
  });

  it('shows exactly one contextual indicator when the patient is unlinked', () => {
    const linked = parse(createElement(FolderCard, { patient: row() }));
    expect(linked.querySelector('svg[aria-label]')).toBeNull();

    const unlinked = parse(createElement(FolderCard, { patient: row({ userId: null }) }));
    expect(unlinked.querySelector('svg[aria-label="Not linked to a patient account"]')).not.toBeNull();
  });

  it('separates by shadow and radius only — no border, no tinted body', () => {
    const doc = parse(createElement(FolderCard, { patient: row({ status: 'critical' }) }));
    const classes = classesOf(doc);
    expect(classes.some((name) => name.startsWith('border'))).toBe(false);
    expect(classes).toContain('shadow-raised');
    expect(classes).toContain('rounded-lg');

    const anchorClasses = doc.querySelector('a')?.getAttribute('class') ?? '';
    expect(anchorClasses).not.toMatch(/bg-(success|warning|info|critical)/);
    expect(doc.body.innerHTML).not.toMatch(/<[^>]+class="[^"]*text-(success|warning|critical)/);
  });

  it('keeps the three-dot trigger outside the anchor and gives it a name', () => {
    const doc = parse(createElement(FolderCard, { patient: row() }));
    const trigger = doc.querySelector('button[aria-label="Actions for Amina"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.closest('a')).toBeNull();
    expect(doc.querySelector('a button')).toBeNull();
  });
});

describe('FolderGrid — deliberate empty states (04-UI-SPEC §4.7)', () => {
  const EMPTY_CASES = [
    {
      filter: 'all',
      title: 'No patients yet',
      body: 'Patient folders appear here once they are added to the practice.',
    },
    {
      filter: 'recent',
      title: 'No recent activity',
      body: 'Patients appear here once their records change.',
    },
    {
      filter: 'today',
      title: 'No patients today',
      body: 'Patients created or updated today appear here.',
    },
    {
      filter: 'attention',
      title: 'No patients need attention',
      body: 'Patients marked for follow-up or review appear here.',
    },
    {
      filter: 'critical',
      title: 'No critical patients',
      body: 'Patients marked critical appear here.',
    },
  ] as const;

  it.each(EMPTY_CASES)('renders the $filter copy verbatim', ({ filter, title, body }) => {
    const doc = parse(
      createElement(FolderGrid, {
        rows: [],
        hasMore: false,
        filter,
        shown: 0,
        limit: 24,
      }),
    );
    expect(doc.querySelector('h2')?.textContent).toBe(title);
    expect(doc.body.textContent).toContain(body);
  });

  it('prefers the search-no-match copy whenever q is present', () => {
    const doc = parse(
      createElement(FolderGrid, {
        rows: [],
        hasMore: false,
        filter: 'critical',
        q: 'zzz',
        shown: 0,
        limit: 24,
      }),
    );
    expect(doc.querySelector('h2')?.textContent).toBe('No matching patients');
    expect(doc.body.textContent).toContain(
      'Try a different name, record number, phone number or date.',
    );
  });

  it('renders the wired empty action only in the All-empty branch', () => {
    const action = createElement('button', { type: 'button' }, 'Add new patient');
    const all = parse(
      createElement(FolderGrid, {
        rows: [],
        hasMore: false,
        filter: 'all',
        shown: 0,
        limit: 24,
        emptyAction: action,
      }),
    );
    expect(all.body.textContent).toContain('Add new patient');

    const critical = parse(
      createElement(FolderGrid, {
        rows: [],
        hasMore: false,
        filter: 'critical',
        shown: 0,
        limit: 24,
        emptyAction: action,
      }),
    );
    expect(critical.body.textContent).not.toContain('Add new patient');

    const searching = parse(
      createElement(FolderGrid, {
        rows: [],
        hasMore: false,
        filter: 'all',
        q: 'zzz',
        shown: 0,
        limit: 24,
        emptyAction: action,
      }),
    );
    expect(searching.body.textContent).not.toContain('Add new patient');
  });
});

describe('FolderGrid — cumulative pagination (D-20, UX-07)', () => {
  it('renders "Load more" as a link with shown grown by limit', () => {
    const doc = parse(
      createElement(FolderGrid, {
        rows: [row()],
        hasMore: true,
        filter: 'critical',
        q: 'ali',
        shown: 0,
        limit: 24,
      }),
    );
    const link = Array.from(doc.querySelectorAll('a')).find(
      (node) => node.textContent === 'Load more',
    );
    expect(link).toBeDefined();
    expect(link?.getAttribute('href')).toBe('/provider?q=ali&filter=critical&shown=24');
    expect(link?.getAttribute('href')).toContain('shown=24');
  });

  it('grows cumulatively from an already-loaded window', () => {
    const href = buildLoadMoreHref({ filter: 'all', shown: 24 + 24 });
    expect(href).toBe('/provider?filter=all&shown=48');
    expect(href).toContain('filter=all');
  });

  it('preserves the client day for the Today filter', () => {
    expect(buildLoadMoreHref({ filter: 'today', day: '2026-10-08', shown: 0 })).toBe(
      '/provider?filter=today&d=2026-10-08&shown=0',
    );
  });

  it('renders no "Load more" control when no further page exists', () => {
    const doc = parse(
      createElement(FolderGrid, {
        rows: [row()],
        hasMore: false,
        filter: 'all',
        shown: 0,
        limit: 24,
      }),
    );
    expect(doc.body.textContent).not.toContain('Load more');
  });
});

describe('folder grid — structural contracts (source assertions)', () => {
  it('lays out 3 / 2 / 1 columns at the band edges with the space.lg gap', () => {
    const source = gridSource();
    expect(source).toContain('grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg');
    expect(source).toContain('lg:grid-cols-3');
  });

  it('keeps FolderCard and FolderGrid Server Components', () => {
    expect(cardSource().includes("'use client'")).toBe(false);
    expect(gridSource().includes("'use client'")).toBe(false);
    expect(cardSource()).not.toContain('onClick');
    expect(gridSource()).toContain('href=');
  });

  it('cites its decision IDs in the header block (pattern 1)', () => {
    expect(cardSource()).toContain('PROV-03');
    expect(cardSource()).toContain('D-10');
    expect(gridSource()).toContain('D-20');
    expect(gridSource()).toContain('04-UI-SPEC');
  });

  it('renders a card row for every seeded folder', () => {
    const doc = parse(
      createElement(FolderGrid, {
        rows: [row({ id: 'p1' }), row({ id: 'p2' }), row({ id: 'p3' })],
        hasMore: false,
        filter: 'all',
        shown: 0,
        limit: 24,
      }),
    );
    expect(doc.querySelectorAll('a[href^="/provider/patients/"]').length).toBe(3);
  });
});
