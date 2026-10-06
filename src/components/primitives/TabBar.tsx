// TabBar / SegmentedControl — the workspace tab group and the range toggle
// (02-UI-SPEC.md §5.3; responsive-rules.md §4).
//
// The canonical patient-workspace tab set is exactly the eight labels in
// WORKSPACE_TABS. `Vital Signs` and `Communication` are sample content in the
// reference image and never become a route name or a tab label (AGENTS.md
// §Navigation, Phase 001 D-13).
//
// Active and inactive items carry the same ink (`text-text-primary`). Active
// state is expressed by fill plus `shadow-raised`, never by a color swap (§4.3).
// No accent is painted anywhere in the group.
//
// Below the 768px band edge the group is a horizontally scrolling pill strip
// rather than a collapsed hamburger-only pattern (responsive-rules.md §4): the
// container scrolls with `scrollbar-width: none`, every item is at least 44px
// tall, and no `tabindex` is manipulated, so the strip stays keyboard-scrollable
// and every item is reachable in DOM order.
//
// The container takes the gate-selected `INSET_FILL` from CompactControl.tsx
// rather than inlining a fill class, so a re-open of the D-27 gate is picked up
// at both call sites without an edit here.
//
// Server Component: no hook, no client directive.
import type { ReactNode } from 'react';
import { INSET_FILL } from './CompactControl';

/** The eight canonical patient-workspace tabs, in order (PRODUCT-MASTER-SPEC.md §6). */
export const WORKSPACE_TABS = [
  'Overview',
  'AI Analytics',
  'Visits',
  'Medications',
  'Labs',
  'Imaging',
  'Allergies',
  'Genetics',
] as const;

export type TabItem = {
  value: string;
  label: string;
  /** Optional leading 16px glyph, stripped by the SegmentedControl form. */
  icon?: ReactNode;
  /** When present the item renders as a link with `aria-current`, else a tab button. */
  href?: string;
};

export type TabBarProps = {
  items: readonly TabItem[];
  value: string;
  onValueChange?: (value: string) => void;
  ariaLabel: string;
  className?: string;
  /** Internal: SegmentedControl forces the label-only form (no icons). */
  allowIcons?: boolean;
};

const CONTAINER_CLASSES = [
  'flex items-center gap-xs overflow-x-auto [scrollbar-width:none]',
  INSET_FILL,
  'rounded-pill p-xs',
].join(' ');

const ITEM_BASE =
  'inline-flex min-h-11 items-center justify-center gap-xs rounded-pill px-md py-sm text-label leading-label text-text-primary';

export function TabBar({
  items,
  value,
  onValueChange,
  ariaLabel,
  className,
  allowIcons = true,
}: TabBarProps) {
  const isNavigation = items.some((item) => Boolean(item.href));
  const containerClasses = [CONTAINER_CLASSES, className].filter(Boolean).join(' ');

  const groupChildren = items.map((item) => {
    const isActive = item.value === value;
    const activeFill = isActive ? 'bg-surface-raised' : 'bg-transparent';
    const activeShadow = isActive ? 'shadow-raised' : '';
    const itemClasses = [ITEM_BASE, activeFill, activeShadow].filter(Boolean).join(' ');
    const content = (
      <>
        {allowIcons && item.icon ? item.icon : null}
        <span>{item.label}</span>
      </>
    );

    if (item.href) {
      return (
        <a
          key={item.value}
          href={item.href}
          aria-current={isActive ? 'page' : undefined}
          className={itemClasses}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        key={item.value}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={onValueChange ? () => onValueChange(item.value) : undefined}
        className={itemClasses}
      >
        {content}
      </button>
    );
  });

  if (isNavigation) {
    return (
      <nav aria-label={ariaLabel} className={containerClasses}>
        {groupChildren}
      </nav>
    );
  }

  return (
    <div role="tablist" aria-label={ariaLabel} className={containerClasses}>
      {groupChildren}
    </div>
  );
}

/** The label-only presentation variant of the same component (no icons). */
export type SegmentedControlProps = Omit<TabBarProps, 'allowIcons'>;

export function SegmentedControl(props: SegmentedControlProps) {
  return <TabBar {...props} allowIcons={false} />;
}
