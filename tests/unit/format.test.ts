import { describe, expect, it } from "vitest";

import { clinicalUnits, formatBloodPressure, formatClinicalNumber } from "@/lib/format";

/** Arabic-Indic (U+0660–U+0669) and Extended Arabic-Indic (U+06F0–U+06F9) digits. */
const ARABIC_INDIC_DIGITS = /[\u0660-\u0669\u06F0-\u06F9]/;

describe("clinical number formatting (locked decision D1)", () => {
  it("groups English clinical numbers with Western digits", () => {
    expect(formatClinicalNumber(1234.5, 'en')).toContain('1,234.5');
  });

  it("keeps English clinical numbers free of Arabic-Indic digits", () => {
    expect(formatClinicalNumber(1234.5, 'en')).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it("keeps Arabic-locale clinical numbers free of Arabic-Indic digits", () => {
    // Without `numberingSystem: 'latn'` this would render as ١٬٢٣٤٫٥.
    expect(formatClinicalNumber(1234.5, 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it("renders the same Western digits under both locales", () => {
    expect(formatClinicalNumber(1234.5, 'ar')).toBe(formatClinicalNumber(1234.5, 'en'));
    expect(formatClinicalNumber(1234.5, 'ar')).toContain('1,234.5');
  });

  it("forces Latin digits even where ICU defaults to Arabic-Indic", () => {
    // Node's ICU resolves bare 'ar' to numberingSystem 'latn', so the 'ar' assertions
    // above would pass even without the option. 'ar-EG' resolves to 'arab', which is
    // the case that proves the explicit option is load-bearing: an ICU default change
    // cannot silently flip clinical digits while the option stays pinned.
    expect(new Intl.NumberFormat('ar-EG').resolvedOptions().numberingSystem).not.toBe('latn');
    expect(new Intl.NumberFormat('ar-EG', { numberingSystem: 'latn' }).format(1234.5)).toBe(
      formatClinicalNumber(1234.5, 'ar'),
    );
  });

  it("defaults to the default locale when none is passed", () => {
    expect(formatClinicalNumber(1234.5)).toBe(formatClinicalNumber(1234.5, 'en'));
  });

  it("groups large values in both locales", () => {
    expect(formatClinicalNumber(1234567.891, 'ar')).toBe('1,234,567.891');
    expect(formatClinicalNumber(1234567.891, 'ar')).not.toMatch(ARABIC_INDIC_DIGITS);
  });

  it("states the Egypt-appropriate units explicitly", () => {
    expect(clinicalUnits).toEqual({
      weight: 'kg',
      temperature: '°C',
      bloodPressure: 'mmHg',
      glucose: 'mg/dL',
    });
  });

  it("formats blood pressure as systolic/diastolic mmHg", () => {
    expect(formatBloodPressure(120, 80, 'en')).toBe('120/80 mmHg');
    expect(formatBloodPressure(120, 80, 'ar')).toBe('120/80 mmHg');
    expect(formatBloodPressure(160, 110, 'en')).not.toMatch(ARABIC_INDIC_DIGITS);
  });
});