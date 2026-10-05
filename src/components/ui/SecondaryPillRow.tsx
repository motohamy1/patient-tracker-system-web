"use client";

import type { IconComponent } from "./icons";

export type SecondaryPillItem = {
  id: string;
  label: string;
  icon?: IconComponent;
};

/**
 * SecondaryPillRow — the smaller capsule row plus an optional filter toggle
 * ("Office Visits · Medications · Labs · …").
 *
 * Same pill language as PrimaryPillTabs at `text-label` scale, sitting on the canvas
 * rather than the olive bar. Spacing is logical (`ms-*`), so the filter toggle lands at
 * the inline end in both LTR and RTL without a direction branch.
 */
export default function SecondaryPillRow({
  items,
  activeId,
  onChange,
  filter,
}: {
  items: SecondaryPillItem[];
  activeId: string;
  onChange: (id: string) => void;
  filter?: { label: string; pressed: boolean; onToggle: () => void };
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item) => {
        const active = item.id === activeId;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.id)}
            className={[
              "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-label transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-strong",
              "disabled:pointer-events-none disabled:opacity-40",
              active ? "bg-surface text-ink-strong" : "bg-surface-inset text-ink-muted hover:text-ink-strong",
            ].join(" ")}
          >
            {Icon ? <Icon size={14} /> : null}
            <span>{item.label}</span>
          </button>
        );
      })}
      {filter ? (
        <button
          type="button"
          aria-pressed={filter.pressed}
          onClick={filter.onToggle}
          className={[
            "ms-auto inline-flex items-center rounded-pill border border-ink-muted px-2.5 py-1 text-label transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-strong",
            "disabled:pointer-events-none disabled:opacity-40",
            filter.pressed ? "bg-ink text-surface" : "bg-transparent text-ink-muted",
          ].join(" ")}
        >
          {filter.label}
        </button>
      ) : null}
    </div>
  );
}