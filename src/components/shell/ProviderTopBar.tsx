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
//
// THE IDENTITY CLUSTER (D-28, 2026-10-10): the bar used to render a
// placeholder — an empty disc, the word "Provider" and "Not signed in" —
// which read as an unfinished surface. The signed-in clinician is now
// resolved server-side (the layout's own resolution for the role, the auth
// claims for the name) and the cluster shows the reference's composition:
// initials disc + name + role label, with the chevron aria-hidden (there is
// no profile menu yet, and a chevron that lies is worse than none). Roles
// that carry no display name fall back to the role label; an unauthenticated
// visitor never reaches this bar (the layout's D-12 redirect runs first).
import { Bell, ChevronDown } from 'lucide-react';
import { Button, makeIcon } from '@/components/primitives';
import { CompactControl, INSET_FILL } from '@/components/primitives/CompactControl';
import { NewPatientControl } from '@/components/patients/NewPatientControl';
import type { WorkspaceResolution } from '@/lib/auth/workspace';
import type { Role } from '@/lib/auth/roles';

// The glyphs are rendered HERE, as elements, and passed to `Button` as children:
// a component reference (the `icon` prop) is a function and cannot cross the
// Server-to-Client boundary into the client `Button`, but a rendered element can.
const BellGlyph = makeIcon(Bell);
const ChevronGlyph = makeIcon(ChevronDown);

/** The role label the identity cluster shows (sentence case, §7 copy). */
const ROLE_LABELS: Record<Role, string> = {
  provider_doctor: 'Doctor',
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  admin_owner: 'Organization owner',
  patient: 'Patient',
};

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '··';
  const first = parts[0].charAt(0);
  const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
  return `${first}${last}`.toUpperCase();
}

export function ProviderTopBar({
  resolution,
  displayName,
}: {
  /** The layout's verified resolution (the role label's source). */
  resolution: WorkspaceResolution;
  /** The clinician's display name, or null when the claims carry none. */
  displayName: string | null;
}) {
  const role = resolution.kind === 'signed-in' ? resolution.role : null;
  const roleLabel = role !== null ? ROLE_LABELS[role] : 'Care team';
  const name = displayName ?? roleLabel;
  const initials = initialsOf(name);

  return (
    <header className="flex items-center gap-md bg-frame px-lg min-h-[calc(var(--spacing-2xl)*2)]">
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="provider-search"
        placeholder="Search patients"
        className="max-w-lg flex-1 max-md:hidden"
      />
      <div className="ml-auto flex items-center gap-md">
        <NewPatientControl insetFill={INSET_FILL} />
        <Button variant="iconOnly" ariaLabel="Notifications">
          <BellGlyph size="lg" />
        </Button>
        {/* The identity cluster: initials + name + role, completing the bar's
            trailing edge (the reference's "Dr. Eleanor Vance · Doctor menu"). */}
        <div className="flex items-center gap-sm">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-label leading-label font-semibold text-text-primary"
          >
            {initials}
          </span>
          <span className="flex flex-col">
            <span className="text-body font-semibold leading-body text-text-primary">{name}</span>
            <span className="text-label leading-label text-text-secondary">{roleLabel}</span>
          </span>
          <ChevronGlyph size="sm" />
        </div>
      </div>
    </header>
  );
}
