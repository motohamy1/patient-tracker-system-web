import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
 * Server Supabase client — FACTORY SHAPE ONLY. THIS IS NOT WORKING AUTH YET.
 *
 * Phase 1 deliberately stops at the factory. The following are PHASE 2 scope
 * (IDN-01 identity, IDN-06 RBAC) and are intentionally absent, so that Phase 2 is a
 * cutover rather than a rewrite:
 *   - no route protection / redirect on an unauthenticated session
 *   - no `getClaims()` call (the Supabase SSR guide prefers it over `getSession()`,
 *     which must NOT be wrapped in a helper here that Phase 2 would have to delete)
 *   - no session refresh and no `proxy.ts` wiring
 *
 * There is deliberately NO admin/privileged client in this phase. When Phase 2 needs
 * one it must live in a server-only module and must never be reachable from a Client
 * Component (FND-09).
 *
 * Reads the same two public variables as src/lib/supabase/client.ts plus the request
 * cookies. Those are the publishable (browser-safe) values, not a privileged key.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // `setAll` is called from a Server Component, where cookies are read-only.
            // Swallowing here is the documented Supabase pattern; the refresh that
            // actually needs to write cookies belongs in Phase 2's proxy.ts.
          }
        },
      },
    },
  );
}
