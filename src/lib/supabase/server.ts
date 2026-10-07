// src/lib/supabase/server.ts — the per-request Supabase server client (AUTH-01).
//
// Implements 03-RESEARCH.md Pattern 1 verbatim (supabase.com/docs/guides/auth/
// server-side/nextjs, 0.12.x shape): `createServerClient` built on the request's
// cookies via `getAll`/`setAll` from `next/headers`. The `setAll` try/catch
// swallow is load-bearing — Server Components cannot write cookies; the proxy
// (src/proxy.ts -> updateSession) owns the refresh + Set-Cookie instead.
//
// D-06 / AUTH-03 posture: this is the IDENTITY transport only. It makes no role
// or access decision itself; role resolution lives in src/lib/auth/workspace.ts
// (plan 03-03) and enforcement in Postgres RLS (plan 03-02).
//
// A missing env value produces a named error — never an `undefined` string
// silently handed to `createServerClient`.

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

export async function createClient(): Promise<SupabaseClient<Database>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env contract is not provisioned: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required (see .env.local — plan 03-01 Task 3 gate).'
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Cannot set cookies in a Server Component render;
          // the proxy handles the refresh + Set-Cookie instead.
        }
      },
    },
  });
}
