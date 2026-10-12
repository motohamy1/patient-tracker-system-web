// PatientIdentityCard — the Overview's identity block, rebuilt to the patient
// detail reference (Paper "Xanthic honey", artboard "Patient Overview —
// merged reference").
//
// WHAT THE REFERENCE SHOWS: one rounded surface card holding a46px initials
// disc, the patient's name, a "Sex · Age" line, then three label/value rows —
// Social History, Care Plan, Portal Access. The card's top-left corner is bitten
// out by a canvas-coloured disc that also carries the close control, so the ✕
// sits in the notch rather than on the card.
//
// INTERNAL PLACEMENT (reference coordinates): the card is a fixed 363×265 at
// the desktop band, and inside it the identity row sits at x=92/y=12 — pushed
// clear of the close control that occupies the corner — while the three rows
// start at y=133, leaving the reference's deliberate open space between them.
// Below 1024px the card is fluid and the two blocks simply stack.
//
// CONTENT (AGENTS.md §Data / §27): identity comes from the stored record —
// initials, name, sex and age are read, never invented. Social History and Care
// Plan have no column in the schema yet, so they carry the reference's sample
// copy as explicitly-look-alike placeholder content pending the phase that adds
// those fields; Portal Access is REAL (derived from `patient.userId`). Swap the
// two placeholder rows for their columns when they land; the row shape does not
// change.
//
// Every value is tabular where it is a figure (QA row 7); every colour resolves
// through a semantic token (INV-01); the card separates from the canvas by
// `shadow-lift` alone, never by a perimeter border (INV-15/INV-16).
//
// Server Component: no hook, no client directive.
import Link from 'next/link';
import { X } from 'lucide-react';
import { makeIcon } from '@/components/primitives';
import type { PatientRecord } from '@/lib/patients/queries';

const CloseGlyph = makeIcon(X);

const SEX_LABEL: Record<'M' | 'F', string> = {
  M: 'Male',
  F: 'Female',
};

function initialsOf(patient: PatientRecord): string {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

/** The reference's label/value row: muted label left, semibold value right. */
function IdentityLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-label leading-label font-semibold text-text-primary">{value}</span>
    </div>
  );
}

export function PatientIdentityCard({ patient }: { patient: PatientRecord }) {
  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <section
      aria-label="Patient identity"
      className="relative flex w-full shrink-0 flex-col gap-lg rounded-card bg-surface p-xl shadow-lift lg:h-[265px] lg:w-[363px]"
    >
      {/* Identity row. The reference seats it at x=92 so it clears the close
          control that owns the card's top-left corner. */}
      <div className="flex items-center gap-md lg:absolute lg:left-[92px] lg:top-[12px] lg:w-[207px]">
        <span
          aria-hidden="true"
          className="flex size-[46px] shrink-0 items-center justify-center rounded-pill bg-surface-muted text-heading font-bold leading-heading text-text-primary"
        >
          {initialsOf(patient)}
        </span>
        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate font-grotesk text-subhead font-semibold leading-subhead text-text-primary">
            {fullName}
          </span>
          <span className="truncate text-label leading-label text-text-secondary">
            {SEX_LABEL[patient.sex]} · {patient.age}
          </span>
        </div>
      </div>

      {/* The three rows, seated at the reference's y=133. */}
      <div className="flex flex-col gap-[11px] lg:absolute lg:left-5 lg:top-[133px] lg:w-[323px]">
        <IdentityLine label="Social History" value="Alcohol, Tobacco" />
        <IdentityLine label="Care Plan" value="Cardiology follow-up" />
        <IdentityLine
          label="Portal Access"
          value={patient.userId === null ? 'Invite pending' : 'Active'}
        />
      </div>

      {/* The reference's corner notch: a canvas-coloured disc that masks the
          card's top-left corner, with a 67px close control seated inside it.
          Both sit OUTSIDE the card's fill so they read as the page showing
          through. The offsets are the reference's own (-23/-39 and -24/-32);
          the card's top padding keeps the control clear of the panel's
          clipping edge. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-[23px] -top-[39px] size-[60px] rounded-pill bg-canvas"
      />
      <Link
        href="/provider"
        aria-label="Close patient record"
        className="absolute -left-6 -top-8 inline-flex size-[67px] items-center justify-center rounded-pill bg-canvas text-timeline-ink"
      >
        <CloseGlyph size="lg" />
      </Link>
    </section>
  );
}
