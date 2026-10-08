'use client';

// src/components/dev/MockDoctorDashboard.tsx — the dev-only doctor-dashboard
// preview populated with MOCK patients.
//
// This is a TEMPORARY development surface. It renders synthetic patient data
// (see `src/lib/dev/mock-clinical.ts` for the full containment note) so the
// doctor dashboard and patient workspace can be reviewed with content before the
// real data layer lands. It is reachable only through the dev gallery route
// (`/dev/gallery?preview=doctor`), which 404s in production (D-26).
//
// It is NOT a product surface: no `/provider` or `/patient` route imports it, and
// it does not touch the real data model, auth or RLS. Delete it with the mock
// data when the backend ships.
//
// CLIENT-SAFE PRIMITIVES ONLY. `TabBar` and `CompactControl` read
// `docs/governance/tokens.json` via `node:fs` at module load and cannot enter the
// client graph (see Gallery.tsx). This component therefore renders its own tab
// strip from the token utilities and uses only `Surface` / `makeIcon`, which are
// client-safe. Styling uses generated token utilities only (INV-01, INV-03): no
// raw hex, no generic palette, no card perimeter edges (INV-16 — separation is
// by fill + the two frozen shadows).
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  ChartLine,
  Dna,
  FlaskConical,
  LayoutDashboard,
  Pill as PillIcon,
  ScanLine,
  TriangleAlert,
} from 'lucide-react';
import { makeIcon, Surface } from '@/components/primitives';
import type {
  MockFlag,
  MockPatientView,
  MockTone,
} from '@/lib/mock-view-types';

const OverviewIcon = makeIcon(LayoutDashboard);
const AnalyticsIcon = makeIcon(ChartLine);
const VisitsIcon = makeIcon(CalendarDays);
const MedsIcon = makeIcon(PillIcon);
const LabsIcon = makeIcon(FlaskConical);
const ImagingIcon = makeIcon(ScanLine);
const AllergiesIcon = makeIcon(TriangleAlert);
const GeneticsIcon = makeIcon(Dna);

const TABS = [
  { slug: 'overview', label: 'Overview', Icon: OverviewIcon },
  { slug: 'analytics', label: 'AI Analytics', Icon: AnalyticsIcon },
  { slug: 'visits', label: 'Visits', Icon: VisitsIcon },
  { slug: 'medications', label: 'Medications', Icon: MedsIcon },
  { slug: 'labs', label: 'Labs', Icon: LabsIcon },
  { slug: 'imaging', label: 'Imaging', Icon: ImagingIcon },
  { slug: 'allergies', label: 'Allergies', Icon: AllergiesIcon },
  { slug: 'genetics', label: 'Genetics', Icon: GeneticsIcon },
] as const;

type TabSlug = (typeof TABS)[number]['slug'];

const TONE_DOT: Record<MockTone, string> = {
  neutral: 'bg-border-subtle',
  success: 'bg-success',
  info: 'bg-info',
  warning: 'bg-warning',
  critical: 'bg-critical',
};

const FLAG_TONE: Record<MockFlag, MockTone> = {
  normal: 'neutral',
  low: 'info',
  high: 'warning',
  critical: 'critical',
};

const ALLERGY_TONE: Record<MockPatientView['allergies'][number]['severity'], MockTone> = {
  mild: 'neutral',
  moderate: 'info',
  severe: 'warning',
  critical: 'critical',
};

const ENCOUNTER_TONE: Record<MockPatientView['encounters'][number]['status'], MockTone> = {
  completed: 'success',
  scheduled: 'info',
  cancelled: 'neutral',
};

function StatusChip({ tone, label }: { tone: MockTone; label: string }) {
  return (
    <span className="inline-flex items-center gap-xs rounded-pill bg-surface-muted px-md py-xs text-label leading-label text-text-primary">
      <span aria-hidden="true" className={`inline-block size-4 shrink-0 rounded-pill ${TONE_DOT[tone]}`} />
      {label}
    </span>
  );
}

function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: string;
  children: ReactNode;
}) {
  return (
    <Surface variant="surface" as="section" className="flex flex-col gap-md">
      <div className="flex items-center justify-between gap-md">
        <h3 className="text-heading font-semibold leading-heading text-text-primary">{title}</h3>
        {action ? (
          <span className="text-label leading-label text-text-primary">{action}</span>
        ) : null}
      </div>
      {children}
    </Surface>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-xs">
      <span className="text-label leading-label text-text-primary">{label}</span>
      <span className="text-body font-semibold leading-body text-text-primary">{value}</span>
    </div>
  );
}

function StatTile({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: MockTone;
}) {
  return (
    <Surface variant="surfaceMuted" className="flex flex-col gap-xs">
      <div className="flex items-center gap-xs">
        <span aria-hidden="true" className={`inline-block size-4 shrink-0 rounded-pill ${TONE_DOT[tone]}`} />
        <span className="text-label leading-label text-text-primary">{label}</span>
      </div>
      <div className="flex items-baseline gap-xs">
        <span className="text-heading font-semibold leading-heading text-text-primary">{value}</span>
        {unit ? <span className="text-label leading-label text-text-primary">{unit}</span> : null}
      </div>
    </Surface>
  );
}

export type MockDoctorDashboardProps = {
  patients: MockPatientView[];
};

export function MockDoctorDashboard({ patients }: MockDoctorDashboardProps) {
  const [selectedId, setSelectedId] = useState<string>(patients[0]?.id ?? '');
  const [tab, setTab] = useState<TabSlug>('overview');

  const selected = patients.find((patient) => patient.id === selectedId) ?? patients[0];

  if (!selected) {
    return (
      <Surface variant="canvas" className="bg-canvas p-lg">
        <p className="text-body leading-body text-text-primary">No mock patients available.</p>
      </Surface>
    );
  }

  return (
    <Surface variant="canvas" className="flex min-h-screen flex-col gap-lg bg-canvas p-lg md:p-xl">
      {/* Preview banner — this whole surface is synthetic sample data. */}
      <div className="flex flex-wrap items-center gap-md rounded-lg bg-surface-muted p-md">
        <StatusChip tone="warning" label="Mock data" />
        <p className="text-body leading-body text-text-primary">
          Dev preview of the doctor dashboard — synthetic sample patients, not real records. Reachable only
          behind the dev-route gate.
        </p>
      </div>

      <header className="flex flex-col gap-xs">
        <h1 className="text-display font-semibold leading-tight text-text-primary">Doctor Dashboard</h1>
        <p className="text-body leading-body text-text-primary">
          {patients.length} mock patients in the practice · select a folder to open the clinical workspace
        </p>
      </header>

      <div className="flex flex-col gap-lg lg:flex-row">
        {/* Patient folders */}
        <nav aria-label="Mock patient folders" className="flex w-full flex-col gap-sm lg:w-80">
          <h2 className="text-label font-semibold leading-label text-text-primary">Patients</h2>
          <ul className="flex flex-col gap-sm">
            {patients.map((patient) => {
              const isSelected = patient.id === selected.id;
              return (
                <li key={patient.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(patient.id);
                      setTab('overview');
                    }}
                    aria-current={isSelected ? 'true' : undefined}
                    className={[
                      'flex w-full flex-col gap-sm rounded-lg p-lg text-left shadow-raised',
                      isSelected ? 'bg-surface-raised' : 'bg-surface',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-xs">
                      {isSelected ? (
                        <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-accent" />
                      ) : null}
                      <span className="text-heading font-semibold leading-heading text-text-primary">
                        {patient.displayName}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-xs">
                      <StatusChip tone={patient.statusTone} label={patient.statusLabel} />
                      <span className="text-label leading-label text-text-primary">
                        {patient.age} · {patient.sex}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-md">
                      <span className="text-label leading-label text-text-primary">{patient.recordRef}</span>
                      <span className="text-label leading-label text-text-primary">
                        Last visit {patient.lastVisit}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Patient workspace */}
        <div className="flex min-w-0 flex-1 flex-col gap-lg">
          <Surface variant="surfaceRaised" className="flex flex-col gap-md">
            <div className="flex flex-wrap items-start justify-between gap-md">
              <div className="flex flex-col gap-xs">
                <h2 className="text-display font-semibold leading-tight text-text-primary">
                  {selected.displayName}
                </h2>
                <p className="text-body leading-body text-text-primary">
                  {selected.age} · {selected.sex} · DOB {selected.dob} · {selected.bloodType}
                </p>
                <p className="text-label leading-label text-text-primary">
                  {selected.recordRef} · {selected.phone} · {selected.clinician}
                </p>
              </div>
              <StatusChip tone={selected.statusTone} label={selected.statusLabel} />
            </div>

            <div className="grid grid-cols-2 gap-sm md:grid-cols-3 xl:grid-cols-6">
              {selected.snapshot.tiles.map((tile) => (
                <StatTile
                  key={tile.label}
                  label={tile.label}
                  value={tile.value}
                  unit={tile.unit}
                  tone={FLAG_TONE[tile.flag]}
                />
              ))}
            </div>
            <p className="text-label leading-label text-text-primary">
              Vitals snapshot · {selected.snapshot.taken}
            </p>
          </Surface>

          {/* Workspace tabs */}
          <div
            role="tablist"
            aria-label="Workspace tabs"
            className="flex flex-wrap items-center gap-xs rounded-pill bg-surface-muted p-xs"
          >
            {TABS.map(({ slug, label, Icon }) => {
              const isActive = slug === tab;
              return (
                <button
                  key={slug}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setTab(slug)}
                  className={[
                    'inline-flex items-center gap-xs rounded-pill px-md py-sm text-label leading-label',
                    isActive ? 'bg-accent-soft text-text-primary' : 'bg-surface text-text-primary',
                  ].join(' ')}
                >
                  <Icon size="sm" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div role="tabpanel" className="flex flex-col gap-lg">
            {tab === 'overview' ? (
              <>
                <div className="grid grid-cols-1 gap-lg xl:grid-cols-2">
                  <SectionCard title="Active problems" action={`${selected.problems.filter((p) => p.status === 'active').length} active`}>
                    <ul className="flex flex-col gap-sm">
                      {selected.problems.map((problem) => (
                        <li key={problem.code} className="flex items-start justify-between gap-md">
                          <div className="flex flex-col gap-xs">
                            <span className="text-body font-semibold leading-body text-text-primary">
                              {problem.label}
                            </span>
                            <span className="text-label leading-label text-text-primary">
                              {problem.code} · onset {problem.onset}
                            </span>
                          </div>
                          <StatusChip
                            tone={problem.status === 'active' ? 'warning' : 'neutral'}
                            label={problem.status}
                          />
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  <SectionCard title="Current medications" action={`${selected.medications.filter((m) => m.status === 'active').length} active`}>
                    <ul className="flex flex-col gap-sm">
                      {selected.medications.map((med) => (
                        <li key={med.name} className="flex items-start justify-between gap-md">
                          <div className="flex flex-col gap-xs">
                            <span className="text-body font-semibold leading-body text-text-primary">
                              {med.name} · {med.dose}
                            </span>
                            <span className="text-label leading-label text-text-primary">
                              {med.frequency} · {med.route}
                            </span>
                          </div>
                          <StatusChip
                            tone={med.status === 'active' ? 'success' : 'neutral'}
                            label={med.status}
                          />
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  <SectionCard title="Recent labs" action={`${selected.labs.length} results`}>
                    <ul className="flex flex-col gap-sm">
                      {selected.labs.slice(0, 4).map((lab) => (
                        <li key={lab.name} className="flex items-center justify-between gap-md">
                          <div className="flex flex-col gap-xs">
                            <span className="text-body font-semibold leading-body text-text-primary">
                              {lab.name}
                            </span>
                            <span className="text-label leading-label text-text-primary">
                              ref {lab.range} · {lab.collected}
                            </span>
                          </div>
                          <div className="flex items-center gap-sm">
                            <span className="text-body font-semibold leading-body text-text-primary">
                              {lab.value} {lab.unit}
                            </span>
                            <StatusChip tone={FLAG_TONE[lab.flag]} label={lab.flag} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </SectionCard>

                  <SectionCard title="Allergies" action={`${selected.allergies.length} recorded`}>
                    {selected.allergies.length === 0 ? (
                      <p className="text-body leading-body text-text-primary">No known allergies.</p>
                    ) : (
                      <ul className="flex flex-col gap-sm">
                        {selected.allergies.map((allergy) => (
                          <li key={allergy.substance} className="flex items-start justify-between gap-md">
                            <div className="flex flex-col gap-xs">
                              <span className="text-body font-semibold leading-body text-text-primary">
                                {allergy.substance}
                              </span>
                              <span className="text-label leading-label text-text-primary">
                                {allergy.reaction}
                              </span>
                            </div>
                            <StatusChip tone={ALLERGY_TONE[allergy.severity]} label={allergy.severity} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                </div>
              </>
            ) : null}

            {tab === 'analytics' ? (
              <SectionCard title="AI analytics" action="insight cards">
                <ul className="flex flex-col gap-sm">
                  {selected.insights.map((insight) => (
                    <li key={insight.title} className="flex flex-col gap-xs rounded-lg bg-surface-muted p-md">
                      <div className="flex items-center gap-xs">
                        <span aria-hidden="true" className={`inline-block size-4 shrink-0 rounded-pill ${TONE_DOT[insight.tone]}`} />
                        <span className="text-body font-semibold leading-body text-text-primary">
                          {insight.title}
                        </span>
                        <span className="text-label leading-label text-text-primary">{insight.kind}</span>
                      </div>
                      <p className="text-body leading-body text-text-primary">{insight.detail}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {tab === 'visits' ? (
              <SectionCard title="Encounters" action={`${selected.encounters.length} visits`}>
                <ul className="flex flex-col gap-sm">
                  {selected.encounters.map((encounter) => (
                    <li key={`${encounter.date}-${encounter.reason}`} className="flex flex-col gap-xs rounded-lg bg-surface-muted p-md">
                      <div className="flex items-center justify-between gap-md">
                        <span className="text-body font-semibold leading-body text-text-primary">
                          {encounter.date} · {encounter.kind}
                        </span>
                        <StatusChip tone={ENCOUNTER_TONE[encounter.status]} label={encounter.status} />
                      </div>
                      <span className="text-label leading-label text-text-primary">
                        {encounter.reason} · {encounter.clinician}
                      </span>
                      <p className="text-body leading-body text-text-primary">{encounter.note}</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>
            ) : null}

            {tab === 'medications' ? (
              <SectionCard title="Medications" action={`${selected.medications.length} total`}>
                <div className="flex flex-col gap-sm">
                  <div className="hidden grid-cols-12 gap-md md:grid">
                    <span className="col-span-4 text-label leading-label text-text-primary">Medication</span>
                    <span className="col-span-2 text-label leading-label text-text-primary">Dose</span>
                    <span className="col-span-3 text-label leading-label text-text-primary">Frequency</span>
                    <span className="col-span-3 text-label leading-label text-text-primary">Status</span>
                  </div>
                  {selected.medications.map((med) => (
                    <div key={med.name} className="grid grid-cols-1 gap-xs rounded-lg bg-surface-muted p-md md:grid-cols-12 md:gap-md">
                      <span className="col-span-4 text-body font-semibold leading-body text-text-primary">
                        {med.name}
                      </span>
                      <span className="col-span-2 text-body leading-body text-text-primary">{med.dose}</span>
                      <span className="col-span-3 text-body leading-body text-text-primary">{med.frequency}</span>
                      <span className="col-span-3">
                        <StatusChip tone={med.status === 'active' ? 'success' : 'neutral'} label={med.status} />
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {tab === 'labs' ? (
              <SectionCard title="Laboratory results" action={`${selected.labs.length} results`}>
                <div className="flex flex-col gap-sm">
                  <div className="hidden grid-cols-12 gap-md md:grid">
                    <span className="col-span-4 text-label leading-label text-text-primary">Test</span>
                    <span className="col-span-3 text-label leading-label text-text-primary">Result</span>
                    <span className="col-span-3 text-label leading-label text-text-primary">Reference</span>
                    <span className="col-span-2 text-label leading-label text-text-primary">Flag</span>
                  </div>
                  {selected.labs.map((lab) => (
                    <div key={lab.name} className="grid grid-cols-1 gap-xs rounded-lg bg-surface-muted p-md md:grid-cols-12 md:gap-md">
                      <span className="col-span-4 text-body font-semibold leading-body text-text-primary">
                        {lab.name}
                      </span>
                      <span className="col-span-3 text-body leading-body text-text-primary">
                        {lab.value} {lab.unit}
                      </span>
                      <span className="col-span-3 text-body leading-body text-text-primary">{lab.range}</span>
                      <span className="col-span-2">
                        <StatusChip tone={FLAG_TONE[lab.flag]} label={lab.flag} />
                      </span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            ) : null}

            {tab === 'imaging' ? (
              <SectionCard title="Imaging" action={`${selected.imaging.length} studies`}>
                {selected.imaging.length === 0 ? (
                  <p className="text-body leading-body text-text-primary">No imaging studies recorded.</p>
                ) : (
                  <ul className="flex flex-col gap-sm">
                    {selected.imaging.map((study) => (
                      <li key={`${study.study}-${study.date}`} className="flex flex-col gap-xs rounded-lg bg-surface-muted p-md">
                        <div className="flex items-center justify-between gap-md">
                          <span className="text-body font-semibold leading-body text-text-primary">
                            {study.study} · {study.bodyPart}
                          </span>
                          <StatusChip tone={study.status === 'final' ? 'success' : 'info'} label={study.status} />
                        </div>
                        <span className="text-label leading-label text-text-primary">{study.date}</span>
                        <p className="text-body leading-body text-text-primary">{study.impression}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            {tab === 'allergies' ? (
              <SectionCard title="Allergies" action={`${selected.allergies.length} recorded`}>
                {selected.allergies.length === 0 ? (
                  <p className="text-body leading-body text-text-primary">No known allergies.</p>
                ) : (
                  <ul className="flex flex-col gap-sm">
                    {selected.allergies.map((allergy) => (
                      <li key={allergy.substance} className="flex items-start justify-between gap-md rounded-lg bg-surface-muted p-md">
                        <div className="flex flex-col gap-xs">
                          <span className="text-body font-semibold leading-body text-text-primary">
                            {allergy.substance}
                          </span>
                          <span className="text-label leading-label text-text-primary">
                            {allergy.reaction} · {allergy.status}
                          </span>
                        </div>
                        <StatusChip tone={ALLERGY_TONE[allergy.severity]} label={allergy.severity} />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}

            {tab === 'genetics' ? (
              <SectionCard title="Genetics" action={`${selected.genetics.length} findings`}>
                {selected.genetics.length === 0 ? (
                  <p className="text-body leading-body text-text-primary">No genetic findings recorded.</p>
                ) : (
                  <ul className="flex flex-col gap-sm">
                    {selected.genetics.map((finding) => (
                      <li key={`${finding.gene}-${finding.variant}`} className="flex items-start justify-between gap-md rounded-lg bg-surface-muted p-md">
                        <div className="flex flex-col gap-xs">
                          <span className="text-body font-semibold leading-body text-text-primary">
                            {finding.gene} · {finding.variant}
                          </span>
                          <span className="text-label leading-label text-text-primary">{finding.condition}</span>
                        </div>
                        <StatusChip
                          tone={
                            finding.significance === 'pathogenic' || finding.significance === 'likely pathogenic'
                              ? 'warning'
                              : finding.significance === 'uncertain'
                                ? 'info'
                                : 'neutral'
                          }
                          label={finding.significance}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            ) : null}
          </div>
        </div>
      </div>
    </Surface>
  );
}
