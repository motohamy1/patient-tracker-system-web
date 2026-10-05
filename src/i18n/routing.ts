/*
 * Locale foundation — locked decision D1: Arabic and English from the first component,
 * RTL via CSS logical properties, Western digits for clinical values.
 *
 * No i18n library: Phase 1 needs only a locale list, a default, and a direction map.
 * Message catalogs arrive with real product strings in Phase 4, and locale negotiation
 * belongs to proxy.ts, which is a Phase 2 decision point (one proxy, two concerns).
 * PROJECT.md forbids adding a dependency without a written reason; this is that reason.
 */

export const locales = ['en', 'ar'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Direction is server-resolved and passed down as a plain string — never computed in a client hook. */
export function directionOf(locale: Locale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/**
 * Locale-aware label for Phase 1 primitives. Inline pairs, NOT a message catalog:
 * real product strings arrive in Phase 4. Plans 01-03 and 01-05 call this instead of
 * hardcoding English or re-inventing a lookup.
 */
export function t(locale: Locale, en: string, ar: string): string {
  return locale === 'ar' ? ar : en;
}