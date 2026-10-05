import type { ReactNode } from "react";

/**
 * AppFrame — the ref-A outer composition: the single accent field with the olive
 * rounded frame inset inside it (FND-03).
 *
 * The frame radius comes from `--radius-frame`, never a literal 28px, so a later
 * owner-approved radius change moves the shell without touching this file.
 *
 * Presentational only: no state, no handlers, so it stays a Server Component.
 */
export default function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-accent p-2 md:p-4">
      <div className="rounded-frame bg-frame-olive p-2 md:p-3">{children}</div>
    </div>
  );
}