// ProviderTopBar — the provider route group's top bar (02-UI-SPEC.md §6.3).
// Server Component: no hook, no client directive.
//
// `frame` fill; a height of two stacked `space.2xl` steps; one step of inline
// padding (space.lg) and one step of gap (space.md) in a flex row.
//
// INK RULE: the profile name and role are painted `textPrimary`, NEVER
// `frameForeground`. At the frozen values `frameForeground` measures about
// 1.8:1 against `frame` and is confined to frame decoration, so it can never
// carry a label; every label and control in this bar is `textPrimary`
// (02-UI-SPEC.md §4.3 and §6.3).
//
// The primary CTA is LIVE as of Phase 004: D-16 owns "Add new patient" in
// `accentSoft` gold, and the client island `NewPatientControl` owns the modal
// (D-05) and the create → close → refresh flow (D-06). This bar stays a
// Server Component — the island is imported and rendered here, and its leading
// glyph crosses the boundary as a rendered element, never a component
// reference (02-CONTEXT). The top-bar CTA exists on every provider route: a
// create from a non-home route simply closes the modal and refreshes, because
// D-06 binds exactly on /provider, where the new folder card appears.
import { Bell, ChevronDown } from 'lucide-react';
import { Button, makeIcon } from '@/components/primitives';
import { CompactControl, INSET_FILL } from '@/components/primitives/CompactControl';
import { NewPatientControl } from '@/components/patients/NewPatientControl';

// The glyphs are rendered HERE, as elements, and passed to `Button` as children:
// a component reference (the `icon` prop) is a function and cannot cross the
// Server-to-Client boundary into the client `Button`, but a rendered element can.
const BellGlyph = makeIcon(Bell);
const ChevronGlyph = makeIcon(ChevronDown);

export function ProviderTopBar() {
  return (
    <header className="flex items-center gap-md bg-frame px-lg min-h-[calc(var(--spacing-2xl)*2)]">
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="provider-search"
        placeholder="Search patients"
        className="max-md:hidden"
      />
      <div className="ml-auto flex items-center gap-md">
        <NewPatientControl insetFill={INSET_FILL} />
        <Button variant="iconOnly" ariaLabel="Notifications">
          <BellGlyph size="lg" />
        </Button>
        <div className="flex items-center gap-sm">
          <span aria-hidden="true" className="size-11 shrink-0 rounded-pill bg-surface-raised" />
          <span className="flex flex-col">
            <span className="text-body font-regular leading-body text-text-primary">Provider</span>
            <span className="text-label font-regular leading-label text-text-primary">
              Not signed in
            </span>
          </span>
          <ChevronGlyph size="sm" />
        </div>
      </div>
    </header>
  );
}
