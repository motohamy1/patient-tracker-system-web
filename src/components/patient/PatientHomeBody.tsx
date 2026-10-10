// PatientHomeBody — the data-backed body of the patient's Home (Phase 13,
// ticket 13-02; PTH-01..03, §14).
//
// The same design language as the provider workspace at a genuinely lower
// density: nine calm regions, one column at the reference's comfortable
// measure, every region degrading on its own (§24 region states). Nothing
// here is fabricated — a region with no data says so, and the Communication
// region is honestly empty until messaging exists.
//
// The patient is resolved from the VERIFIED SESSION (never from the URL):
// `getPatientForCurrentUser()` reads the record whose `user_id` is the
// authenticated user, and every read below is that patient's own rows under
// migration 0012's self-or-staff policies. A patient account with no linked
// clinical record gets the honest no-record state — no invented data.
//
// Server Component: no hook, no client directive.
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { Surface } from '@/components/primitives';
import { QuickLogControl } from '@/components/patient/QuickLogControl';
import { CareTasksRegion } from '@/components/care-tasks/CareTasksRegion';
import { ThreadView } from '@/components/messaging/ThreadView';
import { getOwnConversation, listConversationMessages } from '@/lib/messaging/queries';
import { loadCareTaskState } from '@/lib/care-tasks/load';
import { INSET_FILL } from '@/components/primitives/CompactControl';
import { listVisits, type VisitRecord } from '@/lib/visits/queries';
import { listMedications, type MedicationRecord } from '@/lib/medications/queries';
import { listLabResults, type LabResultRecord } from '@/lib/labs/queries';
import { ownActiveConsultationVisitIds } from '@/lib/telehealth/queries';
import {
  getPatientForCurrentUser,
  listPatientDocuments,
  listPatientObservations,
  type PatientDocumentRecord,
  type PatientObservationRecord,
} from '@/lib/patient/queries';
import {
  OBSERVATION_KIND_LABELS,
  type ObservationKind,
} from '@/lib/patient/status';

function Region({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Surface variant="surface" className={`flex flex-col gap-md ${className ?? ''}`}>
      <h2 className="text-label leading-label font-semibold text-text-primary">{title}</h2>
      {children}
    </Surface>
  );
}

function quiet(body: string) {
  return <p className="text-body leading-body text-text-secondary">{body}</p>;
}

function formatDay(at: string): string {
  return new Date(at).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function formatValue(observation: PatientObservationRecord): string {
  if (observation.kind === 'note') return observation.note ?? 'Note';
  const first = observation.valueNumeric !== null ? String(observation.valueNumeric) : '';
  const second = observation.valueSecondary !== null ? `/${String(observation.valueSecondary)}` : '';
  const unit = observation.unit !== null ? ` ${observation.unit}` : '';
  return `${first}${second}${unit}`;
}

function isSameUtcDay(at: string, reference: Date): boolean {
  const day = new Date(at);
  return (
    day.getUTCFullYear() === reference.getUTCFullYear() &&
    day.getUTCMonth() === reference.getUTCMonth() &&
    day.getUTCDate() === reference.getUTCDate()
  );
}

export async function PatientHomeBody() {
  let patient = null;
  try {
    patient = await getPatientForCurrentUser();
  } catch {
    patient = null;
  }

  if (patient === null) {
    return (
      <Surface variant="surface" className="flex flex-col gap-md">
        <EmptyState
          title="Your care record will appear here"
          body="Once your care team links your account to your record, today's care, your medications and your plan appear on this page."
        />
      </Surface>
    );
  }

  // Every region reads its own slice and degrades on its own.
  let visits: VisitRecord[] = [];
  let visitsFailed = false;
  try {
    visits = await listVisits(patient.orgId, patient.id);
  } catch {
    visitsFailed = true;
  }

  let medications: MedicationRecord[] = [];
  let medicationsFailed = false;
  try {
    medications = (await listMedications(patient.orgId, patient.id)).filter(
      (medication) => medication.status === 'active',
    );
  } catch {
    medicationsFailed = true;
  }

  let labs: LabResultRecord[] = [];
  try {
    labs = await listLabResults(patient.orgId, patient.id);
  } catch {
    labs = [];
  }

  let observations: PatientObservationRecord[] = [];
  try {
    observations = await listPatientObservations(patient.orgId, patient.id);
  } catch {
    observations = [];
  }

  let documents: PatientDocumentRecord[] = [];
  try {
    documents = await listPatientDocuments(patient.orgId, patient.id);
  } catch {
    documents = [];
  }

  let careTaskState = null;
  try {
    careTaskState = await loadCareTaskState(patient.orgId, patient.id);
  } catch {
    careTaskState = null;
  }

  // Phase 17: the patient's own in-progress consultations, so the
  // Appointments region can point at the join surface (marker only — the
  // session itself lives on /patient/consultation).
  let liveConsultationVisitIds: Set<string> = new Set();
  try {
    liveConsultationVisitIds = await ownActiveConsultationVisitIds(patient.orgId, patient.id);
  } catch {
    liveConsultationVisitIds = new Set();
  }

  // The patient's own conversation (the unified model, Phase 15): resolved
  // from the session, never the URL. A closed or absent thread shows the
  // honest empty region.
  let conversationId: string | undefined;
  let conversationMessages: Awaited<ReturnType<typeof listConversationMessages>> = [];
  try {
    const own = await getOwnConversation(patient.orgId, patient.id);
    if (own !== null) {
      conversationId = own.id;
      conversationMessages = await listConversationMessages(patient.orgId, own.id);
    }
  } catch {
    conversationId = undefined;
    conversationMessages = [];
  }

  const now = new Date();
  const today = visits.filter((visit) => isSameUtcDay(visit.scheduledAt, now));
  const upcoming = visits
    .filter((visit) => Date.parse(visit.scheduledAt) > now.getTime() && !isSameUtcDay(visit.scheduledAt, now))
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  const next = upcoming[0];
  const carePlan = visits
    .filter((visit) => visit.followUp !== null || visit.followUpAt !== null)
    .sort((a, b) => (b.followUpAt ?? '').localeCompare(a.followUpAt ?? ''))
    .slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-[64rem] flex-col gap-lg">
      <section aria-label="Today's care" className="flex flex-col gap-lg">
        <Surface variant="surface" className="flex flex-col gap-md">
          <h2 className="text-label leading-label font-semibold text-text-primary">Today&apos;s care</h2>
          {visitsFailed ? (
            <StateVariant surface="today's care" retryHref="/patient/home" />
          ) : today.length === 0 ? (
            quiet('Nothing is scheduled for you today.')
          ) : (
            <ul className="flex flex-col gap-sm">
              {today.map((visit) => (
                <li key={visit.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                  <span className="text-body leading-body text-text-primary">
                    {visit.visitType ?? 'Appointment'}
                    {visit.location !== null ? ` · ${visit.location}` : ''}
                  </span>
                  <span className="text-label leading-label text-text-secondary tabular-nums">
                    {formatDay(visit.scheduledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Surface>

        <Surface variant="surface" className="flex flex-col gap-md">
          <h2 className="text-label leading-label font-semibold text-text-primary">Next action</h2>
          {visitsFailed ? (
            <StateVariant surface="next action" retryHref="/patient/home" />
          ) : next === undefined ? (
            quiet('Nothing is scheduled yet. Your care team will add your next appointment here.')
          ) : (
            <div className="flex flex-col gap-xs">
              <span className="text-heading font-semibold leading-heading text-text-primary">
                {next.visitType ?? 'Appointment'} on {formatDay(next.scheduledAt)}
              </span>
              <span className="text-label leading-label text-text-secondary">
                {next.location !== null ? next.location : 'Location to be confirmed'}
              </span>
            </div>
          )}
        </Surface>
      </section>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Region title="Medications">
          {medicationsFailed ? (
            <StateVariant surface="medications" retryHref="/patient/home" />
          ) : medications.length === 0 ? (
            quiet('No active medications are recorded for you.')
          ) : (
            <ul className="flex flex-col gap-sm">
              {medications.map((medication) => (
                <li key={medication.id} className="flex flex-col gap-xs">
                  <span className="text-body leading-body text-text-primary">{medication.name}</span>
                  <span className="text-label leading-label text-text-secondary tabular-nums">
                    {[
                      medication.doseAmount !== null
                        ? `${medication.doseAmount}${medication.doseUnit ? ` ${medication.doseUnit}` : ''}`
                        : null,
                      medication.frequency !== null ? medication.frequency.replace(/_/g, ' ') : null,
                      medication.route !== null ? medication.route : null,
                    ]
                      .filter((part) => part !== null)
                      .join(' · ') || 'As directed by your care team'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region title="Appointments">
          {visitsFailed ? (
            <StateVariant surface="appointments" retryHref="/patient/home" />
          ) : upcoming.length === 0 ? (
            quiet('No upcoming appointments are booked.')
          ) : (
            <ul className="flex flex-col gap-sm">
              {upcoming.slice(0, 6).map((visit) => {
                const live = liveConsultationVisitIds.has(visit.id);
                return (
                  <li key={visit.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                    <span className="text-body leading-body text-text-primary">
                      {visit.visitType ?? 'Appointment'}
                    </span>
                    <span className="flex items-center gap-sm">
                      {live ? (
                        <Link
                          href="/patient/consultation"
                          className="text-label leading-label text-text-primary hover:text-text-secondary"
                        >
                          Consultation running
                        </Link>
                      ) : null}
                      <span className="text-label leading-label text-text-secondary tabular-nums">
                        {formatDay(visit.scheduledAt)}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Region>
      </div>

      <Region title="Health snapshot">
        <div className="flex flex-col gap-md">
          <div className="flex flex-col gap-sm">
            <h3 className="text-label leading-label text-text-secondary">Your recent measurements</h3>
            {observations.length === 0 ? (
              quiet('Nothing logged yet — add one below.')
            ) : (
              <ul className="flex flex-col gap-sm">
                {observations.slice(0, 5).map((observation) => (
                  <li key={observation.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                    <span className="text-body leading-body text-text-primary">
                      {OBSERVATION_KIND_LABELS[observation.kind as ObservationKind] ?? 'Measurement'}:{' '}
                      {formatValue(observation)}
                    </span>
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      {observation.observedAt.slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex flex-col gap-sm">
            <h3 className="text-label leading-label text-text-secondary">Recent results</h3>
            {labs.length === 0 ? (
              quiet('No results have been shared with you yet.')
            ) : (
              <ul className="flex flex-col gap-sm">
                {labs.slice(0, 5).map((result) => (
                  <li key={result.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                    <span className="text-body leading-body text-text-primary">
                      {result.analyte}
                      {result.value !== null ? `: ${result.value}${result.unit ? ` ${result.unit}` : ''}` : ''}
                    </span>
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      {result.resultedAt.slice(0, 10)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Region>

      <Region title="Quick log">
        <p className="text-body leading-body text-text-secondary">
          Add a weight, blood pressure, glucose, temperature, pulse or a note for your care team.
        </p>
        <div>
          <QuickLogControl insetFill={INSET_FILL} />
        </div>
      </Region>

      {careTaskState !== null ? (
        <CareTasksRegion tasks={careTaskState.tasks} adherence={careTaskState.adherence} variant="patient" />
      ) : null}

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        <Region title="Care plan">
          {visitsFailed ? (
            <StateVariant surface="care plan" retryHref="/patient/home" />
          ) : carePlan.length === 0 ? (
            quiet('Your care team has not recorded a follow-up plan yet.')
          ) : (
            <ul className="flex flex-col gap-sm">
              {carePlan.map((visit) => (
                <li key={visit.id} className="flex flex-col gap-xs">
                  <span className="text-body leading-body text-text-primary">{visit.followUp}</span>
                  {visit.followUpAt !== null ? (
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      Follow-up on {visit.followUpAt.slice(0, 10)}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Region>

        <Region title="Documents">
          {documents.length === 0 ? (
            quiet('No documents have been shared with you yet.')
          ) : (
            <ul className="flex flex-col gap-sm">
              {documents.slice(0, 6).map((document) => (
                <li key={document.id} className="flex flex-wrap items-baseline justify-between gap-sm">
                  <span className="text-body leading-body text-text-primary">{document.filename}</span>
                  <span className="text-label leading-label text-text-secondary">
                    {document.kind.replace(/_/g, ' ')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Region>
      </div>

      <Region title="Communication">
        {conversationId !== undefined ? (
          <ThreadView
            conversationId={conversationId}
            messages={conversationMessages}
            viewer="patient"
          />
        ) : (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            body="Your care team can start a conversation here."
          />
        )}
      </Region>
    </div>
  );
}
