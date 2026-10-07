// src/lib/supabase/client.ts — browser Supabase client singleton (AUTH-01).
//
// One module-level `createBrowserClient` singleton, created lazily so it is
// never evaluated during SSR (the getter body is the only call site). Follows
// the Supabase SSR docs' browser-client pattern (03-RESEARCH.md Pattern 1
// companion).
//
// D-06 / AUTH-03 posture: this client is for any future browser-side reads the
// design language needs; it carries the user's session cookie only and makes
// NO role or access decision — identity is resolved server-side per request.

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env contract is not provisioned: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required (see .env.local — plan 03-01 Task 3 gate).'
    );
  }

  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}
