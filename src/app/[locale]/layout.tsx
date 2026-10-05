import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { directionOf, isLocale, locales } from "@/i18n/routing";

/*
 * Locale shell — locked decision D1: Arabic and English from the first component.
 *
 * SERVER COMPONENT on purpose. `dir` decides the whole document's bidi layout, so it must
 * be resolved on the server and present in the very first paint. Computing it in a client
 * hook or from `useEffect` guarantees a wrong-direction first paint in Arabic.
 *
 * `next-intl` was deliberately NOT added: it is not in the approved stack (PROJECT.md
 * forbids adding a library without a written reason), and Phase 1 needs only a locale list,
 * a direction map, and inline label pairs. Real message catalogs arrive with real product
 * strings in Phase 4, and locale negotiation (Accept-Language) belongs to the single
 * `proxy.ts` that Phase 2 also needs for Supabase session refresh — one proxy, two concerns,
 * composed deliberately rather than by accident.
 */

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = { title: "Clinical Patient Workspace" };

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  // Next 16 delivers route params as a Promise; it must be awaited before use.
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={locale} dir={directionOf(locale)}>
      <body>{children}</body>
    </html>
  );
}