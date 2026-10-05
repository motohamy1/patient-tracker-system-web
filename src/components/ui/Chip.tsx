import type { IconComponent } from "./icons";

/**
 * Chip — ref-A's fully rounded capsule: a line icon, a record type, and a date.
 *
 * GLYPH RULE (constitution, applies from Phase 6 onward): a chip must NEVER carry
 * clinical images, results, or diagnoses. Only record types, line icons, and dates.
 * A chip is a label, not a data surface.
 */
export default function Chip({
  icon: Icon,
  label,
  meta,
}: {
  icon?: IconComponent;
  label: string;
  meta?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-pill bg-surface-inset px-3 py-1 text-label text-ink-strong">
      {Icon ? <Icon size={14} /> : null}
      <span>{label}</span>
      {meta ? <span className="text-ink-muted">{meta}</span> : null}
    </span>
  );
}