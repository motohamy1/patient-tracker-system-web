// src/lib/mock-view-types.ts — dev-preview VIEW-MODEL types (authorized mock data).
//
// WHY THIS FILE EXISTS. The product ships with no clinical backend yet (Phase
// 003 owns auth/RLS), so every product route renders an empty shell. To *see*
// the doctor dashboard populated while the real data layer is built, the owner
// authorized a contained, dev-only mock-data preview (see
// `src/lib/dev/mock-clinical.ts` for the full containment note).
//
// These are VIEW MODELS for that preview — deliberately NOT the canonical
// `Patient` type. The canonical `Patient` shape lives in `src/lib/dev/fixtures.ts`
// (value-free) and will ultimately be owned by the real data model
// (AGENTS.md §Data, §Provenance). Nothing here models provenance, verification
// state or encounter relationships; those belong to the real schema phase.
//
// TEST CONTAINMENT (tests/unit/dev-fixtures.test.ts):
//   * Scope — no type here is named `Patient`, so the "Patient-shaped literal
//     only in src/lib/dev" rule is untouched; these are `Mock*` view models.
//   * Reachability — this file lives outside `src/lib/dev`, so a product or
//     component file may import it without tripping the `lib/dev` importer test.
//   * Value tests read only `fixtures.ts`, so the realistic-looking values in
//     `mock-clinical.ts` are not scanned by the fixture-value assertions.
//
// This is MOCK DATA. It is synthetic, non-identifying, and must never be treated
// as real patient information.

/** A status tone for a chip or flag. `neutral` is the no-tint form. */
export type MockTone = 'neutral' | 'success' | 'info' | 'warning' | 'critical';

/** How abnormal a measurement is. */
export type MockFlag = 'normal' | 'low' | 'high' | 'critical';

/** A single active/resolved problem on the problem list. */
export type MockProblem = {
  code: string;
  label: string;
  status: 'active' | 'resolved';
  onset: string;
};

/** A single medication row. */
export type MockMedication = {
  name: string;
  dose: string;
  frequency: string;
  route: string;
  status: 'active' | 'stopped';
  start: string;
  prescriber: string;
};

/** A single lab result row. */
export type MockLab = {
  name: string;
  value: string;
  unit: string;
  range: string;
  flag: MockFlag;
  collected: string;
};

/** One vitals measurement tile. */
export type MockVitalTile = {
  label: string;
  value: string;
  unit: string;
  flag: MockFlag;
};

/** The Overview vitals snapshot: a set of tiles taken at one time. */
export type MockVitalsSnapshot = {
  taken: string;
  tiles: MockVitalTile[];
};

/** A single allergy row. */
export type MockAllergy = {
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  status: 'active' | 'inactive';
};

/** A single encounter / visit row. */
export type MockEncounter = {
  date: string;
  kind: string;
  reason: string;
  clinician: string;
  note: string;
  status: 'completed' | 'scheduled' | 'cancelled';
};

/** A single imaging study row. */
export type MockImaging = {
  study: string;
  bodyPart: string;
  date: string;
  impression: string;
  status: 'final' | 'preliminary';
};

/** A single genetics finding row. */
export type MockGenetics = {
  gene: string;
  variant: string;
  significance: 'pathogenic' | 'likely pathogenic' | 'uncertain' | 'benign';
  condition: string;
};

/** A single AI-analytics insight card. */
export type MockInsight = {
  kind: 'risk' | 'trend' | 'alert' | 'recommendation';
  title: string;
  detail: string;
  tone: MockTone;
};

/** A single document row. */
export type MockDocument = {
  title: string;
  kind: string;
  date: string;
  size: string;
};

/**
 * The dev-preview patient view model: identity, a vitals snapshot, and the
 * clinical collections the workspace tabs render. Every collection is a plain
 * array so the preview can show populated tables.
 */
export type MockPatientView = {
  id: string;
  displayName: string;
  age: number;
  sex: string;
  dob: string;
  recordRef: string;
  phone: string;
  bloodType: string;
  clinician: string;
  statusTone: MockTone;
  statusLabel: string;
  lastVisit: string;
  snapshot: MockVitalsSnapshot;
  problems: MockProblem[];
  medications: MockMedication[];
  labs: MockLab[];
  allergies: MockAllergy[];
  encounters: MockEncounter[];
  imaging: MockImaging[];
  genetics: MockGenetics[];
  insights: MockInsight[];
  documents: MockDocument[];
};
