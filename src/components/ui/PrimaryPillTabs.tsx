"use client";

import type { IconComponent } from "./icons";

export type PrimaryPillTabItem = {
  id: string;
  /** Locale-resolved label. Never hardcoded English inside this primitive. */
  label: string;
  icon?: IconComponent;
};

/**
 * PrimaryPillTabs — ref-A's capsule tab group ("Treatment Dynamics · Vitals · …").
 *
 * The active pill is a LIGHTER, RAISED capsule on the olive bar, not an accent-filled
 * pill: the single accent is reserved for the outer field, timeline nodes, and the
 * active accent state per 01-UI-SPEC.md. Inactive pills sit on the surface fill.
 *
 * Tab semantics are real: `role="tablist"` / `role="tab"` with `aria-selected`, and the
 * active tab carries `aria-current="page"` so a router-aware consumer can style it too.
 */
export default function PrimaryPillTabs({
  items,
  activeId,
  onChange,
}: {
  items: PrimaryPillTabItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div role="tablist" aria-label="Patient workspace sections" className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-current={active ? "page" : undefined}
            onClick={() => onChange(item.id)}
            className={[
              "inline-flex items-center gap-2 rounded-pill px-3 py-1.5 text-label transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-strong",
              "disabled:pointer-events-none disabled:opacity-40",
              active
                ? "bg-surface text-ink-strong shadow-module"
                : "bg-surface-muted text-ink hover:text-ink-strong",
            ].join(" ")}
          >
            {Icon ? <Icon size={16} /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}