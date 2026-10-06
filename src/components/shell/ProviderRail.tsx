// ProviderRail — the persistent left icon rail for the provider route group
// (D-02, 02-UI-SPEC.md §6.2). Server Component: no hook, no client directive.
//
// The rail is the `frame` field; the `canvas` content column to its right
// belongs to the (provider) layout, so the rail never paints the page field.
//
// Rail width is composed entirely of on-scale steps: one step of rail padding
// (space.sm) plus a `space.2xl` content column. The total is a LAYOUT DIMENSION,
// not a spacing value, and is deliberately never written as a spacing token
// (02-UI-SPEC.md §5, exceptions).
//
// NO accent marker is painted in the rail: the reference shows a fill highlight
// and no accent bar, and accent permission for an active-emphasis marker
// (02-UI-SPEC.md §4) is deliberately left unused here — INV-05 restraint wins.
// The active item is `bg-surface-raised` + `shadow-raised` with
// `aria-current="page"`; every other item is transparent.
//
// Every item is an anchor, never the `Button` primitive: a rail item navigates,
// and a button with no destination would be a dead control. The items keep the
// `Button` `iconOnly` geometry — radius.pill, 44px in BOTH axes at every band,
// ink `textPrimary` — so the rail and the button set share one look.
//
// Every icon-only item ships an accessible name through the anchor's
// `aria-label`, and the glyph itself stays decorative (aria-hidden) so it never
// double-names the control (FOUND-04).
import type { LucideIcon } from 'lucide-react';
import { CalendarDays, ChartLine, FolderClosed, Home, Users } from 'lucide-react';
import { makeIcon } from '@/components/primitives';

type RailSource = { key: string; label: string; href: string; icon: LucideIcon };
type RailItem = { key: string; label: string; href: string; Glyph: ReturnType<typeof makeIcon> };

// Built once at module load: rebuilding an icon wrapper per render would remount
// the glyph (Icon.tsx, D-21). The five thin-line icons are home, patients,
// schedule, records and analytics, matching the reference rail density.
const RAIL_SOURCE: readonly RailSource[] = [
  { key: 'home', label: 'Home', href: '/provider', icon: Home },
  { key: 'patients', label: 'Patients', href: '/provider', icon: Users },
  { key: 'schedule', label: 'Schedule', href: '/provider', icon: CalendarDays },
  { key: 'records', label: 'Records', href: '/provider', icon: FolderClosed },
  { key: 'analytics', label: 'Analytics', href: '/provider', icon: ChartLine },
];

const RAIL_ITEMS: readonly RailItem[] = RAIL_SOURCE.map(({ icon, ...rest }) => ({
  ...rest,
  Glyph: makeIcon(icon),
}));

const RAIL_ITEM_BASE =
  'inline-flex items-center justify-center gap-xs rounded-pill min-h-11 min-w-11 p-sm text-text-primary';

export function ProviderRail({ activeKey = 'home' }: { activeKey?: string }) {
  return (
    <nav
      aria-label="Provider navigation"
      className="flex shrink-0 flex-col items-center gap-sm bg-frame px-sm py-lg max-md:hidden"
    >
      <div className="flex w-[var(--spacing-2xl)] flex-col items-center gap-sm">
        {RAIL_ITEMS.map(({ key, label, href, Glyph }) => {
          const isActive = key === activeKey;
          const classes = [
            RAIL_ITEM_BASE,
            isActive ? 'bg-surface-raised shadow-raised' : 'bg-transparent',
          ].join(' ');
          return (
            <a
              key={key}
              href={href}
              aria-label={label}
              aria-current={isActive ? 'page' : undefined}
              className={classes}
            >
              <Glyph size="lg" />
            </a>
          );
        })}
      </div>
    </nav>
  );
}
