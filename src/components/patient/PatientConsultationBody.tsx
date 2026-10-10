// PatientConsultationBody — the patient's own consultation surface (Phase
// 17, ticket 17-03; TH-02).
//
// Server Component: resolves the patient from the VERIFIED SESSION (never the
// URL — §3.1) and reads their active session under self-or-staff RLS. The
// surface is deliberately quiet: the consultation reference, its state, and
// the honest transport note. Clinical notes, staff names and ids never
// appear here — the patient reads their thread and their record, not the
// workspace.
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { Pill } from '@/components/primitives/Pill';
import { getPatientForCurrentUser } from '@/lib/patient/queries';
import { getOwnActiveConsultation } from '@/lib/telehealth/queries';
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_TOKEN,
  TRANSPORT_EXPLANATION,
  TRANSPORT_LABELS,
} from '@/lib/telehealth/status';

export async function PatientConsultationBody() {
  const patient = await getPatientForCurrentUser();
  if (patient === null) {
    return (
      <Surface variant="surface" className="flex flex-col gap-md">
        <EmptyState
          title="No consultation yet"
          body="When your care team starts a telehealth appointment with you, it appears here."
        />
      </Surface>
    );
  }

  let session = null;
  let failed = false;
  try {
    session = await getOwnActiveConsultation(patient.orgId, patient.id);
  } catch {
    failed = true;
  }

  if (failed) {
    return (
      <Surface variant="surface" className="flex flex-col gap-sm">
        <p className="text-body leading-body text-text-secondary">
          Your consultation couldn&apos;t be loaded just now. Try again in a moment.
        </p>
      </Surface>
    );
  }

  if (session === null) {
    return (
      <Surface variant="surface" className="flex flex-col gap-md">
        <EmptyState
          title="No consultation running right now"
          body="When your care team starts a telehealth appointment with you, it appears here with the reference to join."
        />
      </Surface>
    );
  }

  return (
    <Surface variant="surface" className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-heading font-semibold leading-heading text-text-primary">Your consultation</h2>
        <Pill tone={SESSION_STATUS_TOKEN[session.status]} label={SESSION_STATUS_LABELS[session.status]} />
      </div>

      <div className="flex flex-col gap-xs">
        <span className="text-label leading-label text-text-secondary">Consultation reference</span>
        <span className="text-body leading-body text-text-primary tabular-nums">{session.joinToken.slice(0, 8)}</span>
      </div>

      <div className="flex flex-col gap-xs">
        <span className="text-label leading-label font-semibold text-text-primary">
          {TRANSPORT_LABELS[session.transport]}
        </span>
        <p className="text-body leading-body text-text-secondary">{TRANSPORT_EXPLANATION[session.transport]}</p>
      </div>

      <p className="text-label leading-label text-text-secondary">
        Keep this page open. If anything about your care changes, message your care team from your care home.
      </p>
    </Surface>
  );
}
