// src/components/patients/FolderCard.tsx — the provider-home folder card
// (PROV-03; D-09/D-10/D-13/D-15; 04-UI-SPEC §4.2).
//
// Server Component: no client directive, no hook, no client state. The only
// client island on the card is the three-dot quick-actions trigger.
//
// Anatomy, top to bottom (§4.2):
//   1. folder tab silhouette — a `surface`-filled notch protruding from the
//      top edge with `radius.sm` on its outer corners, pure CSS, no new
//      shadow (the "premium digital clinical folder" signature, §5);
//   2. header row — `surfaceMuted` initials disc + name (Heading, 600) with
//      the MRN beneath in Label `textSecondary`, plus room reserved at the
//      trailing edge for the quick-actions button;
//   3. status line — full-width 2px (`h-0.5`) line in the D-10 token;
//   4. the `Pill` + identity line ("42 · F", tabular-nums, minimal age/sex);
//   5. footer — "Last activity" Label `textSecondary` + the absolute date
//      (`tabular-nums`, pattern 7: never "N days ago") and at most one 16px
//      contextual indicator (the unlinked-account glyph, which is what
//      "Send invite" acts on).
//
// D-10 status encoding appears in EXACTLY two places per card: the status
// line and the `Pill`'s leading dot. The name, body and background are never
// tinted. The card carries NO border (INV-15/INV-16): separation is
// `shadow-raised` + `radius.lg` on `Surface variant="surface"`, floating on
// `canvas`.
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
};

function initialsOf(patient: PatientFolderRow): string {
  const first = patient.firstName.trim().charAt(0);
  const last = patient.lastName.trim().charAt(0);
  return `${first}${last}`.toUpperCase();
}

export function FolderCard({ patient, canInvite = false }: FolderCardProps) {
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
      {/* Folder tab silhouette: same `surface` fill, radius.sm outer corners. */}
      <span
        aria-hidden="true"
        className="absolute -top-3 left-lg h-3 w-16 rounded-t-sm bg-surface"
      />
      <a href={href} className="block">
        <Surface variant="surface">
          <div className="flex flex-col gap-md">
            {/* Header row — reserves the trailing 44px trigger strip. */}
            <div className="flex items-start gap-md pr-12">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-label leading-label text-text-primary"
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

            {/* Status line — one of the two tinted places on the card. */}
            <span
              aria-hidden="true"
              className={`h-0.5 w-full rounded-pill bg-${token}`}
            />

            {/* The Pill is the second tinted place; identity stays untinted. */}
            <div className="flex flex-wrap items-center gap-md">
              <Pill tone={token} label={statusLabel} />
              {/* data-testid: the visual harness masks this fragment — age is
                  computed from dob at render time and changes on birthdays
                  (04-05 / 03-08 masking precedent). */}
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
        />
      </div>
    </div>
  );
}
