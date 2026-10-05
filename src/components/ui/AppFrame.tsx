import type { ReactNode } from "react";

/**
 * AppFrame — the ref-A outer composition: the single accent field with the olive
 * rounded frame inset inside it (FND-03).
 *
 * The frame radius comes from `--radius-frame`, never a literal 28px, so a later
 * owner-approved radius change moves the shell without touching this file.
 *
 * `fill` (default true) IS the page-level shell contract: the accent field covers the
 * whole viewport. The opt-out exists for one caller only — the `frame` specimen in the
 * design gallery, which embeds this same primitive inside an already-laid-out section
 * and therefore must be bounded by that section instead of the viewport. There is
 * deliberately NO generic `className` passthrough: that would let any caller quietly
 * unmake the shell, which is the one thing this primitive owns.
 *
 * Presentational only: no state, no handlers, so it stays a Server Component.
 */
export default function AppFrame({
  children,
  fill = true,
}: {
  children: ReactNode;
  fill?: boolean;
}) {
  return (
    <div className={["bg-accent p-2 md:p-4", fill ? "min-h-dvh" : ""].join(" ").trim()}>
      <div className="rounded-frame bg-frame-olive p-2 md:p-3">{children}</div>
    </div>
  );
}