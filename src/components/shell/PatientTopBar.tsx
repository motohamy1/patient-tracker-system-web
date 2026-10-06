// PatientTopBar — the patient route group's top bar (02-UI-SPEC.md §6.5).
// Server Component: no hook, no client directive.
//
// NO PERSISTENT SIDEBAR. Patient surfaces have no persistent rail or sidebar
// (docs/governance/reference-ui-specification.md §6). The top bar is the whole
// of the patient chrome; it carries a menu `Button` `iconOnly` on the left and,
// right-aligned, the label "Patient", an avatar with a state dot and a bell.
// There is NO CTA on this bar.
//
// `frame` fill; a height of two stacked `space.2xl` steps; one step of inline
// padding (space.lg) and one step of gap (space.md) in a flex row — the same
// shell geometry as the provider bar.
//
// INK RULE (02-UI-SPEC.md §4.3): every label is painted `textPrimary`. The state
// dot is DECORATIVE — it is `aria-hidden` and carries no meaning on its own —
// and the "Patient" label carries the meaning textually, exactly as §4.3
// requires ("status is carried by text, never by hue alone"). The dot is
// `success` as a decorative tint only, never an information channel.
//
// Below the 768px band edge the header area holds the scrolling pill strip
// wherever a tab set exists (02-UI-SPEC.md §6.6). In this phase the patient
// surfaces have no primary tab set, so the menu control is the single
// navigation affordance for a tab set and is explicitly NOT a hamburger-only
// collapse of a tab set (responsive-rules.md §4).
//
// The menu and bell glyphs are rendered HERE, as elements, and passed to the
// client `Button` as children: a component reference (the `icon` prop) is a
// function and cannot cross the Server-to-Client boundary, but a rendered
// element can (see plan 02-08, ProviderTopBar).
import { Bell, Menu } from 'lucide-react';
import { Button, makeIcon } from '@/components/primitives';

const MenuGlyph = makeIcon(Menu);
const BellGlyph = makeIcon(Bell);

export function PatientTopBar() {
  return (
    <header className="flex items-center gap-md bg-frame px-lg min-h-[calc(var(--spacing-2xl)*2)]">
      <Button variant="iconOnly" ariaLabel="Open patient navigation">
        <MenuGlyph size="lg" />
      </Button>
      <div className="ml-auto flex items-center gap-md">
        <span className="text-body font-regular leading-body text-text-primary">Patient</span>
        <span className="relative inline-flex shrink-0">
          <span aria-hidden="true" className="size-11 rounded-pill bg-surface-raised" />
          <span
            aria-hidden="true"
            className="absolute bottom-0 end-0 size-2 rounded-pill bg-success"
          />
        </span>
        <Button variant="iconOnly" ariaLabel="Notifications">
          <BellGlyph size="lg" />
        </Button>
      </div>
    </header>
  );
}
