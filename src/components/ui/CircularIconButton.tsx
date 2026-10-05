"use client";

import type { IconComponent } from "./icons";

/**
 * CircularIconButton — ref-A's round icon-only control (the ⓧ close control).
 *
 * `label` is REQUIRED and becomes the accessible name. An icon alone is not an
 * accessible name: without it the control is announced as an unlabelled button.
 *
 * Reused standalone by NotchHeader; it stays a separate export so the gallery can
 * exercise it independently.
 */
export default function CircularIconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
}: {
  icon: IconComponent;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink-strong
        transition-opacity hover:opacity-90
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-strong
        disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon size={16} />
    </button>
  );
}