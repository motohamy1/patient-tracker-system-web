// src/proxy.ts — the Next 16 global proxy entry (AUTH-01, D-06).
//
// Next 16 convention (03-RESEARCH Pitfall 1): on next@16.3.8 the file MUST be
// `proxy.ts` — `middleware.ts` is never called. The named `proxy` export
// delegates every request to `updateSession`, which refreshes an expired
// access token and propagates refreshed cookies in both directions
// (RSC context + browser).
//
// This proxy performs ONLY session refresh — no route gating, no role reads,
// no request body inspection (D-06 + AUTH-03). Role protection is server-side
// RSC resolution + Postgres RLS (plans 03-02/03-03).

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
