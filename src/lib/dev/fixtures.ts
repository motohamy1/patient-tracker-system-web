// src/lib/dev/fixtures.ts — dev-only typed stubs (D-18, FOUND-01).
//
// WHY THIS MODULE EXISTS: FOUND-01 bans fake *clinical* data, not all fixtures.
// This module is the one place a `Patient`-shaped structure is permitted in the
// repository, and it is deliberately empty of content.
//
// 1. A FIXTURE CARRIES THE SHAPE, NEVER A VALUE. The types below describe the
//    outline of a patient and its collections; they carry no medication, no
//    lab, no vital, no allergy, no genotype and no document content.
// 2. EVERY COLLECTION IS EMPTY BY CONSTRUCTION. All seven arrays are literal
//    `[]`, so no clinical content can be added here without this header comment
//    becoming wrong.
// 3. NOTHING UNDER `src/app/**` OR `src/components/**` IMPORTS THIS MODULE. Its
//    only consumer is the dev-only gallery behind the dev-route gate (plan
//    02-10). `tests/unit/dev-fixtures.test.ts` asserts both facts as failing
//    tests rather than leaving them to a reviewer's memory.
// 4. A VALUE ADDED HERE WOULD ENTER THE CLIENT BUNDLE if this module were ever
//    imported from a product route, because anything reachable from
//    `src/app/**` is emitted into `.next/static`. That is exactly why the
//    containment test exists (ASVS V8, 02-RESEARCH.md §Security Domain).
//
// DO NOT MISTAKE THESE TYPES FOR A SCHEMA. Provenance, verification state and
// encounter relationships are deliberately NOT modelled here — they belong to
// the phase that owns the data model (AGENTS.md §Data and §Provenance).

/** A single encounter outline. Fields are optional; no field carries a value. */
export type EncounterRecord = { summary?: string };

/** A single medication outline. Fields are optional; no field carries a value. */
export type MedicationRecord = { label?: string };

/** A single lab outline. Fields are optional; no field carries a value. */
export type LabRecord = { label?: string };

/** A single vital-sign outline. Fields are optional; no field carries a value. */
export type VitalRecord = { label?: string };

/** A single allergy outline. Fields are optional; no field carries a value. */
export type AllergyRecord = { label?: string };

/** A single genetics outline. Fields are optional; no field carries a value. */
export type GeneticsRecord = { label?: string };

/** A single document outline. Fields are optional; no field carries a value. */
export type DocumentRecord = { title?: string };

/**
 * The patient SHAPE only: an identifier, a display name and the seven
 * empty-capable clinical collections. It is a stub type, never a schema.
 */
export type Patient = {
  id: string;
  displayName: string;
  encounters: EncounterRecord[];
  medications: MedicationRecord[];
  labs: LabRecord[];
  vitals: VitalRecord[];
  allergies: AllergyRecord[];
  genetics: GeneticsRecord[];
  documents: DocumentRecord[];
};

/**
 * An empty patient list. Zero elements, by construction.
 * @type {Patient[]}
 */
export const EMPTY_PATIENT_LIST: Patient[] = [];

/**
 * A placeholder patient: a literal identifier, a literal display name, and all
 * seven clinical collections empty. It carries no clinical value of any kind.
 * @type {Patient}
 */
export const PLACEHOLDER_PATIENT: Patient = {
  id: 'dev-placeholder',
  displayName: 'Dev placeholder',
  encounters: [],
  medications: [],
  labs: [],
  vitals: [],
  allergies: [],
  genetics: [],
  documents: [],
};
