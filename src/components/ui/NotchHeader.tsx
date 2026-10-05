"use client";

import type { ReactNode } from "react";
import CircularIconButton from "./CircularIconButton";
import { CloseIcon } from "./icons";

/**
 * NotchHeader — the ref-A title tab that breaks out of the olive bar's top edge,
 * with a circular close control at its inline start.
 *
 * `title` is a PLAIN TEXT SLOT. There is deliberately no specialty-lens affordance
 * inside the tab: that is unresolved owner decision D5 and building it now would
 * presume the answer. If D5 resolves toward a lens, it is added here.
 *
 * The tab's top corners use `rounded-t-*`, which is direction-neutral. The asymmetric
 * corner utilities are physical (`rounded-tl-*`, `rounded-br-*`) and banned; a corner
 * that must differ per side uses the logical `rounded-s-*`/`rounded-e-*` families.
 */
export default function NotchHeader({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose?: () => void;
  children?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-3 bg-frame-olive-deep px-3 pt-2">
      <div className="flex items-center gap-2 rounded-t-module bg-canvas ps-2 pe-3 py-1.5 text-heading font-semibold text-ink-strong">
        {onClose ? <CircularIconButton icon={CloseIcon} label="Close" onClick={onClose} /> : null}
        <span className="truncate">{title}</span>
      </div>
      {children ? <div className="flex items-center gap-2 pb-1.5">{children}</div> : null}
    </header>
  );
}