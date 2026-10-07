// src/lib/supabase/proxy.ts — the session-refresh helper for the Next 16 proxy
// (AUTH-01, D-06).
//
// Implements 03-RESEARCH.md Pattern 2 internals (supabase.com/docs/guides/auth/
// server-side/nextjs "Proxy" section, 0.12.x request-scoped shape): builds an
// updateSession(request) that refreshes an expired access token on every
// request and propagates the refreshed cookies to BOTH the downstream RSC
// context (request.cookies plane) and the browser (response Set-Cookie plane).
//
// Identity is verified with `auth.getClaims()` — the JWT-validating call.
// `getSession` reads the session cookie without validating it and is
// forbidden in server code (AUTH-03 posture; 03-RESEARCH Auth-method summary).
//
// This helper performs ONLY session refresh — no route gating, no role reads,
// no redirects (D-06 + AUTH-03; role protection is RSC resolution + RLS,
// plans 03-02/03-03). No redirect call exists in this module.

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Supabase env contract is not provisioned: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are required (see .env.local — plan 03-01 Task 3 gate).'
    );
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase: SupabaseClient = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        } catch {
          // A hard refusal from the response plane must not break the request;
          // the request.cookies plane still carries the refresh downstream.
        }
      },
    },
  });

  // getClaims() validates and (when the SDK needs to) refreshes the access
  // token through the setAll bridge above. A failure must not 500 every page:
  // if the auth call errors (auth provider unreachable, malformed dummy env),
  // the request continues with the session as-is.
  try {
    await supabase.auth.getClaims();
  } catch {
    // Silent session-refresh degradation — identity is re-verified per route
    // by RSC resolution + RLS, so no access decision was ever made here (D-06).
  }

  return response;
}
