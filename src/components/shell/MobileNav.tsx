// MobileNav — the below-768px navigation strip (02-UI-SPEC.md §6.6, UX-06).
// Server Component: no hook, no client directive.
//
// A horizontally scrolling PILL STRIP, never a hamburger-only collapse on a
// surface where tabs are primary (docs/governance/responsive-rules.md §4). The
// strip scrolls with `scrollbar-width: none` and stays keyboard-scrollable:
// every item is a real anchor in DOM order and no tabindex is manipulated.
//
// Every item is at least 44px tall in both axes — a touch-target size, not a
// spacing value (INV-10 exception; responsive-rules.md §4). The provider home
// renders one item ("Home"); a workspace surface can render the eight canonical
// tabs by passing a different item list.
//
// The search field collapses to a 44px icon-only control that expands in place
// and is never removed. The affordance is a native `<details>` disclosure, so it
// works with no client JavaScript and is not a dead control. Below the 768px
// band edge the full search field in the top bar is hidden (`max-md:hidden`) and
// this collapsed control takes over.
import { Search } from 'lucide-react';
import { makeIcon } from '@/components/primitives';
import { CompactControl } from '@/components/primitives/CompactControl';

export type MobileNavItem = { value: string; label: string; href: string };

const SearchGlyph = makeIcon(Search);

const STRIP_ITEM_BASE =
  'inline-flex min-h-11 shrink-0 items-center justify-center gap-xs rounded-pill px-md py-sm text-label leading-label text-text-primary';

export function MobileNav({
  items,
  activeValue,
  ariaLabel,
}: {
  items: readonly MobileNavItem[];
  activeValue: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-col gap-sm bg-frame px-lg py-sm md:hidden">
      <details>
        <summary
          aria-label="Search patients"
          className="inline-flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-pill bg-surface-muted p-sm text-text-primary [&::-webkit-details-marker]:hidden"
        >
          <SearchGlyph size="lg" />
        </summary>
        <div className="pt-sm">
          <CompactControl
            variant="search"
            label="Search patients"
            inputId="mobile-search"
            placeholder="Search patients"
            className="w-full"
          />
        </div>
      </details>
      <nav
        aria-label={ariaLabel}
        className="flex items-center gap-sm overflow-x-auto [scrollbar-width:none]"
      >
        {items.map((item) => {
          const isActive = item.value === activeValue;
          const classes = [
            STRIP_ITEM_BASE,
            isActive ? 'bg-surface-raised shadow-raised' : 'bg-transparent',
          ].join(' ');
          return (
            <a
              key={item.value}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={classes}
            >
              {item.label}
            </a>
          );
        })}
      </nav>
    </div>
  );
}
