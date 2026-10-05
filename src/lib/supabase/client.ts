import { createBrowserClient } from "@supabase/ssr";

/*
 * Browser Supabase client (FND-09).
 *
 * Reads ONLY the two public variables declared in .env.example. `NEXT_PUBLIC_*` values
 * are inlined into the client bundle at `next build` time, so this module can never read
 * a non-prefixed variable — that is the mechanism, not an accident. The privileged key
 * does not exist on this side of the boundary at all.
 *
 * `createBrowserClient` is ALREADY a singleton, so there is no manual cache and no
 * `useMemo` guard to add here.
 *
 * NOTE: the env var is `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, not the legacy
 * `NEXT_PUBLIC_SUPABASE_ANON_KEY`; the legacy anonymous/privileged key pair is
 * deprecated by the end of 2026. Following an older tutorial produces a confusing
 * runtime auth failure.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
