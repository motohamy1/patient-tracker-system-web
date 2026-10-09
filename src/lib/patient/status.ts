// src/lib/patient/status.ts — the patient-side vocabularies (Phase 13;
// 0012 mirror).
//
// The closed observation vocabulary is PTH-02's "explicitly allowed types":
// the patient can log a measurement from this list or a note — never a
// diagnosis, a medication or a clinical impression.
export type ObservationKind = 'weight' | 'blood_pressure' | 'glucose' | 'temperature' | 'pulse' | 'note';

export const OBSERVATION_KINDS = [
  'weight',
  'blood_pressure',
  'glucose',
  'temperature',
  'pulse',
  'note',
] as const satisfies readonly ObservationKind[];

export const OBSERVATION_KIND_LABELS: Record<ObservationKind, string> = {
  weight: 'Weight',
  blood_pressure: 'Blood pressure',
  glucose: 'Glucose',
  temperature: 'Temperature',
  pulse: 'Pulse',
  note: 'Note',
};

/** The units a measurement kind may carry (0012's check constraint mirror). */
export const OBSERVATION_UNITS = [
  'kg',
  'g',
  'lb',
  'mmol/L',
  'mg/dL',
  'celsius',
  'fahrenheit',
  'bpm',
] as const;

export type ObservationUnit = (typeof OBSERVATION_UNITS)[number];

/** The sensible unit per kind (the form narrows the choices, never invents). */
export const OBSERVATION_KIND_UNITS: Record<ObservationKind, readonly ObservationUnit[]> = {
  weight: ['kg', 'lb', 'g'],
  blood_pressure: [],
  glucose: ['mmol/L', 'mg/dL'],
  temperature: ['celsius', 'fahrenheit'],
  pulse: ['bpm'],
  note: [],
};

/** Whether a kind takes one value, two (systolic/diastolic), or none. */
export function observationValueShape(kind: ObservationKind): 'single' | 'dual' | 'none' {
  if (kind === 'blood_pressure') return 'dual';
  if (kind === 'note') return 'none';
  return 'single';
}
