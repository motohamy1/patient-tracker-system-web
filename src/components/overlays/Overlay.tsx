'use client';

// Overlay — one primitive with two presentations (D-22, D-23, 02-UI-SPEC.md §5.6).
//
// One component renders a centered modal at and above the 1024px band edge and a
// bottom sheet below it. The flip is a stock `max-lg:` responsive prefix against
// Tailwind's default `lg` breakpoint, which is 64rem — exactly 1024px at a 16px
// root font size — so no `@custom-variant` and no `--breakpoint-*` token is
// introduced (02-RESEARCH.md Open Questions 3 and 4). A second overlay form is
// forbidden: there is no `variant` prop and no `Popover`/`Drawer`/`Tooltip`
// sibling, so a later phase cannot fork the modal from the sheet (T-02-47).
//
// It is rendered through `createPortal(…, document.body)`, guarded by a
// mounted effect, so the dialog is never a descendant of a transformed or
// `overflow: hidden` ancestor, which would clip a centered overlay and break
// fixed positioning (02-RESEARCH.md Pattern 4).
//
// Scrim: its background resolves to `textPrimary` at reduced opacity through the
// generated token utility's alpha modifier. `INV-17` forbids a new scrim token —
// the scrim is `textPrimary` with alpha only (T-02-46).
//
// Dialog semantics: the panel carries `role="dialog"`, `aria-modal="true"` and
// `aria-labelledby` pointing at its own title element. `inert` (set by the focus
// trap) is what enforces modality; `aria-modal` is what tells assistive
// technology, and both ship (T-02-49).
//
// Motion routes through `useShellMotion()` alone: the panel uses the module's
// `fadeAndLift()` pair at the slow duration, standard curve entering and exit
// curve leaving; under reduction the pair is opacity-only at the fast duration,
// which is exactly what the module returns. This component never declares its
// own duration or its own reduced branch.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type TargetAndTransition, type Transition } from 'motion/react';
import { X } from 'lucide-react';
import { useShellMotion } from '@/lib/motion';
import { Button, Surface } from '@/components/primitives';
import { useFocusTrap } from './useFocusTrap';
import { useScrollLock } from './useScrollLock';

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
};

export function Overlay({ open, onClose, title, description, children, footer }: OverlayProps) {
  const [mounted, setMounted] = useState(false);
  const overlayRootRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const shell = useShellMotion();

  // Portal only after mount so the server render never touches `document`.
  useEffect(() => {
    setMounted(true);
  }, []);

  // The full accessibility contract is delegated, never re-implemented inline.
  // `active` is gated on `mounted`: the portal (and therefore the container the
  // traps read) only exists on the client, so activating before that would run
  // the effects against a null ref and never re-run them (the deps would not
  // change when the ref later populates).
  const engaged = open && mounted;
  useScrollLock({ active: engaged });
  useFocusTrap({ active: engaged, containerRef: overlayRootRef, onDismiss: onClose });

  if (!mounted) return null;

  const panelMotion = shell.fadeAndLift();
  // `shell.ease()` returns the four generated curve numbers; motion's transition
  // type wants the cubic-bezier tuple, so the assertion is a width, not a value.
  const easeIn = shell.ease() as [number, number, number, number];
  const easeOut = shell.ease(true) as [number, number, number, number];
  const enterTransition: Transition = { duration: shell.duration('slow'), ease: easeIn };
  const exitTarget: TargetAndTransition = {
    ...panelMotion.exit,
    transition: { duration: shell.duration('slow'), ease: easeOut },
  };

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="overlay"
          ref={overlayRootRef}
          tabIndex={-1}
          className="fixed inset-0 z-50 flex items-center justify-center p-xl max-lg:items-end max-lg:p-md"
        >
          <motion.div
            aria-hidden="true"
            className="absolute inset-0 bg-text-primary/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shell.duration('fast'), ease: easeIn }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-[32rem]"
            initial={panelMotion.initial}
            animate={panelMotion.animate}
            exit={exitTarget}
            transition={enterTransition}
          >
            <Surface variant="surfaceRaised" className="shadow-overlay max-lg:rounded-b-none">
              <div className="flex flex-col gap-lg">
                <div className="flex items-start justify-between gap-lg">
                  <h2
                    id={titleId}
                    className="text-heading font-semibold leading-heading text-text-primary"
                  >
                    {title}
                  </h2>
                  <Button
                    variant="iconOnly"
                    ariaLabel="Close dialog"
                    icon={X}
                    onClick={onClose}
                  />
                </div>
                {description ? (
                  <p className="text-body leading-body text-text-primary">{description}</p>
                ) : null}
                {children ? <div>{children}</div> : null}
                {footer ? <div className="flex justify-end gap-sm">{footer}</div> : null}
              </div>
            </Surface>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
