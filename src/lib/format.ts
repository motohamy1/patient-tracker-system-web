import { defaultLocale, type Locale } from '@/i18n/routing';

/**
 * Clinical values always use Western digits, even under an Arabic locale
 * (locked decision D1).
 *
 * Verified empirically on Node v22.22.3 before these assertions were written:
 * `new Intl.NumberFormat('ar-EG', { numberingSystem: 'latn' }).format(1234.5)`
 * returns `1,234.5`. The option is load-bearing, not decorative: bare 'ar-EG'
 * resolves to numberingSystem 'arab' and returns Arabic-Indic digits.
 */
export function formatClinicalNumber(
  value: number,
  locale: Locale = defaultLocale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, { numberingSystem: 'latn', ...options }).format(value);
}

/** Egypt-appropriate units are explicit; never abbreviated silently. */
export const clinicalUnits = {
  weight: 'kg',
  temperature: '°C',
  bloodPressure: 'mmHg',
  glucose: 'mg/dL',
} as const;

export function formatBloodPressure(
  systolic: number,
  diastolic: number,
  locale: Locale = defaultLocale,
): string {
  return `${formatClinicalNumber(systolic, locale)}/${formatClinicalNumber(diastolic, locale)} ${clinicalUnits.bloodPressure}`;
}