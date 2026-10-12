// tests/unit/workspace-overview.test.tsx — the Phase-5 Overview unit proof
// (WSP-01, WSP-02; AUTH-03; UX-01/UX-02; ASVS V5 / T-02-52).
//
// Static idiom of tests/unit/provider-home-page.test.tsx: `server-only`,
// `@/lib/auth/session` (the module graph's identity seam, stubbed so the
// Managed Auth edge stays out of jsdom), `@/lib/auth/workspace`,
// `@/lib/patients/queries` and `motion/react` mocked at their factories, so
// the test proves PLUMBING and COPY, not SQL. The page is invoked directly
// (await of the async component) and rendered with `renderToStaticMarkup`.
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

const queries = vi.hoisted(() => ({
  getPatient: vi.fn(),
  listPatients: vi.fn(),
  listPatientInvitations: vi.fn(),
  // The module's privilege-error class, mirrored here so the mock and the
  // page agree on `instanceof` while `@/lib/patients/queries` is replaced.
  SupabasePermissionError: class SupabasePermissionError extends Error {},
}));
const workspace = vi.hoisted(() => ({ resolveWorkspaceRole: vi.fn() }));

vi.mock('server-only', () => ({}));
// The identity seam is stubbed so `@neondatabase/auth` (and its `next/headers`
// edge) never enters the jsdom module graph; the resolution itself is mocked
// separately below.
vi.mock('@/lib/auth/session', () => ({ getSessionUser: vi.fn() }));
vi.mock('@/lib/patients/queries', () => ({
  getPatient: queries.getPatient,
  listPatients: queries.listPatients,
  listPatientInvitations: queries.listPatientInvitations,
  SupabasePermissionError: queries.SupabasePermissionError,
}));
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
import { ContextStrip } from '@/components/workspace/ContextStrip';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import {
  WORKSPACE_TAB_LABELS,
  WORKSPACE_TAB_ROUTES,
} from '@/app/(provider)/provider/patients/[patientId]/tabs';
import type { PatientRecord } from '@/lib/patients/queries';

const ORG = '10000000-0000-0000-0000-000000000001';
// A realistic UUID: the route parameter must parse as one (patientIdSchema).
const PATIENT_ID = '11111111-1111-4111-8111-111111111111';

/** The exact primary navigation of the patient-detail reference (WSP-01). */
const SPEC_TAB_LABELS = [
  'Overview',
  'AI Analytics',
  'Visits',
  'Medications',
  'Labs',
  'Imaging',
  'Allergies',
  'Genetics',
  'Hospitalization',
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
  'hospitalization',
] as const;

function parse(markup: string): Document {
  return new DOMParser().parseFromString(markup, 'text/html');
}

/** Render the header (an async Server Component) the same way the body is
 *  rendered below: await it first, then freeze it. */
async function renderHeader(children?: ReactElement): Promise<Document> {
  const element = (await WorkspaceTopBar({
    patientId: PATIENT_ID,
    activeSlug: 'overview',
    children,
  })) as ReactElement;
  return parse(renderToStaticMarkup(element));
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
  queries.listPatientInvitations.mockReset();
  queries.listPatientInvitations.mockResolvedValue([]);
  workspace.resolveWorkspaceRole.mockReset();
  workspace.resolveWorkspaceRole.mockResolvedValue({
    kind: 'signed-in',
    role: 'provider_doctor',
    orgId: ORG,
  });
  queries.getPatient.mockResolvedValue(record());
});

describe('WSP-01 — the primary navigation is exactly the nine reference tabs', () => {
  it('enumerates the nine slugs in reference order', () => {
    expect(WORKSPACE_TAB_ROUTES).toEqual(SPEC_TAB_SLUGS);
  });

  it('labels them in reference order with no Vital Signs and no Communication tab', () => {
    const labels = WORKSPACE_TAB_ROUTES.map((slug) => WORKSPACE_TAB_LABELS[slug]);
    expect(labels).toEqual(SPEC_TAB_LABELS);
    expect(labels).not.toContain('Vital Signs');
    expect(labels).not.toContain('Communication');
  });

  it('renders the tab bar in reference order with the active item on Overview', async () => {
    const doc = await renderHeader();
    const nav = doc.querySelector('nav[aria-label="Patient sections"]');
    const anchors = Array.from(nav?.querySelectorAll('a') ?? []);
    const labels = anchors.map((a) => a.textContent?.trim() ?? '');
    expect(labels).toEqual([...SPEC_TAB_LABELS]);
    const current = anchors.filter((a) => a.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
    expect(current[0].textContent?.trim()).toBe('Overview');
  });

  it('has exactly the nine reference route folders under [patientId] — a new tab fails here', () => {
    const dir = path.resolve(__dirname, '..', '..', 'src/app/(provider)/provider/patients/[patientId]');
    const folders = readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(folders).toEqual([...SPEC_TAB_SLUGS].sort());
  });

  it('keeps every tab href scoped to the patient segment', async () => {
    const doc = await renderHeader();
    const nav = doc.querySelector('nav[aria-label="Patient sections"]');
    const hrefs = Array.from(nav?.querySelectorAll('a') ?? []).map((a) => a.getAttribute('href'));
    expect(hrefs.length).toBe(SPEC_TAB_SLUGS.length);
    for (const href of hrefs) {
      expect(href).toMatch(new RegExp(`^/provider/patients/${PATIENT_ID}/[a-z-]+$`));
    }
  });
});

describe('WSP-02 — the identity area (rendered by the header, per the reference)', () => {
  /** The identity card now lives in `WorkspaceTopBar`: the reference seats it
   *  beside the tab strip, so the header is where its assertions belong. */
  async function identityHeader(patientOverrides: Partial<PatientRecord> = {}): Promise<Document> {
    queries.getPatient.mockResolvedValue(record(patientOverrides));
    return renderHeader();
  }

  it('renders the stored identity, not the route parameter', async () => {
    const doc = await identityHeader();

    expect(doc.body.textContent).toContain('Tiffany Woodward');
    expect(doc.body.textContent).toContain('Female · 24');
    // T-02-52: the id is never rendered as text.
    expect(doc.body.textContent).not.toContain(PATIENT_ID);
  });

  it('shows the portal state for a linked and an unlinked patient', async () => {
    const linked = await identityHeader();
    expect(linked.body.textContent).toContain('Portal Access');
    expect(linked.body.textContent).toContain('Active');

    const unlinked = await identityHeader({ userId: null });
    expect(unlinked.body.textContent).toContain('Portal Access');
    expect(unlinked.body.textContent).toContain('Invite pending');
  });

  it('queries one patient by org scope and bound id (AUTH-03)', async () => {
    await identityHeader();
    expect(queries.getPatient).toHaveBeenCalledTimes(1);
    expect(queries.getPatient).toHaveBeenCalledWith(ORG, PATIENT_ID);
  });

  it('renders no card at all when the read is denied — never a placeholder patient', async () => {
    queries.getPatient.mockResolvedValue(null);
    const doc = await renderHeader();
    expect(doc.querySelector('section[aria-label="Patient identity"]')).toBeNull();
    // the tab strip survives, so navigation never depends on the identity read
    const nav = doc.querySelector('nav[aria-label="Patient sections"]');
    expect(nav).not.toBeNull();
  });

  it('never lets the identity card paint a status tint (INV-04)', async () => {
    const doc = await identityHeader();
    const identity = doc.querySelector('section[aria-label="Patient identity"]');
    expect(identity?.querySelector('[class*="bg-success"]')).toBeNull();
    expect(identity?.querySelector('[class*="bg-warning"]')).toBeNull();
    expect(identity?.querySelector('[class*="bg-info"]')).toBeNull();
    expect(identity?.querySelector('[class*="bg-critical"]')).toBeNull();
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

describe('WSP-02 — the context strip beside the identity area (T-02)', () => {
  it('renders the diagnosis capsule and the four vitals with their exact labels', async () => {
    const doc = await renderHeader(createElement(ContextStrip));
    for (const label of ['Diagnosis', 'Heart rate', 'Pressure', 'SpO₂', 'Temperature']) {
      expect(doc.body.textContent, label).toContain(label);
    }
  });

  it('renders statistical values as tabular numerals in the reference font steps (QA row 7)', async () => {
    const doc = await renderHeader(createElement(ContextStrip));
    // the reference sets the vitals in Familjen Grotesk at the metric step
    const markup = doc.documentElement.outerHTML;
    expect(markup).toContain('font-grotesk');
    expect(markup).toContain('text-metric');

    const numerals = Array.from(doc.querySelectorAll('.text-metric'));
    expect(numerals.length).toBe(4);
    for (const el of numerals) {
      expect(el.textContent).toMatch(/^\d+(\.\d+)?$/);
      expect(el.className).toContain('tabular-nums');
    }
  });

  it('separates the vitals with hairline rules, never a border on a box (INV-15)', async () => {
    const doc = await renderHeader(createElement(ContextStrip));
    const rules = Array.from(doc.querySelectorAll('[aria-hidden="true"].bg-border-subtle'));
    expect(rules).toHaveLength(3);
    for (const rule of rules) {
      expect(rule.className).toContain('w-px');
    }
  });

  it('uses no gamified vocabulary anywhere on the surface (INV-06)', async () => {
    const doc = await renderHeader(createElement(ContextStrip));
    const text = (doc.body.textContent ?? '').toLowerCase();
    for (const word of ['point', 'level', 'streak', 'reward', 'celebrat', 'confetti', 'trophy']) {
      expect(text).not.toContain(word);
    }
  });
});

describe('WSP-02 — the region frame (T-04)', () => {
  it('renders every reference region at its slot: band, vitals history, labs, recent records', async () => {
    queries.listPatientInvitations.mockResolvedValue([
      { id: 'i1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null },
    ]);
    const doc = await renderBody(PATIENT_ID);

    expect(doc.querySelector('section[aria-label="Timeline"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Vital Signs History"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Labs"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Recent Records"]')).not.toBeNull();
    // the diagnosis/vitals strip is the header's, not the body's: the reference
    // seats it under the tab strip, beside the identity card
    const header = await renderHeader(createElement(ContextStrip));
    expect(header.body.textContent).toContain('Diagnosis');
    expect(doc.body.textContent).not.toContain('Diagnosis');
  });

  it('anchors the bottom row to the 55 / 22.5 / 22.5 grid (QA row 5)', () => {
    // the live body and the skeleton share ONE declaration of both templates
    const grids = readFileSync(
      path.resolve(__dirname, '..', '..', 'src/components/workspace/grids.ts'),
      'utf8',
    );
    expect(grids).toContain(
      "BOTTOM_ROW_GRID = 'grid grid-cols-1 gap-lg md:grid-cols-[55fr_22.5fr_22.5fr]'",
    );

    const body = readFileSync(
      path.resolve(__dirname, '..', '..', 'src/components/workspace/OverviewBody.tsx'),
      'utf8',
    );
    expect(body).toContain('className={BOTTOM_ROW_GRID}');
    const skeleton = readFileSync(
      path.resolve(__dirname, '..', '..', 'src/components/workspace/OverviewSkeleton.tsx'),
      'utf8',
    );
    expect(skeleton).toContain('className={BOTTOM_ROW_GRID}');
  });

  it('announces only real events to assistive tech — the reference illustration is decorative (§27, 06-01)', async () => {
    const doc = parse(
      renderToStaticMarkup(createElement('div', null, await OverviewBody({ patientId: PATIENT_ID }))),
    );
    const band = doc.querySelector('section[aria-label="Timeline"]');
    // the Phase-006 placeholder is replaced by the real D3-sealed band
    expect(band?.querySelector('svg')).not.toBeNull();
    // the REAL node layer carries exactly one mark per projected lifecycle
    // event (created + updated) and nothing more
    const realMarks = band?.querySelectorAll('g[data-role="node"]');
    expect(realMarks).toHaveLength(2);
    // every label in the real SVG layer is a month name or a year — no
    // clinical event vocabulary is invented where the schema has no data
    const labels = Array.from(band?.querySelectorAll('svg text') ?? []).map(
      (t) => t.textContent ?? '',
    );
    expect(labels.length).toBeGreaterThan(0);
    for (const label of labels) {
      expect(label, label).toMatch(/^(\d{4}|[A-Z][a-z]{2})$/);
    }
    // the band's floating cards are REAL controls now (quick 261012-e2y):
    // no decorative pointer-events-none overlay remains — every floating
    // element is a real button with an accessible name wired to the selection
    // the axis nodes use, so no drawn control answers nothing (INV-08)
    const floatingButtons = Array.from(band?.querySelectorAll('button') ?? []).filter(
      (button) => button.className.includes('pointer-events-auto') || button.className.includes('size-[26px]'),
    );
    expect(floatingButtons.length).toBeGreaterThan(0);
    for (const button of floatingButtons) {
      expect(button.getAttribute('aria-label')).toBeTruthy();
      expect(button.getAttribute('type')).toBe('button');
    }
    // the fabricated sample layer is gone — the band carries its own zoom
    // controls alongside the scrubber's pair (quick 261012-e2y task 2)
    expect(band?.querySelectorAll('button[aria-label="Zoom in"]').length).toBeGreaterThanOrEqual(1);
  });

  it('draws no dead controls in the Vital Signs History card (INV-08)', async () => {
    const markup = renderToStaticMarkup(
      createElement('div', null, await OverviewBody({ patientId: PATIENT_ID })),
    );
    const vitalsCard = parse(markup).querySelector('section[aria-label="Vital Signs History"]');
    // the reference's expand mark is a drawn glyph, never a button
    expect(vitalsCard?.querySelectorAll('button')).toHaveLength(0);
    expect(vitalsCard?.querySelectorAll('a')).toHaveLength(0);
  });

  it('falls back to the §7 empty state in the Labs card when the read returns nothing (§27)', async () => {
    // OverviewBody degrades a failed labs read to an empty list, so the card
    // must state the fact rather than draw a placeholder row
    const doc = await renderBody(PATIENT_ID);
    const labs = doc.querySelector('section[aria-label="Labs"]');
    expect(labs?.textContent).toContain('No labs yet');
    expect(labs?.textContent).toContain('Lab results will appear here as they are filed.');
    // no fabricated lab value in the empty state
    expect(labs?.textContent).not.toMatch(/mg\/dL/);
  });

  it('degrades ONLY the recent-activity slot when its query fails (§24)', async () => {
    queries.listPatientInvitations.mockRejectedValue(new Error('connection reset'));
    const doc = await renderBody(PATIENT_ID);

    // the slot shows the §7 error copy with a wired retry…
    expect(doc.body.textContent).toContain("Couldn't load recent records");
    const retry = Array.from(doc.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Try again',
    );
    expect(retry?.getAttribute('href')).toBe(`/provider/patients/${PATIENT_ID}/overview`);
    // …while the band and the other two cards stay alive
    expect(doc.querySelector('section[aria-label="Timeline"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Labs"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Vital Signs History"]')).not.toBeNull();
    expect(doc.querySelector('section[aria-label="Recent Records"]')).toBeNull();
  });

  it('shows the no-leak permission copy when the activity read is denied', async () => {
    queries.listPatientInvitations.mockRejectedValue(
      new queries.SupabasePermissionError('listPatientInvitations failed: permission denied'),
    );
    const doc = await renderBody(PATIENT_ID);

    expect(doc.body.textContent).toContain("You don't have access to recent records");
    expect(doc.body.textContent).toContain('Ask your organization owner for access to record history.');
    expect(doc.body.textContent?.toLowerCase()).not.toContain('exist');
    const action = Array.from(doc.querySelectorAll('a')).find(
      (a) => a.textContent?.trim() === 'Go to your workspace',
    );
    expect(action?.getAttribute('href')).toBe('/provider');
  });

  it('renders the denial copy, not the connection copy, when the record read is denied', async () => {
    queries.getPatient.mockRejectedValue(
      new queries.SupabasePermissionError('getPatient failed: permission denied'),
    );
    const doc = await renderBody(PATIENT_ID);

    expect(doc.body.textContent).toContain("You don't have access to this patient record");
    expect(doc.body.textContent).not.toContain("Couldn't load patient record");
  });

  it('renders the composed trail in the recent-records slot', async () => {
    queries.listPatientInvitations.mockResolvedValue([
      { id: 'i1', createdAt: '2026-09-01T10:00:00Z', redeemedAt: null },
    ]);
    const doc = await renderBody(PATIENT_ID);
    const card = doc.querySelector('section[aria-label="Recent Records"]');
    expect(card?.textContent).toContain('Record created');
    expect(card?.textContent).toContain('Invite sent');
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
