// WorkspaceTopBar — the patient-workspace top bar (02-UI-SPEC.md §6.4).
// Server Component: no hook, no client directive.
//
// The same shell as `ProviderTopBar`, with the tab group in the CTA position and
// the patient context in the profile position. The tab set is EXACTLY the eight
// from `WORKSPACE_TAB_ROUTES`; this bar is the tab group's host, so the workspace
// layout does not duplicate it.
//
// The active tab is supplied by the owning route: each tab page renders this bar
// with its own `activeSlug`, because an App Router layout cannot read its child
// segment and this project forbids middleware and client-side role/path reads.
// The `[patientId]` parameter is consumed only through `tabHref` — never
// rendered, and never passed to a query, a path, a template, a log or any
// interpreter (ASVS V5, T-02-52).
//
// Every label is `textPrimary`, never `frameForeground` (§4.3, §6.3); the tab
// group paints no accent (INV-05).
import { TabBar } from '@/components/primitives/TabBar';
import type { TabItem } from '@/components/primitives/TabBar';
import { makeIcon } from '@/components/primitives';
import { CompactControl } from '@/components/primitives/CompactControl';
import {
  WORKSPACE_TAB_ICONS,
  WORKSPACE_TAB_LABELS,
  WORKSPACE_TAB_ROUTES,
  tabHref,
} from '@/app/(provider)/provider/patients/[patientId]/tabs';
import type { WorkspaceTabSlug } from '@/app/(provider)/provider/patients/[patientId]/tabs';

const TAB_ICONS: Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>> = Object.fromEntries(
  WORKSPACE_TAB_ROUTES.map((slug) => [slug, makeIcon(WORKSPACE_TAB_ICONS[slug])]),
) as Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>>;

export function WorkspaceTopBar({
  patientId,
  activeSlug,
}: {
  patientId: string;
  activeSlug: WorkspaceTabSlug;
}) {
  const items: TabItem[] = WORKSPACE_TAB_ROUTES.map((slug) => {
    const Glyph = TAB_ICONS[slug];
    return {
      value: slug,
      label: WORKSPACE_TAB_LABELS[slug],
      icon: <Glyph size="sm" />,
      href: tabHref(patientId, slug),
    };
  });

  return (
    <header className="flex items-center gap-md bg-frame px-lg min-h-[calc(var(--spacing-2xl)*2)]">
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="workspace-search"
        placeholder="Search patients"
        className="max-md:hidden"
      />
      <TabBar items={items} value={activeSlug} ariaLabel="Patient sections" className="min-w-0" />
      <div className="ml-auto flex items-center gap-sm max-md:hidden">
        <span className="flex flex-col text-right">
          <span className="text-heading font-semibold leading-heading text-text-primary">
            Patient record
          </span>
          <span className="text-label font-regular leading-label text-text-primary">
            Clinical workspace
          </span>
        </span>
      </div>
    </header>
  );
}
