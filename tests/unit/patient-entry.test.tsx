// tests/unit/patient-entry.test.tsx — the add-new-patient entry proof
// (PROV-04; D-01/D-02/D-05/D-06/D-07/D-08/D-16; 04-UI-SPEC §4.5 +
// §Copywriting).
//
// Two render modes, one harness:
//  - static (renderToStaticMarkup) for every copy/layout contract — the CTA,
//    the five field labels, the MRN helper verbatim, M/F-only, no exclamation
//    marks anywhere;
//  - mounted (react-dom/client + React's act) for the two behaviours a static
//    render cannot prove — a future date of birth surfaces the exact schema
//    message and moves focus to the offending field, and a valid submit calls
//    `createPatientAction` with the IDENTITY payload only (no `mrn` key,
//    D-07) then hands back the D-06 success.
//
// `motion/react` is mocked to the no-op button and `next/navigation` to a
// recording router, exactly as tests/unit/membership-surface.test.tsx does.
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

import {
  MRN_HELPER,
  NewPatientControl,
  NewPatientForm,
} from '@/components/patients/NewPatientControl';
import { ProviderTopBar } from '@/components/shell/ProviderTopBar';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function parse(element: ReactElement): Document {
  return new DOMParser().parseFromString(renderToStaticMarkup(element), 'text/html');
}

function sourceOf(parts: string[]): string {
  return readFileSync(path.resolve(__dirname, '..', '..', parts.join('/')), 'utf8');
}

const controlSource = () => sourceOf(['src/components/patients/NewPatientControl.tsx']);
const topBarSource = () => sourceOf(['src/components/shell/ProviderTopBar.tsx']);

function setText(container: HTMLElement, id: string, value: string): void {
  const input = container.querySelector<HTMLInputElement>(`#${id}`);
  if (!input) throw new Error(`missing field ${id}`);
  // Uncontrolled fields: assigning the DOM value is the whole story — React
  // reads them back through FormData at submit time.
  input.value = value;
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

async function submit(container: HTMLElement): Promise<void> {
  const form = container.querySelector('form');
  if (!form) throw new Error('form did not render');
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

function clickSex(container: HTMLElement): void {
  const button = container.querySelector<HTMLElement>('#new-patient-sex');
  if (!button) throw new Error('sex control did not render');
  act(() => {
    button.click();
  });
}

function fillValid(container: HTMLElement): void {
  setText(container, 'new-patient-firstname', 'Amina');
  setText(container, 'new-patient-lastname', 'Hassan');
  setText(container, 'new-patient-dob', '1984-05-12');
  setText(container, 'new-patient-phone', '01000000000');
}

beforeEach(() => {
  vi.clearAllMocks();
  actions.createPatientAction.mockResolvedValue({ ok: true });
});

afterEach(() => {
  for (const { root, container } of roots.splice(0)) {
    act(() => root.unmount());
    container.remove();
  }
  vi.clearAllMocks();
});

describe('the "Add new patient" CTA (D-16)', () => {
  it('renders the label on the accentSoft primary fill, enabled', () => {
    const doc = parse(createElement(NewPatientControl, { insetFill: 'bg-surface-muted' }));
    const cta = doc.querySelector('button');
    expect(cta?.textContent).toBe('Add new patient');
    expect(cta?.getAttribute('class') ?? '').toContain('bg-accent-soft');
    expect(cta?.getAttribute('class') ?? '').toContain('text-text-primary');
    expect(cta?.hasAttribute('disabled')).toBe(false);
    // The 16px leading glyph arrives as a rendered element, not a component ref.
    expect(cta?.querySelector('svg')).not.toBeNull();
  });

  it('opens an Overlay titled exactly "Add new patient" (source assertion)', () => {
    expect(controlSource()).toContain('title="Add new patient"');
    expect(controlSource()).toContain('router.refresh()');
    expect(controlSource()).toContain('setOpen(false)');
    expect(controlSource()).toContain("'use client'");
  });

  it('the top bar renders the enabled island and no disabled primary CTA', () => {
    const doc = parse(createElement(ProviderTopBar));
    const ctas = Array.from(doc.querySelectorAll('button')).filter(
      (button) => button.textContent === 'Add new patient',
    );
    expect(ctas.length).toBe(1);
    expect(ctas[0].hasAttribute('disabled')).toBe(false);
    expect(ctas[0].getAttribute('class') ?? '').toContain('bg-accent-soft');

    const source = topBarSource();
    expect(source).toContain('<NewPatientControl');
    expect(source).not.toContain('<Button variant="primary" disabled>');
    expect(source).not.toContain('disabled>');
    expect(source).toContain('D-16');
    expect(source.includes("'use client'")).toBe(false);
  });
});

describe('the new-patient form (D-02/D-07/D-08, 04-UI-SPEC §4.5)', () => {
  const formProps = { insetFill: 'bg-surface-muted', onCancel: vi.fn(), onSuccess: vi.fn() };

  it('renders the five field labels in the UI-SPEC order', () => {
    const doc = parse(createElement(NewPatientForm, formProps));
    const text = doc.body.textContent ?? '';
    for (const label of ['First name', 'Last name', 'Date of birth', 'Sex', 'Phone']) {
      expect(text).toContain(label);
    }
    const labels = Array.from(doc.querySelectorAll('label')).map((node) => node.textContent);
    expect(labels).toEqual(['First name', 'Last name', 'Date of birth', 'Phone']);
    // Programmatic association for every text field (FOUND-04).
    expect(doc.querySelector('label[for="new-patient-firstname"]')).not.toBeNull();
    expect(doc.querySelector('label[for="new-patient-dob"]')).not.toBeNull();
    expect(doc.querySelector('[role="group"][aria-label="Sex"]')).not.toBeNull();
    // §4.5 order: date of birth before phone, sex between them in the flow.
    const flow = Array.from(
      doc.querySelectorAll('label, [role="group"][aria-label="Sex"]'),
    ).map((node) => node.getAttribute('aria-label') ?? node.textContent);
    expect(flow).toEqual(['First name', 'Last name', 'Date of birth', 'Sex', 'Phone']);
  });

  it('states the MRN helper verbatim and offers no MRN field', () => {
    const doc = parse(createElement(NewPatientForm, formProps));
    expect(doc.body.textContent).toContain(MRN_HELPER);
    expect(MRN_HELPER).toBe('The medical record number is assigned automatically.');
    expect(doc.querySelector('input[name="mrn"]')).toBeNull();
    expect(doc.querySelector('input[type="date"]')).not.toBeNull();
  });

  it('offers M and F as the only sex options', () => {
    const doc = parse(createElement(NewPatientForm, formProps));
    const options = Array.from(
      doc.querySelectorAll('[role="group"][aria-label="Sex"] button'),
    ).map((node) => node.textContent);
    expect(options).toEqual(['M', 'F']);
  });

  it('renders the footer contract: "Add patient" primary + "Cancel" ghost', () => {
    const doc = parse(createElement(NewPatientForm, formProps));
    const buttons = Array.from(doc.querySelectorAll('button'));
    const submitButton = buttons.find((button) => button.textContent === 'Add patient');
    const cancelButton = buttons.find((button) => button.textContent === 'Cancel');
    expect(submitButton?.getAttribute('type')).toBe('submit');
    expect(submitButton?.getAttribute('class') ?? '').toContain('bg-accent-soft');
    expect(cancelButton?.getAttribute('type')).toBe('button');
    expect(cancelButton?.getAttribute('class') ?? '').toContain('rounded-pill');
  });

  it('contains no exclamation mark anywhere in its rendered text', () => {
    for (const element of [
      createElement(NewPatientControl, { insetFill: 'bg-surface-muted' }),
      createElement(NewPatientForm, formProps),
      createElement(ProviderTopBar),
    ]) {
      const text = parse(element).body.textContent ?? '';
      expect(text).not.toContain('!');
    }
  });
});

describe('the new-patient flow (behaviour)', () => {
  it('rejects a date of birth that is not in the past and focuses that field', async () => {
    const container = mount(
      createElement(NewPatientForm, {
        insetFill: 'bg-surface-muted',
        onCancel: vi.fn(),
        onSuccess: vi.fn(),
      }),
    );
    fillValid(container);
    setText(container, 'new-patient-dob', '2099-01-01');
    clickSex(container);
    await submit(container);

    expect(container.textContent).toContain('Enter a date of birth in the past.');
    expect(document.activeElement?.id).toBe('new-patient-dob');
    expect(actions.createPatientAction).not.toHaveBeenCalled();
  });

  it('renders the generic line for a field with no specific schema message', async () => {
    const container = mount(
      createElement(NewPatientForm, {
        insetFill: 'bg-surface-muted',
        onCancel: vi.fn(),
        onSuccess: vi.fn(),
      }),
    );
    // Sex untouched → the enum issue carries no custom sentence → generic.
    setText(container, 'new-patient-firstname', 'Amina');
    setText(container, 'new-patient-lastname', 'Hassan');
    setText(container, 'new-patient-dob', '1984-05-12');
    setText(container, 'new-patient-phone', '01000000000');
    await submit(container);

    expect(container.textContent).toContain('Check this field and try again.');
    expect(actions.createPatientAction).not.toHaveBeenCalled();
  });

  it('submits the identity payload only — no MRN key (D-02/D-07)', async () => {
    const onSuccess = vi.fn();
    const container = mount(
      createElement(NewPatientForm, {
        insetFill: 'bg-surface-muted',
        onCancel: vi.fn(),
        onSuccess,
      }),
    );
    fillValid(container);
    clickSex(container);
    await submit(container);

    expect(actions.createPatientAction).toHaveBeenCalledTimes(1);
    const payload = actions.createPatientAction.mock.calls[0][0];
    expect(payload).toEqual({
      firstName: 'Amina',
      lastName: 'Hassan',
      dob: '1984-05-12',
      sex: 'M',
      phone: '01000000000',
    });
    expect(Object.keys(payload)).not.toContain('mrn');
    expect(Object.keys(payload)).not.toContain('status');
    // D-06: success hands back to the control, which closes and refreshes.
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('shows the neutral failure line when the action refuses (forbidden/error)', async () => {
    actions.createPatientAction.mockResolvedValue({ ok: false, kind: 'forbidden' });
    const container = mount(
      createElement(NewPatientForm, {
        insetFill: 'bg-surface-muted',
        onCancel: vi.fn(),
        onSuccess: vi.fn(),
      }),
    );
    fillValid(container);
    clickSex(container);
    await submit(container);

    expect(container.textContent).toContain("Couldn't add this patient. Try again.");
    expect(container.textContent).not.toContain('!');
  });
});
