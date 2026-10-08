// PatientIdentityCard — the Overview's compact patient identity area
// (WSP-02 "who is this patient"; PRODUCT-MASTER-SPEC.md §7; reference §5
// "a compact patient identity card on the left").
//
// Content is the stored identity only: name, age/sex, MRN, date of birth and
// portal linkage — no invented clinical history (§27, D-18). Clinical STATE
// (status, recency, record age) lives beside this card in ContextStatRow, so
// nothing is printed twice. The status Pill moved there with it: this card is
// who the patient is, not how the record is doing.
//
// Every numeric value carries `tabular-nums` (QA row 7); every color resolves
// through a semantic token (INV-01); the card separates from the canvas by
// `shadow-raised` alone, never by a perimeter border (INV-15/INV-16).
//
// Server Component: no hook, no client directive.
import { Surface } from '@/components/primitives';
import type { PatientRecord } from '@/lib/patients/queries';

const SEX_LABEL: Record<'M' | 'F', string> = {
  M: 'Male',
  F: 'Female',
};

function initialsOf(patient: PatientRecord): string {
  return `${patient.firstName.charAt(0)}${patient.lastName.charAt(0)}`.toUpperCase();
}

function IdentityLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-md">
      <span className="text-label leading-label text-text-secondary">{label}</span>
      <span className="text-body leading-body text-text-primary tabular-nums">{value}</span>
    </div>
  );
}

export function PatientIdentityCard({ patient }: { patient: PatientRecord }) {
  const fullName = `${patient.firstName} ${patient.lastName}`;

  return (
    <section aria-label="Patient identity" className="h-full">
      <Surface variant="surface" className="h-full">
        <div className="flex h-full flex-col gap-md">
          <div className="flex items-center gap-md">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-surface-muted text-label leading-label text-text-primary"
            >
              {initialsOf(patient)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-heading font-semibold leading-heading text-text-primary">
                {fullName}
              </span>
              <span className="truncate text-label leading-label text-text-primary tabular-nums">
                {SEX_LABEL[patient.sex]} · {patient.age}
              </span>
            </span>
          </div>

          <div className="mt-auto flex flex-col gap-sm">
            <IdentityLine label="MRN" value={patient.mrn} />
            <IdentityLine label="Date of birth" value={patient.dob} />
            <IdentityLine
              label="Portal access"
              value={patient.userId === null ? 'Invite pending' : 'Active'}
            />
          </div>
        </div>
      </Surface>
    </section>
  );
}
