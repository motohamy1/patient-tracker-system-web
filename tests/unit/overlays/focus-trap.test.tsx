// Focus-trap / accessibility contract tests for the Overlay (D-22, FOUND-04,
// T-02-43/44/45/49). These mount the real Overlay into jsdom with
// `react-dom/client` + React's `act` — the effects, focus movement and `inert`
// attribute only exist on a mounted tree, so a static render cannot prove them.
// `motion/react` is mocked at the module boundary (as tests/unit/primitives/*.tsx
// do) so no animation frame is needed and the DOM is deterministic; cells render
// as real <div>/<button>.
//
// jsdom implements no layout, so `Element.getClientRects()` returns nothing and
// the trap's visibility filter would drop every child. The test stubs it to a
// non-empty rect so the trap's real selector/filter/wrap code runs; the
// "hidden children are skipped" behaviour itself is not reproducible in jsdom and
// is left to the reviewer.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement, Fragment, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Overlay } from '@/components/overlays/Overlay';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
  AnimatePresence: ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children),
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

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type HarnessProps = {
  open: boolean;
  onClose: () => void;
  showTrigger?: boolean;
};

function Harness({ open, onClose, showTrigger = true }: HarnessProps) {
  return (
    <div id="app-root">
      {showTrigger ? <button id="trigger">Open overlay</button> : null}
      <Overlay open={open} onClose={onClose} title="Panel title" description="Panel description">
        <button id="inside-1">First</button>
        <button id="inside-2">Second</button>
      </Overlay>
    </div>
  );
}

let root: Root;
let container: HTMLDivElement;
let alive: boolean;

function render(props: HarnessProps): void {
  act(() => {
    root.render(createElement(Harness, props));
  });
}

function unmount(): void {
  if (!alive) return;
  act(() => {
    root.unmount();
  });
  alive = false;
}

function panel(): HTMLElement {
  const el = document.querySelector('[role="dialog"]');
  if (!(el instanceof HTMLElement)) throw new Error('Overlay rendered no dialog panel');
  return el;
}

function panelButtons(): HTMLButtonElement[] {
  return Array.from(panel().querySelectorAll('button'));
}

function pressKey(key: string, target: Element, shiftKey = false): void {
  act(() => {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }),
    );
  });
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'getClientRects', {
    configurable: true,
    value: () => [{ width: 1, height: 1 }] as unknown as DOMRectList,
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  alive = true;
});

afterEach(() => {
  unmount();
  container.remove();
});

describe('Overlay — focus moves into the panel and cycles (T-02-43/44)', () => {
  it('moves focus into the panel on open, not onto the document body', () => {
    render({ open: false, onClose: vi.fn() });
    (document.getElementById('trigger') as HTMLButtonElement).focus();

    render({ open: true, onClose: vi.fn() });

    expect(document.activeElement).not.toBe(document.body);
    expect(panel().contains(document.activeElement)).toBe(true);
  });

  it('wraps Tab forward from the last focusable to the first', () => {
    render({ open: false, onClose: vi.fn() });
    (document.getElementById('trigger') as HTMLButtonElement).focus();
    render({ open: true, onClose: vi.fn() });

    const buttons = panelButtons();
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    last.focus();
    expect(document.activeElement).toBe(last);
    pressKey('Tab', last);
    expect(document.activeElement).toBe(first);
  });

  it('wraps Shift+Tab backward from the first focusable to the last', () => {
    render({ open: false, onClose: vi.fn() });
    (document.getElementById('trigger') as HTMLButtonElement).focus();
    render({ open: true, onClose: vi.fn() });

    const buttons = panelButtons();
    const first = buttons[0];
    const last = buttons[buttons.length - 1];

    first.focus();
    expect(document.activeElement).toBe(first);
    pressKey('Tab', first, true);
    expect(document.activeElement).toBe(last);
  });

  it('invokes the dismiss callback on Escape', () => {
    const onClose = vi.fn();
    render({ open: true, onClose });

    pressKey('Escape', panel());
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('Overlay — focus restore and the inert background (T-02-43/45)', () => {
  it('restores focus to the trigger after close', () => {
    const onClose = vi.fn();
    render({ open: false, onClose });
    const trigger = document.getElementById('trigger') as HTMLButtonElement;
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    render({ open: true, onClose });
    expect(document.activeElement).not.toBe(trigger);

    render({ open: false, onClose });
    expect(document.activeElement).toBe(trigger);
  });

  it('marks the background inert while open and clears it after close', () => {
    const onClose = vi.fn();
    render({ open: true, onClose });
    expect(container.hasAttribute('inert')).toBe(true);

    render({ open: false, onClose });
    expect(container.hasAttribute('inert')).toBe(false);
  });

  it('does not throw when the trigger unmounts while the dialog is open', () => {
    const onClose = vi.fn();
    render({ open: false, onClose });
    (document.getElementById('trigger') as HTMLButtonElement).focus();

    render({ open: true, onClose });
    // The trigger is removed from the document while the dialog stays open.
    render({ open: true, onClose, showTrigger: false });
    expect(document.getElementById('trigger')).toBeNull();

    expect(() => render({ open: false, onClose, showTrigger: false })).not.toThrow();
  });
});
