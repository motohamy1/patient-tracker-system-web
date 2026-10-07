// tests/unit/denial-state.test.tsx — the deep-route denial surface proof
// (D-13, UX-02, 03-UI-SPEC §8.4).
//
// The ACTUAL page component is rendered (resolveWorkspaceRole mocked at the
// module boundary) so the assertions cover the composed route, not just the
// primitive: exact copy, exactly ONE body line, the wired action, and the
// no-leak sweep — no status tint, no border class, no spinner/skeleton anywhere
// in the markup. jsdom project (static server render + parsed DOM), matching
// tests/unit/primitives/EmptyState.test.tsx idiom.
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

const harness = vi.hoisted(() => ({
  resolution: {
    kind: 'signed-in',
    role: 'provider_doctor',
    orgId: 'org-a',
  } as
    | { kind: 'signed-in'; role: string; orgId: string }
    | { kind: 'unaffiliated' }
    | { kind: 'unauthenticated' },
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/auth/workspace', async () => ({
  resolveWorkspaceRole: async () => harness.resolution,
}));

// The page is an async Server Component: it is AWAITED to its element tree,
// then rendered statically — the React 19 server-renderer under a synchronous
// tree does not tolerate nested suspense here, and awaiting the component is a
// direct proof of the same tree it ships.
const pageModule = await import('@/app/(provider)/provider/denied/page');
const renderDeniedPage = async (): Promise<Document> =>
  new DOMParser().parseFromString(
    renderToStaticMarkup(await pageModule.default()),
    'text/html',
  );

function classesOf(node: Element): string[] {
  return (node.getAttribute('class') ?? '').split(/\s+/).filter(Boolean);
}

beforeEach(() => {
  harness.resolution = {
    kind: 'signed-in',
    role: 'provider_doctor',
    orgId: 'org-a',
  };
});

describe('denial surface — the D-13 copy contract (UI-SPEC §8.4 + §Copywriting)', () => {
  it('renders the exact denial title', async () => {
    const doc = await renderDeniedPage();
    expect(doc.body.textContent).toContain("You don't have access to this workspace");
  });

  it('renders exactly one body line, at capability level, with no existential leak', async () => {
    const doc = await renderDeniedPage();
    const bodies = Array.from(doc.querySelectorAll('p'));
    expect(bodies).toHaveLength(1);
    const bodyText = bodies[0]?.textContent ?? '';
    expect(bodyText).toBe('Ask your organization owner for provider access.');
    // Capability level means resource level is never named: no patient name,
    // no route path, no org identity in the body line.
    expect(bodyText).not.toMatch(/patient|org-|\/provider|member|record/i);
    expect(bodyText).not.toMatch(/does not exist|no such|not found/i);
  });

  it('wires the action to the resolved own-workspace target', async () => {
    const doc = await renderDeniedPage();
    const action = doc.querySelector('a');
    expect(action?.textContent).toBe('Go to your workspace');
    expect(action?.getAttribute('href')).toBe('/provider');
  });

  it('wires the action to the patient workspace when the resolved role is patient', async () => {
    harness.resolution = { kind: 'signed-in', role: 'patient', orgId: 'org-a' };
    const doc = await renderDeniedPage();
    expect(doc.querySelector('a')?.getAttribute('href')).toBe('/patient');
  });

  it('ships no action at all when no own workspace target can be resolved', async () => {
    harness.resolution = { kind: 'unaffiliated' };
    const doc = await renderDeniedPage();
    expect(doc.querySelector('a')).toBeNull();
    expect(doc.querySelector('button')).toBeNull();
  });

  it('renders the optional 24px icon, never a status tint', async () => {
    const doc = await renderDeniedPage();
    const svg = doc.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('24');
    expect(svg?.getAttribute('stroke-width')).toBe('1.5');
  });
});

describe('denial surface — the no-leak sweep (calm surface, no status costume)', () => {
  it('emits no spinner, skeleton, status tint or border class anywhere', async () => {
    const doc = await renderDeniedPage();
    expect(doc.querySelectorAll('[role="alert"]')).toHaveLength(0);
    for (const node of Array.from(doc.querySelectorAll('*'))) {
      const classes = classesOf(node);
      expect(
        classes.some((name) => /animate-spin|skeleton|spinner|loading|progress/.test(name)),
      ).toBe(false);
      expect(classes.some((name) => /^(text|bg)-(success|info|warning|critical)$/.test(name))).toBe(
        false,
      );
      expect(classes.some((name) => name.startsWith('border-'))).toBe(false);
    }
  });
});
