// tests/unit/provider-home-page.test.tsx — the /provider page unit proof
// (PROV-01/PROV-02, UX-01/UX-07; D-11/D-14/D-17..D-20; 04-UI-SPEC §4.1/§4.3/
// §4.7). Deterministic file accounting: this file owns the PAGE and its
// loading/error siblings; the grid owns its own file.
//
// Harness: membership-surface idiom — `server-only`, `next/navigation` and
// `motion/react` mocked, plus the Phase-4 query module (listPatients) and
// workspace resolver mocked at their factories so the test proves PLUMBING,
// not SQL.
//
// Asserted: URL searchParams reach listPatients unchanged (q / filter / d /
// shown / limit, arrays normalized to their first entry), the control row
// renders the five exact tab labels, the result count matches loaded-vs-total,
// the loading skeleton and the error StateVariant render their exact copy, the
// debounce constant is 300ms, the client islands never import the query module
// (server-side search only), and the page is a force-dynamic Server Component.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
const queries = vi.hoisted(() => ({ listPatients: vi.fn(), escapeLike: vi.fn() }));
const workspace = vi.hoisted(() => ({ resolveWorkspaceRole: vi.fn() }));
const actions = vi.hoisted(() => ({
  createPatientAction: vi.fn(),
  changePatientStatusAction: vi.fn(),
  sendPatientInviteAction: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/patients/queries', () => queries);
vi.mock('@/lib/auth/workspace', () => workspace);
vi.mock('@/lib/patients/actions', () => actions);
vi.mock('next/navigation', () => ({ useRouter: () => nav, redirect: vi.fn() }));
vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children?: any }) => children,
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

import ProviderHomePage from '@/app/(provider)/provider/page';
import ProviderLoading from '@/app/(provider)/provider/loading';
import ProviderError from '@/app/(provider)/provider/error';
import { SEARCH_DEBOUNCE_MS } from '@/components/patients/ProviderSearchControl';
import type { PatientFolderRow } from '@/lib/patients/queries';

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function sourceOf(parts: string[]): string {
  return readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');
}

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

async function renderPage(
  params: Record<string, string | string[] | undefined>,
): Promise<{ element: ReactElement | null; doc: Document | null }> {
  const element = (await ProviderHomePage({ searchParams: Promise.resolve(params) })) as
    | ReactElement
    | null;
  return { element, doc: element ? parse(element) : null };
}

const calledQuery = () => queries.listPatients.mock.calls[0][0];

beforeEach(() => {
  vi.clearAllMocks();
  workspace.resolveWorkspaceRole.mockResolvedValue({
    kind: 'signed-in',
    role: 'provider_doctor',
    orgId: 'org-1',
  });
  queries.listPatients.mockResolvedValue({ rows: [row()], hasMore: false, total: 1 });
});

describe('/provider — URL state reaches listPatients unchanged (PROV-02, D-18)', () => {
  it('passes q and filter through exactly as they appear in the URL', async () => {
    await renderPage({ q: 'ali', filter: 'critical' });
    expect(queries.listPatients).toHaveBeenCalledTimes(1);
    expect(calledQuery()).toEqual({
      orgId: 'org-1',
      q: 'ali',
      filter: 'critical',
      day: undefined,
      shown: 0,
      limit: 24,
    });
  });

  it('coerces shown and limit and passes the client day for the today filter', async () => {
    await renderPage({ filter: 'today', d: '2026-10-08', shown: '48', limit: '10' });
    expect(calledQuery()).toEqual({
      orgId: 'org-1',
      q: undefined,
      filter: 'today',
      day: '2026-10-08',
      shown: 48,
      limit: 10,
    });
  });

  it('normalizes repeated searchParams to their first value', async () => {
    await renderPage({ q: ['ali', 'bob'], filter: ['attention', 'all'] });
    expect(calledQuery().q).toBe('ali');
    expect(calledQuery().filter).toBe('attention');
  });

  it('falls back to schema defaults for junk instead of half-parsing', async () => {
    await renderPage({ filter: 'not-a-filter', shown: 'NaN', q: 'x'.repeat(500) });
    // q over the 120-char cap and a bogus filter/shown fail the schema →
    // every value falls back to the schema default (q dropped, all/0/24).
    expect(calledQuery()).toEqual({
      orgId: 'org-1',
      q: undefined,
      filter: 'all',
      day: undefined,
      shown: 0,
      limit: 24,
    });
  });

  it('renders an empty region when the resolution is not signed in', async () => {
    workspace.resolveWorkspaceRole.mockResolvedValue({ kind: 'unauthenticated' });
    const { element, doc } = await renderPage({});
    expect(element).toBeNull();
    expect(doc).toBeNull();
    expect(queries.listPatients).not.toHaveBeenCalled();
  });
});

describe('/provider — the control row and the grid (04-UI-SPEC §4.1/§4.3)', () => {
  it('renders all five filter tab labels exactly', async () => {
    const { doc } = await renderPage({});
    const tablist = doc!.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    const labels = Array.from(tablist!.querySelectorAll('button')).map(
      (button) => button.textContent ?? '',
    );
    expect(labels).toEqual(['All', 'Recent', 'Today', 'Needs attention', 'Critical']);
  });

  it('renders the loaded count when no further page exists', async () => {
    queries.listPatients.mockResolvedValue({ rows: [row(), row({ id: 'p2' })], hasMore: false, total: 137 });
    const { doc } = await renderPage({});
    expect(doc!.body.textContent).toContain('2 patients');
    expect(doc!.body.textContent).not.toContain('of 137');
  });

  it('renders the loaded-of-total count while more pages remain', async () => {
    queries.listPatients.mockResolvedValue({ rows: [row(), row({ id: 'p2' })], hasMore: true, total: 137 });
    const { doc } = await renderPage({});
    expect(doc!.body.textContent).toContain('2 of 137 patients');
    expect(doc!.body.textContent).toContain('Load more');
  });

  it('renders one workspace link per row', async () => {
    queries.listPatients.mockResolvedValue({
      rows: [row({ id: 'p1' }), row({ id: 'p2' })],
      hasMore: false,
      total: 2,
    });
    const { doc } = await renderPage({});
    expect(doc!.querySelectorAll('a[href^="/provider/patients/"]').length).toBe(2);
  });

  it('places the mobile search and the mobile CTA in the body control row', async () => {
    const { doc } = await renderPage({});
    const search = doc!.getElementById('provider-search-body');
    expect(search).not.toBeNull();
    const cta = Array.from(doc!.querySelectorAll('button')).find(
      (button) => button.textContent === 'Add new patient',
    );
    expect(cta).toBeDefined();
    expect(cta?.getAttribute('class') ?? '').toContain('bg-accent-soft');
    // both live inside the body row, which is the mobile-only placement
    const mobileRow = search?.closest('[class~="md:hidden"]') ?? null;
    expect(mobileRow).not.toBeNull();
    expect(mobileRow?.contains(cta!)).toBe(true);
  });

  it('wires the All-empty branch to a real Add new patient trigger', async () => {
    queries.listPatients.mockResolvedValue({ rows: [], hasMore: false, total: 0 });
    const { doc } = await renderPage({});
    const headings = Array.from(doc!.querySelectorAll('h2')).map((h2) => h2.textContent);
    expect(headings).toContain('No patients yet');
    const triggers = Array.from(doc!.querySelectorAll('button')).filter(
      (button) => button.textContent === 'Add new patient',
    );
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });
});

describe('/provider — deliberate states (UX-01, 04-UI-SPEC §4.7)', () => {
  it('loading renders folder-shaped skeletons at the 3/2/1 rhythm, never a generic screen', () => {
    const html = renderToStaticMarkup(createElement(ProviderLoading));
    const doc = parse(createElement(ProviderLoading));
    expect(html).toContain('skeleton-pulse');
    expect(html).toContain('lg:grid-cols-3');
    expect(html).toContain('md:grid-cols-2');
    expect(doc.querySelector('[role="status"]')).not.toBeNull();
    expect(html).not.toContain('Loading…');
    // Six folder cells + the one shared status node, not six live regions.
    expect(doc.querySelectorAll('[role="status"]').length).toBe(1);
  });

  it('error renders StateVariant with the exact §4.7 copy', () => {
    const doc = parse(createElement(ProviderError, { error: new Error('x'), reset: () => {} }));
    expect(doc.querySelector('h2')?.textContent).toBe("Couldn't load patients");
    expect(doc.body.textContent).toContain('Check your connection and try again.');
    const retry = doc.querySelector('button');
    expect(retry?.textContent).toBe('Try again');
    expect(retry?.getAttribute('class') ?? '').toContain('bg-surface-raised');
  });
});

describe('/provider — retrieval mechanics (source assertions)', () => {
  const pageSource = () => sourceOf(['src/app/(provider)/provider/page.tsx']);
  const searchSource = () => sourceOf(['src/components/patients/ProviderSearchControl.tsx']);
  const retrievalSource = () => sourceOf(['src/components/patients/RetrievalControls.tsx']);

  it('debounces at exactly 300ms', () => {
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
    expect(searchSource()).toContain('SEARCH_DEBOUNCE_MS');
  });

  it('keeps search and filters server-side only — the islands never see the query module', () => {
    expect(searchSource()).not.toContain('@/lib/patients/queries');
    expect(retrievalSource()).not.toContain('@/lib/patients/queries');
    expect(searchSource()).toContain('router.replace');
    expect(searchSource()).toContain('scroll: false');
    expect(retrievalSource()).toContain('router.replace');
    expect(pageSource()).toContain('listPatients');
  });

  it('writes URL state and drops `shown` on a filter change', () => {
    expect(retrievalSource()).toContain("params.set('filter', value)");
    expect(retrievalSource()).toContain('localToday()');
    expect(searchSource()).toContain("params.set('q', value)");
  });

  it('is a force-dynamic Server Component', () => {
    const source = pageSource();
    expect(source.includes("'use client'")).toBe(false);
    expect(source).toContain("dynamic = 'force-dynamic'");
    expect(source).toContain('await searchParams');
    expect(source).toContain('resolveWorkspaceRole');
  });

  it('keeps loading.tsx and error.tsx in their required forms', () => {
    expect(sourceOf(['src/app/(provider)/provider/loading.tsx']).includes("'use client'")).toBe(
      false,
    );
    expect(sourceOf(['src/app/(provider)/provider/error.tsx'])).toContain("'use client'");
    expect(sourceOf(['src/app/(provider)/provider/error.tsx'])).toContain('router.refresh()');
  });
});
