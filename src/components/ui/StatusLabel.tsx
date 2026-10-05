import type { ReactNode } from "react";

/**
 * StatusLabel — a small neutral label.
 *
 * OWNER DECISION: STATUS COLOR IS NOT YET APPROVED.
 *
 * ref-A contains no status color at all; it is a single-accent composition with neutral
 * surfaces. So this primitive ships NEUTRAL ONLY, using ink tokens. The `critical` tone
 * named in the type is intentionally NOT implemented and must not be until the owner
 * approves a status hue. Specifically forbidden, from the pack: ref-B1's pastel alert
 * block. Phases 2 (identity/RLS) and 15 (Needs Attention) are where status color becomes
 * a live question.
 */
export default function StatusLabel({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "critical";
}) {
  void tone; // Reserved for the approved critical variant; see the OWNER DECISION note above.
  return (
    <span className="inline-flex items-center rounded-pill bg-surface-inset px-2 py-0.5 text-label text-ink-muted">
      {children}
    </span>
  );
}