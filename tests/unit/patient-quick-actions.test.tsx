// tests/unit/patient-quick-actions.test.tsx — the folder-card quick-actions
// proof (PROV-04; D-04/D-13/D-15; 04-UI-SPEC §4.6 + §Copywriting).
//
// Static render (renderToStaticMarkup) for every visibility and copy rule:
// the three rows for `unlinked && canInvite`, the invite row HIDDEN (never
// disabled) for a role without the capability and for a linked patient, the
// honest schedule placeholder, the invite-confirm strings verbatim, and the
// INV-06 vocabulary sweep (plus no exclamation marks — §7). Mounted render
// (react-dom/client + act) for the two behaviours: a status choice calls
// `changePatientStatusAction(patientId, status)` and completes, and "Send
// invite" calls `sendPatientInviteAction(patientId)` then swaps the overlay to
// the confirmation state.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
const actions = vi.hoisted(() => ({
  createPatientAction: vi.fn(),
  changePatientStatusAction: vi.fn(),
  sendPatientInviteAction: vi.fn(),
}));

vi.mock('server-only', () => ({}));
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
vi.mock('@/lib/patients/actions', () => actions);
vi.mock('@/lib/patients/queries', () => ({ listPatients: vi.fn(), escapeLike: vi.fn() }));

import {
  QuickActionsBody,
  QuickActionsOverlay,
  QuickActionsPresentation,
} from '@/components/patients/QuickActionsOverlay';
import { FolderCard } from '@/components/patients/FolderCard';
import type { PatientFolderRow } from '@/lib/patients/queries';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function sourceOf(parts: string[]): string {
  return readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');
}

type PresentationOverrides = Partial<Parameters<typeof QuickActionsPresentation>[0]>;

function presentation(overrides: PresentationOverrides = {}): ReactElement {
  return createElement(QuickActionsPresentation, {
    firstName: 'Amina',
    status: 'stable',
    unlinked: true,
    canInvite: true,
    invite: null,
    copied: false,
    pending: false,
    error: null,
    onStatus: vi.fn(),
    onInvite: vi.fn(),
    onCopy: vi.fn(),
    ...overrides,
  });
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
    userId: null,
    lastActivityAt: '2026-10-07T09:30:00Z',
    age: 42,
    ...overrides,
  };
}

const roots: { root: Root; container: HTMLElement }[] = [];

function mount(element: ReactElement): HTMLElement {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  roots.push({ root, container });
  return container;
}

async function click(container: HTMLElement, label: string): Promise<void> {
  const target = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === label,
  );
  if (!target) throw new Error(`no button labelled ${label}`);
  await act(async () => {
    target.click();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  actions.changePatientStatusAction.mockResolvedValue({ ok: true });
  actions.sendPatientInviteAction.mockResolvedValue({
    ok: true,
    link: '/invite/abc123',
    shortCode: 'ABC123',
  });
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.clearAllMocks();
});

describe('QuickActionsPresentation — row visibility (04-UI-SPEC §4.6)', () => {
  it('renders all three rows for an unlinked patient when the role can invite', () => {
    const doc = parse(presentation());
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Change status');
    expect(text).toContain('Send invite');
    expect(text).toContain('Schedule appointment');
    expect(text).toContain('Available with scheduling');
    expect(doc.querySelectorAll('[role="group"][aria-label="Change status"] button').length).toBe(5);
  });

  it('hides the invite row for a role without CAN_MANAGE_MEMBERSHIP (hidden, not disabled)', () => {
    const doc = parse(presentation({ canInvite: false }));
    expect(doc.body.textContent).not.toContain('Send invite');
    expect(doc.body.textContent).toContain('Schedule appointment');
  });

  it('hides the invite row for a linked patient', () => {
    const doc = parse(presentation({ unlinked: false }));
    expect(doc.body.textContent).not.toContain('Send invite');
  });

  it('keeps the current status marked with aria-current and its Pill treatment', () => {
    const doc = parse(presentation({ status: 'critical' }));
    const current = doc.querySelector('[role="group"][aria-label="Change status"] [aria-current="true"]');
    expect(current).not.toBeNull();
    expect(current?.textContent).toBe('Critical');
    expect(current?.getAttribute('class') ?? '').toContain('shadow-raised');
    expect(doc.querySelectorAll('[aria-current="true"]').length).toBe(1);
    // The D-10 dot rides on every choice; the label ink stays textPrimary.
    expect(doc.querySelectorAll('[role="group"] .bg-critical').length).toBe(1);
    expect(doc.body.innerHTML).not.toMatch(/class="[^"]*text-critical/);
  });

  it('renders Schedule appointment as an honest disabled placeholder', () => {
    const doc = parse(presentation());
    const schedule = Array.from(doc.querySelectorAll('button')).find(
      (button) => button.textContent?.startsWith('Schedule appointment'),
    );
    expect(schedule).toBeDefined();
    expect(schedule?.getAttribute('aria-disabled')).toBe('true');
    expect(schedule?.hasAttribute('disabled')).toBe(true);
    expect(schedule?.textContent).toContain('Available with scheduling');
  });
});

describe('the invite confirmation (04-UI-SPEC §Copywriting)', () => {
  it('matches the contract verbatim', () => {
    const doc = parse(presentation({ invite: { link: '/invite/abc123', shortCode: 'ABC123' } }));
    const text = doc.body.textContent ?? '';
    expect(text).toContain('Invite ready for Amina');
    expect(text).toContain(
      'Share this link with the patient. Their account connects to this record when they sign up.',
    );
    expect(text).toContain('/invite/abc123');
    expect(text).toContain('Invite code: ABC123');
    expect(doc.querySelector('button[aria-label="Copy invite link"]')).not.toBeNull();
    expect(doc.querySelector('[aria-live="polite"]')).not.toBeNull();
  });

  it('keeps the link and the short code in tabular numerals / truncation grammar', () => {
    const doc = parse(presentation({ invite: { link: '/invite/abc123', shortCode: 'ABC123' } }));
    const link = Array.from(doc.querySelectorAll('p')).find(
      (node) => node.textContent === '/invite/abc123',
    );
    expect(link?.getAttribute('title')).toBe('/invite/abc123');
    expect(link?.getAttribute('class') ?? '').toContain('truncate');
  });
});

describe('QuickActionsBody — the two mutations (behaviour)', () => {
  it('calls changePatientStatusAction with { patientId, status } and completes', async () => {
    const onDone = vi.fn();
    const container = mount(
      createElement(QuickActionsBody, {
        patientId: 'p1',
        firstName: 'Amina',
        status: 'stable',
        unlinked: true,
        canInvite: true,
        onDone,
      }),
    );
    await click(container, 'Critical');

    expect(actions.changePatientStatusAction).toHaveBeenCalledTimes(1);
    expect(actions.changePatientStatusAction).toHaveBeenCalledWith('p1', 'critical');
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(nav.refresh).not.toHaveBeenCalled(); // the parent owns the refresh
  });

  it('calls sendPatientInviteAction and swaps to the confirmation state', async () => {
    const container = mount(
      createElement(QuickActionsBody, {
        patientId: 'p1',
        firstName: 'Amina',
        status: 'stable',
        unlinked: true,
        canInvite: true,
        onDone: vi.fn(),
      }),
    );
    await click(container, 'Send invite');

    expect(actions.sendPatientInviteAction).toHaveBeenCalledWith('p1');
    expect(container.textContent).toContain('Invite ready for Amina');
    expect(container.textContent).toContain('/invite/abc123');
    expect(container.textContent).toContain('Invite code: ABC123');
    expect(container.textContent).not.toContain('Send invite');
  });

  it('renders the neutral failure line when the invite action refuses', async () => {
    actions.sendPatientInviteAction.mockResolvedValue({ ok: false, kind: 'forbidden' });
    const container = mount(
      createElement(QuickActionsBody, {
        patientId: 'p1',
        firstName: 'Amina',
        status: 'stable',
        unlinked: true,
        canInvite: true,
        onDone: vi.fn(),
      }),
    );
    await click(container, 'Send invite');
    expect(container.textContent).toContain("Couldn't create the invite link. Try again.");
    expect(container.querySelector('.bg-critical')).not.toBeNull();
  });
});

describe('the card trigger and the copy prohibitions', () => {
  it('gives the three-dot trigger an accessible name and keeps it outside the anchor', () => {
    const doc = parse(createElement(FolderCard, { patient: row(), canInvite: true }));
    const trigger = doc.querySelector('button[aria-label="Actions for Amina"]');
    expect(trigger).not.toBeNull();
    expect(trigger?.closest('a')).toBeNull();
    expect(doc.querySelector('a button')).toBeNull();

    const source = sourceOf(['src/components/patients/FolderCard.tsx']);
    expect(source).toContain('QuickActionsOverlay');
    // The trigger is a sibling of the anchor in the JSX, never nested in it.
    expect(source.indexOf('<a href={href}')).toBeLessThan(
      source.indexOf('<QuickActionsOverlay'),
    );
  });

  it('keeps the overlay a client island on the Phase-2 Overlay primitive', () => {
    const source = sourceOf(['src/components/patients/QuickActionsOverlay.tsx']);
    expect(source).toContain("'use client'");
    expect(source).toContain('aria-disabled="true"');
    expect(source).toContain('aria-current');
    expect(source).toContain('router.refresh()');
    expect(source).toContain('changePatientStatusAction');
    expect(source).toContain('sendPatientInviteAction');
  });

  it('INV-06: no gamified vocabulary and no exclamation marks anywhere in the new copy', () => {
    const rendered = [
      presentation(),
      presentation({ canInvite: false }),
      presentation({ unlinked: false, canInvite: false }),
      presentation({ status: 'critical', error: "Couldn't change the status. Try again." }),
      presentation({ invite: { link: '/invite/abc123', shortCode: 'ABC123' }, copied: true }),
      createElement(FolderCard, { patient: row(), canInvite: true }),
      createElement(QuickActionsOverlay, {
        patientId: 'p1',
        firstName: 'Amina',
        status: 'stable',
        unlinked: true,
        canInvite: true,
      }),
    ].map((element) => parse(element).body.textContent ?? '');

    for (const text of rendered) {
      expect(text).not.toMatch(/points|level|streak|reward|celebrat/i);
      expect(text).not.toContain('!');
      expect(text).not.toMatch(/\burgent\b/i);
      expect(text).not.toMatch(/oncolog|cardiol|pediatr|specialist/i);
    }
  });
});
