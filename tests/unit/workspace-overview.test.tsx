// tests/unit/workspace-overview.test.tsx — the Phase-5 Overview unit proof
// (WSP-01, WSP-02; AUTH-03; UX-01/UX-02; ASVS V5 / T-02-52).
//
// Static idiom of tests/unit/provider-home-page.test.tsx: `server-only`,
// `@/lib/supabase/server`, `@/lib/auth/workspace`, `@/lib/patients/queries`
// and `motion/react` mocked at their factories, so the test proves PLUMBING
// and COPY, not SQL. The page is invoked directly (await of the async
// component) and rendered with `renderToStaticMarkup`.
//
// Asserted:
//   WSP-01  the eight slugs, their labels and their DOM order are exactly the
//           spec's set — no Vital Signs tab, no Communication tab, no extra
//           route folder (a directory scan, so a new tab cannot be added
//           without failing here);
//   WSP-02  the identity area renders the stored identity (name, MRN, DOB,
//           age/sex, status label, last activity) and the D-10 status token,
//           with denial, error and loading states all deliberate and no-leak;
//   T-02-52 the `[patientId]` value never appears as rendered text — only
//           inside hrefs — and a malformed segment never reaches getPatient.
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createElement } from 'react';
import type { ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const queries = vi.hoisted(() => ({ getPatient: vi.fn(), listPatients: vi.fn() }));
const workspace = vi.hoisted(() => ({ resolveWorkspaceRole: vi.fn() }));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({}) }));
vi.mock('@/lib/patients/queries', () => queries);
vi.mock('@/lib/auth/workspace', () => workspace);
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), redirect: vi.fn() }));
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

import OverviewPage from '@/app/(provider)/provider/patients/[patientId]/overview/page';
import { OverviewBody } from '@/components/workspace/OverviewBody';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import {
  WORKSPACE_TAB_LABELS,
  WORKSPACE_TAB_ROUTES,
} from '@/app/(provider)/provider/patients/[patientId]/tabs';
import type { PatientRecord } from '@/lib/patients/queries';
import type { PatientStatus } from '@/lib/patients/status';

const ORG = '10000000-0000-0000-0000-000000000001';
// A realistic UUID: the route parameter must parse as one (patientIdSchema).
const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

/** The exact primary navigation of PRODUCT-MASTER-SPEC.md §6 (WSP-01). */
const SPEC_TAB_LABELS = [
  'Overview',
  'AI Analytics',
  'Visits',
  'Medications',
  'Labs',
  'Imaging',
  'Allergies',
  'Genetics',
] as const;

const SPEC_TAB_SLUGS = [
  'overview',
  'ai-analytics',
  'visits',
  'medications',
  'labs',
  'imaging',
  'allergies',
  'genetics',
] as const;

function parse(markup: string): Document {
  return new DOMParser().parseFromString(markup, 'text/html');
}

function record(overrides: Partial<PatientRecord> = {}): PatientRecord {
  return {
    id: PATIENT_ID,
    firstName: 'Tiffany',
    lastName: 'Woodward',
    dob: '2002-03-14',
    sex: 'F',
    mrn: 'MRN-0007',
    status: 'follow_up',
    userId: 'user-1',
    lastActivityAt: '2026-10-06T09:30:00Z',
    age: 24,
    createdAt: '2025-05-12T08:00:00Z',
    updatedAt: '2026-10-06T09:30:00Z',
    ...overrides,
  };
}

async function renderBody(patientId: string): Promise<Document> {
  const element = await OverviewBody({ patientId });
  const tree = element ? createElement('div', null, element) : createElement('div');
  return parse(renderToStaticMarkup(tree));
}

async function renderPage(): Promise<{ markup: string; doc: Document }> {
  const element = (await OverviewPage({
    params: Promise.resolve({ patientId: PATIENT_ID }),
  })) as ReactElement;
  const markup = renderToStaticMarkup(element);
  return { markup, doc: parse(markup) };
}

beforeEach(() => {
  queries.getPatient.mockReset();
  workspace.resolveWorkspaceRole.mockReset();
  workspace.resolveWorkspaceRole.mockResolvedValue({
    kind: 'signed-in',
    role: 'provider_doctor',
    orgId: ORG,
  });
  queries.getPatient.mockResolvedValue(record());
});

describe('WSP-01 — the primary navigation is exactly the eight spec tabs', () => {
  it('enumerates the eight slugs in spec order', () => {
    expect(WORKSPACE_TAB_ROUTES).toEqual(SPEC_TAB_SLUGS);
  });

  it('labels them in spec order with no Vital Signs and no Communication tab', () => {
    const labels = WORKSPACE_TAB_ROUTES.map((slug) => WORKSPACE_TAB_LABELS[slug]);
    expect(labels).toEqual(SPEC_TAB_LABELS);
    expect(labels).not.toContain('Vital Signs');
    expect(labels).not.toContain('Communication');
  });

  it('renders the tab bar in spec order with the active item on Overview', () => {
    const markup = renderToStaticMarkup(
      createElement(WorkspaceTopBar, { patientId: PATIENT_ID, activeSlug: 'overview' }),
    );
    const doc = parse(markup);
    const anchors = Array.from(doc.querySelectorAll('a'));
    const labels = anchors.map((a) => a.textContent?.trim() ?? '');
    expect(labels).toEqual([...SPEC_TAB_LABELS]);
    const current = anchors.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('Overview');
  });

  it('has exactly the eight spec route folders under [patientId] — a new tab fails here', () => {
    const dir = path.resolve(__dirname, '..', '..', 'src/app/(provider)/provider/patients/[patientId]');
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(folders).toEqual([...SPEC_TAB_SLUGS].sort());
  });

  it('keeps every tab href scoped to the patient segment', () => {
    const markup = renderToStaticMarkup(
      createElement(WorkspaceTopBar, { patientId: PATIENT_ID, activeSlug: 'overview' }),
    );
    const doc = parse(markup);
    const hrefs = Array.from(doc.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    for (const href of hrefs) {
      expect(href).toMatch(new RegExp(`^/provider/patients/${PATIENT_ID}/[a-z-]+$`));
    }
  });
});

describe('WSP-02 — the identity area', () => {
  it('renders the stored identity, not the route parameter', async () => {
    const doc = await renderBody(PATIENT_ID);

    expect(doc.body.textContent).toContain('Tiffany Woodward');
    expect(doc.body.textContent).toContain('MRN-0007');
    expect(doc.body.textContent).toContain('2002-03-14');
    expect(doc.body.textContent).toContain('Female · 24');
    expect(doc.body.textContent).toContain('2026-10-06');
    // T-02-52: the id is never rendered as text.
    expect(doc.body.textContent).not.toContain(PATIENT_ID);
  });

  it('consumes the D-10 status token for the stored status (INV-04)', async () => {
    const doc = await renderBody(PATIENT_ID);
    expect(doc.body.textContent).toContain('Follow-up');
    expect(doc.querySelector('[class*="bg-warning"]')).not.toBeNull();
    // no other status tint appears on the identity area
    expect(doc.querySelector('[class*="bg-success"]')).toBeNull();
    expect(doc.querySelector('[class*="bg-critical"]')).toBeNull();
  });

  it('shows the portal state for a linked and an unlinked patient', async () => {
    const linked = await renderBody(PATIENT_ID);
    expect(linked.body.textContent).toContain('Portal access');
    expect(linked.body.textContent).toContain('Active');

    queries.getPatient.mockResolvedValue(record({ userId: null }));
    const unlinked = await renderBody(PATIENT_ID);
    expect(unlinked.body.textContent).toContain('Portal access');
    expect(unlinked.body.textContent).toContain('Invite pending');
  });

  it('queries one patient by org scope and bound id (AUTH-03)', async () => {
    await renderBody(PATIENT_ID);
    expect(queries.getPatient).toHaveBeenCalledTimes(1);
    expect(queries.getPatient).toHaveBeenCalledWith(ORG, PATIENT_ID);
  });
});

describe('permission denied — no-leak state (UX-02, AUTH-03)', () => {
  it('renders the denial copy when RLS reads zero rows', async () => {
    queries.getPatient.mockResolvedValue(null);
    const doc = await renderBody(PATIENT_ID);

    expect(doc.body.textContent).toContain("You don't have access to this patient record");
    expect(doc.body.textContent).toContain('Ask your organization owner for access to patient records.');
    // the copy never reveals whether the record exists
    expect(doc.body.textContent?.toLowerCase()).not.toContain('exist');
    expect(doc.body.textContent).not.toContain(PATIENT_ID);
    // the action owns a wired destination (D-24: no dead control)
    const action = Array.from(doc.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Go to your workspace',
    );
    expect(action).toBeDefined();
    expect(action?.getAttribute('href')).toBe('/provider');
  });
});

describe('the route parameter never reaches a query (ASVS V5, T-02-52)', () => {
  it('rejects a malformed segment without calling getPatient', async () => {
    const doc = await renderBody('not-a-uuid');
    expect(queries.getPatient).not.toHaveBeenCalled();
    expect(doc.body.textContent).toContain("You don't have access to this patient record");
    expect(doc.body.textContent).not.toContain('not-a-uuid');
  });
});

describe('error state — deliberate, never blank (§24)', () => {
  it('renders the §7 error copy with a wired retry anchor', async () => {
    queries.getPatient.mockRejectedValue(new Error('connection reset'));
    const doc = await renderBody(PATIENT_ID);

    expect(doc.body.textContent).toContain("Couldn't load patient record");
    expect(doc.body.textContent).toContain('Check your connection and try again.');
    const retry = Array.from(doc.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Try again',
    );
    expect(retry).toBeDefined();
    expect(retry?.getAttribute('href')).toBe(`/provider/patients/${PATIENT_ID}/overview`);
  });

  it('renders nothing when the workspace resolution is not signed in', async () => {
    workspace.resolveWorkspaceRole.mockResolvedValue({ kind: 'unauthenticated' });
    const element = await OverviewBody({ patientId: PATIENT_ID });
    expect(element).toBeNull();
  });
});

describe('WSP-02 — the context stat row beside the identity area (T-02)', () => {
  it('renders the three context cards with their exact labels', async () => {
    const doc = await renderBody(PATIENT_ID);
    for (const label of ['Current status', 'Last activity', 'Record opened']) {
      const card = doc.querySelector(`section[aria-label="${label}"]`);
      expect(card, `missing stat card: ${label}`).not.toBeNull();
      expect(card?.textContent).toContain(label);
    }
  });

  it('derives the attention indicator from the stored status vocabulary only (INV-04)', async () => {
    const doc = await renderBody(PATIENT_ID);
    const card = doc.querySelector('section[aria-label="Current status"]');
    expect(card?.textContent).toContain('Follow-up');
    // the follow_up status wears its D-10 token and no other status family
    expect(card?.querySelector('[class*="bg-warning"]')).not.toBeNull();
    expect(card?.querySelector('[class*="bg-success"]')).toBeNull();
    expect(card?.querySelector('[class*="bg-info"]')).toBeNull();
    expect(card?.querySelector('[class*="bg-critical"]')).toBeNull();

    // every status in the vocabulary resolves to its sanctioned token
    const cases: Array<[PatientStatus, string]> = [
      ['stable', 'bg-success'],
      ['follow_up', 'bg-warning'],
      ['needs_review', 'bg-info'],
      ['critical', 'bg-critical'],
      ['new', 'bg-info'],
    ];
    for (const [status, tokenClass] of cases) {
      queries.getPatient.mockResolvedValue(record({ status }));
      const each = await renderBody(PATIENT_ID);
      const statusCard = each.querySelector('section[aria-label="Current status"]');
      expect(statusCard?.querySelector(`[class*="${tokenClass}"]`), status).not.toBeNull();
    }
    queries.getPatient.mockResolvedValue(record());
  });

  it('paints no accent on the context row (INV-05 reserved list)', async () => {
    const markup = renderToStaticMarkup(
      createElement('div', null, await OverviewBody({ patientId: PATIENT_ID })),
    );
    expect(markup).not.toContain('bg-accent');
    expect(markup).not.toContain('text-accent');
  });

  it('renders statistical values as tabular numerals in font steps 400/600 only (QA row 7)', async () => {
    const markup = renderToStaticMarkup(
      createElement('div', null, await OverviewBody({ patientId: PATIENT_ID })),
    );
    // only the four frozen font.size utilities appear
    expect(markup).not.toMatch(/text-(xs|sm|lg|xl|\dxl)/);
    // only the two frozen font weights appear
    expect(markup).not.toMatch(/font-(thin|light|normal|medium|bold|extrabold|black)/);

    const doc = parse(markup);
    const numerals = Array.from(doc.querySelectorAll('.text-display'));
    expect(numerals.length).toBeGreaterThanOrEqual(2);
    for (const el of numerals) {
      expect(el.textContent).toMatch(/^\d+$/);
      expect(el.className).toContain('tabular-nums');
      expect(el.className).toMatch(/font-semibold|font-regular/);
    }

    // both recency cards carry the exact stored dates beneath the numeral
    const activity = doc.querySelector('section[aria-label="Last activity"]');
    expect(activity?.textContent).toContain('2026-10-06');
    const opened = doc.querySelector('section[aria-label="Record opened"]');
    expect(opened?.textContent).toContain('2025-05-12');
  });

  it('holds more than one line of content in every card (INV-12)', async () => {
    const doc = await renderBody(PATIENT_ID);
    for (const label of ['Patient identity', 'Current status', 'Last activity', 'Record opened']) {
      const card = doc.querySelector(`section[aria-label="${label}"]`);
      const text = (card?.textContent ?? '').trim();
      expect(text.length, label).toBeGreaterThan(label.length);
      // label + at least one further value (a date, a numeral or the pill)
      expect(/\d{4}-\d{2}-\d{2}|\d/.test(text), label).toBe(true);
    }
  });

  it('uses no gamified vocabulary anywhere on the surface (INV-06)', async () => {
    const doc = await renderBody(PATIENT_ID);
    const text = (doc.body.textContent ?? '').toLowerCase();
    for (const word of ['point', 'level', 'streak', 'reward', 'celebrat', 'confetti', 'trophy']) {
      expect(text).not.toContain(word);
    }
  });
});

describe('page shell — streaming loading state and cache posture', () => {
  it('renders the top bar above a token-derived skeleton fallback (§24)', async () => {
    const { doc } = await renderPage();

    // the tab bar paints even while the body is suspended
    const labels = Array.from(doc.querySelectorAll('a')).map((a) => a.textContent?.trim() ?? '');
    expect(labels).toEqual([...SPEC_TAB_LABELS]);

    // the fallback is a skeleton, never a generic "Loading…" screen
    expect(doc.body.textContent).not.toMatch(/^Loading…$/);
    expect(doc.querySelector('[role="status"]')?.textContent).toBe('Loading');
    expect(doc.querySelector('.skeleton-pulse')).not.toBeNull();
  });

  it('keeps the patient id out of every rendered text node', async () => {
    const { doc } = await renderPage();
    expect(doc.body.textContent).not.toContain(PATIENT_ID);
  });

  it('is force-dynamic — a patient record is never cached across principals', () => {
    const source = readFileSync(
      path.resolve(
        __dirname,
        '..',
        '..',
        'src/app/(provider)/provider/patients/[patientId]/overview/page.tsx',
      ),
      'utf8',
    );
    expect(source).toContain("export const dynamic = 'force-dynamic'");
    expect(source).toContain('<Suspense');
  });
});
