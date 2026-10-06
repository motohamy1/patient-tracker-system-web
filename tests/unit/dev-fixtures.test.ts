// tests/unit/dev-fixtures.test.ts — the fixture-scope and reachability tests
// for D-18 / FOUND-01.
//
// The "no fake clinical data" requirement is reviewer-evaluated in the ordinary
// case, because it is a judgement about content rather than a pattern. This test
// is the machine-adjacent assist 02-RESEARCH.md §Honest automatability
// assessment specifies: it turns two memory-based rules into failing tests.
//
//  1. SCOPE — `src/lib/dev/**` is the ONLY directory in the repository permitted
//     to declare a `Patient`-shaped literal. A `Patient`-shaped literal is a
//     type/interface/class declaration of the patient type, or a declaration of
//     the placeholder identifiers (02-RESEARCH.md §Honest automatability).
//  2. REACHABILITY — the dev-only gallery page `src/app/dev/gallery/page.tsx`
//     (behind the D-26 gate, plan 02-10) is the SINGLE allowed importer of the
//     `src/lib/dev/` path. No other file under `src/app/**` or
//     `src/components/**` may import it, so no fixture can enter the shipped
//     client bundle (ASVS V8, T-02-60). The assertion keeps the fixture out of
//     every product route rather than forbidding it outright (D-18).
//
// Plus the value assertions: the placeholder carries every clinical collection
// empty by construction, no exported key is named after a clinical entity, and
// the module text carries no dosage, record-number or date literal.
//
// This test runs in the Vitest `node` environment: it reads the filesystem and
// renders nothing.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import * as fixtures from '@/lib/dev/fixtures';
import { EMPTY_PATIENT_LIST, PLACEHOLDER_PATIENT } from '@/lib/dev/fixtures';

const REPO_ROOT = process.cwd();
const SRC_DIR = path.join(REPO_ROOT, 'src');
const FIXTURE_DIR = path.join(SRC_DIR, 'lib', 'dev');
const PRODUCT_SCAN_DIRS = [path.join(SRC_DIR, 'app'), path.join(SRC_DIR, 'components')];

/** The seven clinical collections the placeholder carries; all must be empty. */
const CLINICAL_COLLECTIONS = [
  'encounters',
  'medications',
  'labs',
  'vitals',
  'allergies',
  'genetics',
  'documents',
] as const;

/** No EXPORTED key may be named after a clinical entity (D-18). */
const CLINICAL_VOCABULARY =
  /medication|\blabs?\b|\bvitals?\b|allerg|genotype|diagnos|encounter|prescription/i;

/** A `Patient`-shaped literal: the patient type or a placeholder identifier. */
const PATIENT_SHAPED_RE =
  /\b(?:type|interface|class|enum)\s+Patient\b|\b(?:const|let|var|function)\s+Patient\b|\b(?:const|let|var)\s+(?:EMPTY_PATIENT_LIST|PLACEHOLDER_PATIENT)\b/;

/** The one file outside src/lib/dev allowed to import the fixtures (D-18, 02-10). */
const ALLOWED_FIXTURE_IMPORTER = path.join(SRC_DIR, 'app', 'dev', 'gallery', 'page.tsx');

/** An import (ESM or CJS) from the dev fixture directory. */
const FIXTURE_IMPORT_RE = /(?:from|import|require)\s*\(?\s*['"`][^'"`]*lib\/dev/;

/** A dosage or measurement literal. */
const DOSAGE_RE = /\b\d+(?:\.\d+)?\s*(?:mg|mcg|mL|IU|units|mmHg|mg\/dL)\b/;
/** A record-number literal. */
const RECORD_NUMBER_RE = /\b(?:MRN|patient\s+(?:id|no|number)|record\s+(?:no|number|#))\b/i;
/** A date literal. */
const DATE_RE = /\b(?:19|20)\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/;

/** Collect every `.ts` / `.tsx` file beneath a directory. */
function walkSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkSourceFiles(abs));
    else if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) out.push(abs);
  }
  return out;
}

/** True when `child` is strictly inside `parent` (not equal, not a sibling). */
function isInside(parent: string, child: string): boolean {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

const ALL_SRC_FILES = walkSourceFiles(SRC_DIR);
const PRODUCT_FILES = PRODUCT_SCAN_DIRS.flatMap((dir) =>
  existsSync(dir) ? walkSourceFiles(dir) : [],
);
const FIXTURE_TEXT = readFileSync(path.join(FIXTURE_DIR, 'fixtures.ts'), 'utf8');

describe('dev fixtures — the placeholder carries every clinical collection empty (D-18)', () => {
  it('exposes an empty patient list with zero elements', () => {
    expect(Array.isArray(EMPTY_PATIENT_LIST)).toBe(true);
    expect(EMPTY_PATIENT_LIST).toHaveLength(0);
  });

  it('carries every one of the seven clinical collections as an empty array', () => {
    for (const collection of CLINICAL_COLLECTIONS) {
      const value = PLACEHOLDER_PATIENT[collection];
      expect(Array.isArray(value)).toBe(true);
      expect(value).toHaveLength(0);
    }
  });

  it('names the placeholder with the literal stub identifier and display name', () => {
    expect(PLACEHOLDER_PATIENT.id).toBe('dev-placeholder');
    expect(PLACEHOLDER_PATIENT.displayName).toBe('Dev placeholder');
  });
});

describe('dev fixtures — no clinical vocabulary in an exported key (D-18)', () => {
  it('exports no key whose name matches a clinical entity vocabulary', () => {
    for (const key of Object.keys(fixtures)) {
      expect(key).not.toMatch(CLINICAL_VOCABULARY);
    }
  });
});

describe('dev fixtures — no dosage, record-number or date literal in the module text', () => {
  it('carries no dosage or measurement literal', () => {
    expect(FIXTURE_TEXT).not.toMatch(DOSAGE_RE);
  });

  it('carries no record-number literal', () => {
    expect(FIXTURE_TEXT).not.toMatch(RECORD_NUMBER_RE);
  });

  it('carries no date literal', () => {
    expect(FIXTURE_TEXT).not.toMatch(DATE_RE);
  });
});

describe('dev fixtures — scope: src/lib/dev is the only directory allowed a Patient shape', () => {
  it('declares no Patient-shaped literal outside src/lib/dev', () => {
    const offenders = ALL_SRC_FILES.filter((file) => isInside(FIXTURE_DIR, file) === false).filter(
      (file) => PATIENT_SHAPED_RE.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });
});

describe('dev fixtures — reachability: the dev-only gallery page is the single allowed importer', () => {
  it('is imported by no file under src/app or src/components except the gallery page', () => {
    const offenders = PRODUCT_FILES.filter((file) =>
      FIXTURE_IMPORT_RE.test(readFileSync(file, 'utf8')),
    ).filter((file) => path.resolve(file) !== path.resolve(ALLOWED_FIXTURE_IMPORTER));
    expect(offenders).toEqual([]);
  });

  it('is in fact imported by the gallery page, its single legitimate consumer', () => {
    expect(existsSync(ALLOWED_FIXTURE_IMPORTER)).toBe(true);
    expect(FIXTURE_IMPORT_RE.test(readFileSync(ALLOWED_FIXTURE_IMPORTER, 'utf8'))).toBe(true);
  });
});
