// WorkspaceTopBar — the patient-workspace top bar (02-UI-SPEC.md §6.4).
// Server Component: async, no hook, no client directive.
//
// THE DARK BAND (2026-10-11, reference: patient-tracking-dashboard.jpg; the
// owner's visual instruction reopens the no-dark-frame default for this one
// surface): the reference's top band is dark with everything floating on it —
// a close circle, the big title (here: the PATIENT, not the sample
// "Cardiology" label — D-13 forbids reusing reference copy; the highlight is
// the stored status, the honest stand-in for a diagnosis highlight until a
// diagnosis table exists), then the search pill and the tab pills. The band
// spans the light field edge-to-edge through negative margins and takes the
// field's rounded top corners from the hosting field's clip.
//
// The tab set is EXACTLY the eight from `WORKSPACE_TAB_ROUTES`. The active
// tab is supplied by the owning route: each tab page renders this bar with
// its own `activeSlug`, because an App Router layout cannot read its child
// segment (D-03).
//
// THE PATIENT IDENTITY: one narrow org-scoped read (`getPatientHeader`, same
// org-space discipline as `getPatient`) carries the patient's name and
// status into the title slot. A failed read falls back to the generic
// "Patient record" title — the band never renders a placeholder patient and
// never fails the tab bar to fetch its name.
//
// The `[patientId]` parameter is consumed only through `tabHref` and the
// UUID-parsed header read — never rendered, and never passed to a path, a
// template, a log or any interpreter (ASVS V5, T-02-52).
//
// Ink rule (inverse of the light bar's): on the dark band every label paints
// `text-surface`, never `frameForeground` (§4.3's contrast law, inverted).
import Link from 'next/link';
import { X } from 'lucide-react';
import { Pill } from '@/components/primitives/Pill';
import { TabBar } from '@/components/primitives/TabBar';
import type { TabItem } from '@/components/primitives/TabBar';
import { makeIcon } from '@/components/primitives';
import { CompactControl } from '@/components/primitives/CompactControl';
import {
  PATIENT_STATUS_LABELS,
  PATIENT_STATUS_TOKEN,
} from '@/lib/patients/status';
import {
  getPatientHeader,
  type PatientHeaderRow,
} from '@/lib/patients/queries';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import {
  WORKSPACE_TAB_ICONS,
  WORKSPACE_TAB_LABELS,
  WORKSPACE_TAB_ROUTES,
  tabHref,
} from '@/app/(provider)/provider/patients/[patientId]/tabs';
import type { WorkspaceTabSlug } from '@/app/(provider)/provider/patients/[patientId]/tabs';

const CloseGlyph = makeIcon(X);

const TAB_ICONS: Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>> = Object.fromEntries(
  WORKSPACE_TAB_ROUTES.map((slug) => [slug, makeIcon(WORKSPACE_TAB_ICONS[slug])]),
) as Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>>;

async function resolveHeader(patientId: string): Promise<PatientHeaderRow | null> {
  const resolution = await resolveWorkspaceRole('provider');
  const parsedId = patientIdSchema.safeParse(patientId);
  if (resolution.kind !== 'signed-in' || !parsedId.success) return null;
  try {
    return await getPatientHeader(resolution.orgId, parsedId.data);
  } catch {
    return null;
  }
}

export async function WorkspaceTopBar({
  patientId,
  activeSlug,
}: {
  patientId: string;
  activeSlug: WorkspaceTabSlug;
}) {
  const header = await resolveHeader(patientId);
  const fullName = header !== null ? `${header.firstName} ${header.lastName}` : null;

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
    <header className="-mx-lg flex min-h-[calc(var(--spacing-2xl)*2)] items-center gap-md bg-text-primary px-lg">
      <Link
        href="/provider"
        aria-label="Close patient record"
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-pill bg-surface text-text-primary"
      >
        <CloseGlyph size="lg" />
      </Link>
      <span className="flex min-w-0 items-center gap-md">
        {fullName !== null && header !== null ? (
          <>
            <span className="truncate text-display font-semibold leading-tight text-surface">
              {fullName}
            </span>
            <Pill
              tone={PATIENT_STATUS_TOKEN[header.status]}
              label={PATIENT_STATUS_LABELS[header.status]}
            />
          </>
        ) : (
          <span className="truncate text-display font-semibold leading-tight text-surface">
            Patient record
          </span>
        )}
      </span>
      <CompactControl
        variant="search"
        label="Search patients"
        inputId="workspace-search"
        placeholder="Search patients"
        className="ml-auto max-md:hidden"
      />
      <TabBar items={items} value={activeSlug} ariaLabel="Patient sections" className="min-w-0" />
    </header>
  );
}
