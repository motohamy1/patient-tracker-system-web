'use client';

// useFocusTrap — the hand-rolled focus contract for the overlay (D-22,
// FOUND-04). One concern, one file, zero external dependency: no headless UI
// library, no focus-trap package, no ARIA library.
//
// Ordered algorithm (02-RESEARCH.md Pattern 5):
//   1. Capture document.activeElement BEFORE anything moves focus — that is the
//      restore target.
//   2. Mark the background inert. The overlay is portalled to document.body, so
//      its siblings are the application root and the injected script/style tags;
//      setting `inert` on the application root removes the whole page behind the
//      dialog from the tab order and the accessibility tree in one attribute.
//      That is the single biggest correctness win over a manual "collect every
//      tabbable" loop, which always misses something (contenteditable,
//      find-in-page, AT exposure).
//   3. Move focus to the first focusable inside the container, or to the
//      container itself when it holds none (the caller makes the container
//      programmatically focusable with a negative tabindex).
//   4. While active, one keydown listener handles Tab and Shift+Tab: query the
//      focusable descendants, filter to elements with a non-zero
//      getClientRects().length so hidden children are skipped, and wrap focus()
//      from the last to the first and the first to the last.
//   5. Escape invokes onDismiss.
//   6. On cleanup, remove the listener, un-`inert` the background, and restore
//      focus to the captured element ONLY if it is still connected. A trigger
//      can unmount while a dialog is open — a real failure mode in a
//      route-changing app — and without this guard focus silently falls to the
//      document body and a keyboard user loses their place
//      (02-RESEARCH.md Assumptions Log A3).
//   7. Never set a positive tabindex, and never call focus() on an element
//      outside the container.
import { useEffect, useRef, type RefObject } from 'react';

// Links, non-disabled form controls and anything carrying a non-negative
// tabindex. `[tabindex]:not([tabindex="-1"])` keeps programmatically-focusable
// negatives out of the cycle.
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export type UseFocusTrapOptions = {
  /** Trap while true; release and restore on false or unmount. */
  active: boolean;
  /** The element whose descendants are the cycle; its siblings go inert. */
  containerRef: RefObject<HTMLElement | null>;
  /** Optional explicit initial focus (e.g. the first field). */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Invoked when Escape is pressed. */
  onDismiss: () => void;
};

export function useFocusTrap({
  active,
  containerRef,
  initialFocusRef,
  onDismiss,
}: UseFocusTrapOptions): void {
  // Held in a ref so a new onDismiss identity does not re-run the trap and
  // churn focus on every parent render.
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    // 1. Capture the restore target before focus moves.
    const restoreTarget = document.activeElement as HTMLElement | null;

    // 2. Mark the background inert (siblings of the portalled container).
    const inerted: HTMLElement[] = [];
    const parent = container.parentElement;
    if (parent) {
      for (const sibling of Array.from(parent.children)) {
        if (sibling === container || !(sibling instanceof HTMLElement)) continue;
        if (!sibling.hasAttribute('inert')) {
          sibling.setAttribute('inert', '');
          inerted.push(sibling);
        }
      }
    }

    const focusableElements = (): HTMLElement[] =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getClientRects().length > 0,
      );

    // 3. Move focus into the container.
    const initial = initialFocusRef?.current ?? focusableElements()[0] ?? container;
    initial.focus();

    // 4 + 5. Tab / Shift+Tab wrap and Escape dismissal.
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismissRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const items = focusableElements();
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const isInside = current instanceof Node && container.contains(current);

      if (event.shiftKey) {
        // Shift+Tab from the first item (or from outside) wraps to the last.
        if (current === first || current === container || !isInside) {
          event.preventDefault();
          last.focus();
        }
      } else if (current === last || !isInside) {
        // Tab from the last item (or from outside) wraps to the first.
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // 6. Release everything on close or unmount.
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      for (const element of inerted) element.removeAttribute('inert');
      if (restoreTarget && restoreTarget.isConnected) restoreTarget.focus();
    };
  }, [active, containerRef, initialFocusRef]);
}
