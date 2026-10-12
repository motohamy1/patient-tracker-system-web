// WorkspaceTopBar — the patient-workspace header, rebuilt to the patient
// detail reference (Paper "Xanthic honey", artboard "Patient Overview — merged
// reference").
//
// THE REFERENCE'S ARRANGEMENT: the identity card sits at the LEFT and runs the
// full height of the header, while the tab strip and the context strip stack in
// the column beside it. Reproducing that means the identity card has to live
// here rather than in the page body — otherwise the tab strip starts at the
// left gutter instead of clearing the card, and the two regions stop lining up
// beside it.
//
// LAYOUT (reference coordinates → responsive equivalents):
//   * header content starts 33px below the panel edge (reference `top: 33`)
//   * card | gutter | right column, gutter = 22px (reference 409 − 387)
//   * right column: the tab strip at the card's own top, the context strip
//     11px below the pills — the reference's own offsets. The context strip is
//     inset 41px from the column's left edge, matching where the reference
//     seats the diagnosis capsule relative to the first pill.
//   * the tab strip bleeds into the right gutter (`-mr-xl`) and scrolls, so the
//     ninth pill runs to the panel edge exactly as the reference draws it while
//     every tab stays reachable (responsive-rules §4).
//
// The reference's search capsule and profile pill are GONE in this revision —
// they are not drawn, so they are not built. What remains in the top-right is
// only the tab strip.
//
// The tab set is EXACTLY the nine from `WORKSPACE_TAB_ROUTES`, in order. The
// active tab is supplied by the owning route: each tab page renders this bar
// with its own `activeSlug`, because an App Router layout cannot read its child
// segment (D-03).
//
// Identity comes from one org-scoped `getPatient` read; a failed or denied read
// renders NO card rather than a placeholder patient, so the right column simply
// takes the full width (AUTH-03, UX-02).
//
// Ink: the reference dropped the olive band, so this header paints on `canvas`
// and every label takes its ink from the reference's own tokens — active tab
// `textPrimary`, idle tab label `tabIdle`, idle tab glyph `tabIdleIcon`.
//
// The `[patientId]` parameter is consumed only through `tabHref` and the
// UUID-parsed identity read — never rendered, and never passed to a path, a
// template, a log or any interpreter (ASVS V5, T-02-52).
import Link from 'next/link';
import type { ReactNode } from 'react';
import { makeIcon } from '@/components/primitives';
import { PatientIdentityCard } from '@/components/workspace/PatientIdentityCard';
import { getPatient, type PatientRecord } from '@/lib/patients/queries';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { patientIdSchema } from '@/lib/patients/schemas';
import {
  WORKSPACE_TAB_ICONS,
  WORKSPACE_TAB_LABELS,
  WORKSPACE_TAB_ROUTES,
  tabHref,
} from '@/app/(provider)/provider/patients/[patientId]/tabs';
import type { WorkspaceTabSlug } from '@/app/(provider)/provider/patients/[patientId]/tabs';

const TAB_GLYPHS: Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>> = Object.fromEntries(
  WORKSPACE_TAB_ROUTES.map((slug) => [slug, makeIcon(WORKSPACE_TAB_ICONS[slug])]),
) as Record<WorkspaceTabSlug, ReturnType<typeof makeIcon>>;

async function resolvePatient(patientId: string): Promise<PatientRecord | null> {
  const resolution = await resolveWorkspaceRole('provider');
  const parsedId = patientIdSchema.safeParse(patientId);
  if (resolution.kind !== 'signed-in' || !parsedId.success) return null;
  try {
    return await getPatient(resolution.orgId, parsedId.data);
  } catch {
    // A denied or failed identity read renders no card — never a placeholder
    // patient, and never a leak about whether the record exists (UX-02).
    return null;
  }
}

export async function WorkspaceTopBar({
  patientId,
  activeSlug,
  children,
}: {
  patientId: string;
  activeSlug: WorkspaceTabSlug;
  /** The context strip (diagnosis + vitals), rendered under the tabs. */
  children?: ReactNode;
}) {
  const patient = await resolvePatient(patientId);

  return (
    <header className="mx-auto w-full max-w-[90rem] px-xl pb-[43px] pt-[33px]">
      <div className="flex w-full gap-[22px]">
        {patient !== null ? <PatientIdentityCard patient={patient} /> : null}

        <div className="flex min-w-0 flex-1 flex-col">
          {/* The nine workspace tabs. The reference's pills are 78px tall —
              comfortably over the 44px touch floor — and `-mr-xl` lets the
              strip run into the right gutter so the last pill meets the panel
              edge as the reference draws it, while `overflow-x-auto` keeps all
              nine reachable (responsive-rules §4). */}
          <nav
            aria-label="Patient sections"
            className="-mr-xl flex items-start gap-sm overflow-x-auto [scrollbar-width:none]"
          >
            {WORKSPACE_TAB_ROUTES.map((slug) => {
              const Glyph = TAB_GLYPHS[slug];
              const isActive = slug === activeSlug;
              return (
                <Link
                  key={slug}
                  href={tabHref(patientId, slug)}
                  aria-current={isActive ? 'page' : undefined}
                  className={[
                    'inline-flex h-[78px] shrink-0 items-center gap-sm rounded-pill px-[18px] text-compact leading-[16px] transition-colors',
                    isActive
                      ? 'bg-highlight font-semibold text-text-primary'
                      : 'bg-surface-raised font-medium text-tab-idle-icon',
                  ].join(' ')}
                >
                  <Glyph size="sm" />
                  <span className={isActive ? '' : 'text-tab-idle'}>
                    {WORKSPACE_TAB_LABELS[slug]}
                  </span>
                </Link>
              );
            })}
          </nav>

          {children !== undefined && children !== null ? (
            <div className="mt-[11px] pl-[41px]">{children}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
