// src/components/patients/FolderCard.tsx — the provider-home folder card
// (PROV-03; D-09/D-10/D-13/D-15; 04-UI-SPEC §4.2).
//
// Server Component: no client directive, no hook, no client state. The only
// client island on the card is the three-dot quick-actions trigger.
//
// Anatomy, top to bottom (§4.2, composed to the D-28 re-sampled tokens):
//   1. folder tab silhouette — a `surfaceMuted` band across the card's top
//      edge, drawn INSIDE the silhouette (never protruding past the card's
//      rounded lip, which read as a hard cut in the reference comparison);
//   2. header row — `surfaceMuted` initials disc + name (Heading, 600) with
//      the MRN beneath in Label `textSecondary`, plus room reserved at the
//      trailing edge for the quick-actions button;
//   3. status line — full-width 4px (`h-1`) line in the D-10 token, with the
//      `Pill` riding its center (the reference's composition: the line runs
//      behind the pill and the pill's own fill masks it);
//   4. the identity line ("42 · F", tabular-nums, minimal age/sex);
//   5. footer — "Last activity" Label `textSecondary` + the absolute date
//      (`tabular-nums`, pattern 7: never "N days ago") and at most one 16px
//      contextual indicator (the unlinked-account glyph, which is what
//      "Send invite" acts on).
//
// D-10 status encoding appears in EXACTLY two places per card: the status
// line and the `Pill`'s leading dot. The name, body and background are never
// tinted. The card carries NO border (INV-15/INV-16): it is a white
// `surfaceRaised` fill with `shadow-raised` and a 24px radius, floating on
// the gray canvas — the reference separates by fill and shadow, never by a
// drawn edge (D-28).
//
// Minimization (PROV-03, §3.3): the card prints name, MRN, age/sex, status
// and the absolute last-activity date. Phone and DOB are never printed — they
// live in search and in the workspace. No specialty label ever appears (§27).
//
// The whole card is an `<a>` to `/provider/patients/[id]` — server-rendered
// navigation, never a click handler inside an RSC. The quick-actions button
// is a SIBLING of that anchor (nested interactive elements are invalid);
// 04-03 left the slot and 04-04 fills it.
import { UserX } from 'lucide-react';
import type { PatientFolderRow } from '@/lib/patients/queries';
import { PATIENT_STATUS_LABELS, PATIENT_STATUS_TOKEN } from '@/lib/patients/status';
import { Surface } from '@/components/primitives/Surface';
import { Pill } from '@/components/primitives/Pill';
import { makeIcon } from '@/components/primitives/Icon';
import { QuickActionsOverlay } from './QuickActionsOverlay';

// The unlinked-account indicator (16px `sm` step). Named for assistive
// technology because it carries meaning: this patient has no user account
// yet, which is exactly what the "Send invite" quick action acts on (D-04).
const UnlinkedGlyph = makeIcon(UserX);

export type FolderCardProps = {
  patient: PatientFolderRow;
  /** The resolved role holds CAN_MANAGE_MEMBERSHIP (server-known, D-04). */
  canInvite?: boolean;
  /** The resolved role holds CAN_MESSAGE (Phase 15, server-known). */
  canMessage?: boolean;
};

function initialsOf(patient: PatientFolderRow): string {
  const first = patient.firstName.trim().charAt(0);
  const last = patient.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase();
}

export function FolderCard({ patient, canInvite = false, canMessage = false }: FolderCardProps) {
  // The D-10 mapping is consumed from @/lib/patients/status, never re-derived
  // here: only the utility prefix is composed onto the shared token name.
  const token = PATIENT_STATUS_TOKEN[patient.status];
  const statusLabel = PATIENT_STATUS_LABELS[patient.status];
  const fullName = `${patient.firstName} ${patient.lastName}`;
  const unlinked = patient.userId === null;
  const href = `/provider/patients/${patient.id}`;
  const lastActivity = patient.lastActivityAt.slice(0, 10);

  return (
    <div className="relative">
      <a href={href} className="block">
        {/* The reference's card: a white fill with the soft raised shadow on a
            16/24px radius, no perimeter edge of any kind (INV-15/16). */}
        <Surface variant="surfaceRaised" className="relative overflow-hidden">
          {/* Folder tab silhouette — a short tab at the card's top-left,
              clipped by the card's own rounded lip (never protruding past the
              edge with a hard cut, the D-28 reference comparison). */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-6 top-0 h-3 w-20 rounded-t-xl bg-surface-muted"
          />
          <div className="flex flex-col gap-lg pt-lg">
            {/* Header row — reserves the trailing 44px trigger strip. */}
            <div className="flex items-start gap-md pr-12">
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-body leading-body font-semibold text-text-primary"
              >
                {initialsOf(patient)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-xs">
                <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                  {fullName}
                </span>
                <span className="truncate text-label leading-label text-text-secondary tabular-nums">
                  {patient.mrn}
                </span>
              </span>
            </div>

            {/* Status line with the Pill riding its center — the reference's
                composition: the line runs behind the pill, the pill masks it
                with its own fill, and both carry the same D-10 tone. */}
            <div className="relative flex items-center justify-center">
              <span
                aria-hidden="true"
                className={`absolute inset-x-0 h-1 rounded-pill bg-${token}`}
              />
              <Pill tone={token} label={statusLabel} className="relative" />
            </div>

            {/* The identity stays untinted; the pill above is the second
                tinted place on the card (D-10). */}
            <div className="flex flex-wrap items-center gap-md">
              <span
                data-testid="folder-identity"
                className="text-label leading-label text-text-primary tabular-nums"
              >
                {patient.age} · {patient.sex}
              </span>
            </div>

            <div className="flex items-center gap-md">
              <span className="text-label leading-label text-text-secondary">
                Last activity
              </span>
              <span className="text-label leading-label text-text-primary tabular-nums">
                {lastActivity}
              </span>
              {unlinked ? (
                <UnlinkedGlyph
                  size="sm"
                  role="img"
                  aria-label="Not linked to a patient account"
                  className="ml-auto text-text-primary"
                />
              ) : null}
            </div>
          </div>
        </Surface>
      </a>
      {/* Outside the anchor: nested interactive elements are invalid. */}
      <div className="absolute right-lg top-lg">
        <QuickActionsOverlay
          patientId={patient.id}
          firstName={patient.firstName}
          status={patient.status}
          unlinked={unlinked}
          canInvite={canInvite}
          canMessage={canMessage}
        />
      </div>
    </div>
  );
}
