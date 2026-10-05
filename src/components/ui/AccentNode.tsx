/**
 * AccentNode — ref-A's filled lime circle on the timeline (Phase 5 builds on this).
 *
 * NOT the "+" quick-add node. That affordance is a DIFFERENT primitive built on `--color-ink`
 * in Phase 5; conflating the accent event node with a neutral add affordance would waste the
 * single accent on a generic control, which 01-UI-SPEC.md explicitly forbids.
 */
export default function AccentNode({ label, size = 16 }: { label?: string; size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-node bg-accent text-center text-label leading-none text-ink-strong"
      style={{ inlineSize: `${size}px`, blockSize: `${size}px` }}
      data-size={size}
    >
      {label}
    </span>
  );
}