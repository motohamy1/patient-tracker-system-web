// Scroll-lock tests for the Overlay (D-22, T-02-48). Mounted into jsdom with
// `react-dom/client` + React's `act`, because the lock is an effect side effect
// on the document root and only exists on a mounted tree. `motion/react` is
// mocked at the module boundary so no animation frame is needed.
//
// The contract under test: `overflow: hidden` is paired with
// `scrollbar-gutter: stable`, and both are restored — so locking never shifts
// layout by the scrollbar width and never leaves residue after close or unmount.
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

type HarnessProps = { open: boolean; onClose: () => void };

function Harness({ open, onClose }: HarnessProps) {
  return (
    <div>
      <Overlay open={open} onClose={onClose} title="Panel title">
        <p>Body</p>
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
  document.documentElement.style.overflow = '';
  document.documentElement.style.scrollbarGutter = '';
});

describe('Overlay — the document scroll lock (T-02-48)', () => {
  it('sets overflow hidden and a stable gutter while open, and restores both after close', () => {
    const onClose = vi.fn();
    render({ open: false, onClose });
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.documentElement.style.scrollbarGutter).toBe('');

    render({ open: true, onClose });
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(document.documentElement.style.scrollbarGutter).toBe('stable');

    render({ open: false, onClose });
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.documentElement.style.scrollbarGutter).toBe('');
  });

  it('leaves no residue after unmounting while still open', () => {
    render({ open: true, onClose: vi.fn() });
    expect(document.documentElement.style.overflow).toBe('hidden');

    unmount();
    expect(document.documentElement.style.overflow).toBe('');
    expect(document.documentElement.style.scrollbarGutter).toBe('');
  });
});
