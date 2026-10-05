import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/routing";

/**
 * Root route: redirect to the default locale.
 *
 * Locale NEGOTIATION (Accept-Language, cookie preference) is not implemented here — it
 * belongs to `proxy.ts`, which Phase 2 composes with Supabase session refresh. This route
 * only guarantees every visitor lands on a locale-prefixed URL.
 */
export default function RootPage() {
  redirect(`/${defaultLocale}`);
}