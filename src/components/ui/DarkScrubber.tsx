import type { ReactNode } from "react";

/**
 * DarkScrubber — ref-A's near-black rounded band with a lighter highlighted window,
 * the primitive the Phase 5 timeline scrubber builds on.
 *
 * The window is positioned with LOGICAL `insetInlineStart`, so it tracks the inline axis
 * in both LTR and RTL. The timeline axis itself stays chronological left→right even
 * inside an RTL page (locked decision, 01-UI-SPEC.md RTL Contract); Phase 5 forces that
 * with an explicit direction on the axis container, never by weakening this primitive.
 */
export default function DarkScrubber({
  children,
  windowStart = 0,
  windowWidth = 100,
}: {
  children?: ReactNode;
  /** Percent along the inline axis, 0–100. */
  windowStart?: number;
  /** Percent of the band width, 0–100. */
  windowWidth?: number;
}) {
  return (
    <div className="relative flex h-2 w-full items-center overflow-hidden rounded-pill bg-ink">
      <span
        aria-hidden="true"
        className="absolute h-full rounded-pill bg-ink-muted"
        style={{ insetInlineStart: `${windowStart}%`, inlineSize: `${windowWidth}%` }}
      />
      {children ? <div className="relative z-10 w-full px-2 text-label text-surface">{children}</div> : null}
    </div>
  );
}