// OfflineSyncStrip unit proof (UX-03, 03-UI-SPEC §8.6): the three byte-exact
// §Copywriting messages, role=status announcement, hidden-by-default when the
// connection is up, and no interactive controls inside the strip. Mounted into
// jsdom with react-dom/client + act (the overlay idiom), because the online/
// offline listeners only exist on a real mounted tree.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { OfflineSyncStrip, STRIP_COPY } from '@/components/shell/OfflineSyncStrip';

vi.mock('motion/react', () => ({
  useReducedMotion: () => false,
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function setOnLine(value: boolean): void {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true });
}

let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('OfflineSyncStrip — UX-03 §8.6', () => {
  it('copies the three §Copywriting offline-strip lines byte-exact', () => {
    expect(STRIP_COPY.offline).toBe("You're offline. Changes will sync when the connection returns.");
    expect(STRIP_COPY.syncing).toBe('Changes are syncing.');
    expect(STRIP_COPY.synced).toBe('All changes synced.');
  });

  it('renders nothing when online and no queue is pending', () => {
    setOnLine(true);
    act(() => {
      root.render(createElement(OfflineSyncStrip));
    });
    expect(container.innerHTML).toBe('');
  });

  it('renders the offline message with role=status and a warning dot when offline', () => {
    setOnLine(false);
    act(() => {
      root.render(createElement(OfflineSyncStrip));
    });
    const strip = container.querySelector('[role="status"]');
    expect(strip).not.toBeNull();
    expect(strip?.getAttribute('aria-live')).toBe('polite');
    expect(strip?.textContent).toContain(STRIP_COPY.offline);
    const dot = strip?.querySelector('span');
    expect(dot?.getAttribute('class')).toContain('bg-warning');
  });

  it('switches to synced copy on the online event and back to offline on offline', () => {
    setOnLine(false);
    act(() => {
      root.render(createElement(OfflineSyncStrip));
    });
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain(STRIP_COPY.synced);
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    expect(container.querySelector('[role="status"]')?.textContent).toContain(STRIP_COPY.offline);
  });

  it('contains no focusable or interactive control', () => {
    setOnLine(false);
    act(() => {
      root.render(createElement(OfflineSyncStrip));
    });
    expect(container.querySelector('button, input, a, [tabindex]')).toBeNull();
  });

  it('is inserted exactly once in each workspace layout (source assertion)', () => {
    const fs = require('node:fs');
    const path = require('node:path');
    for (const layout of ['src/app/(provider)/layout.tsx', 'src/app/(patient)/layout.tsx']) {
      const source = fs.readFileSync(path.join(process.cwd(), layout), 'utf8');
      const occurrences = (source.match(/<OfflineSyncStrip \/>/g) ?? []).length;
      expect(occurrences).toBe(1);
    }
  });
});
