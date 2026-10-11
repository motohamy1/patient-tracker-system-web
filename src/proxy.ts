// src/proxy.ts — the Next 16 global proxy entry (AUTH-01, D-06).
//
// Next 16 convention (03-RESEARCH Pitfall 1): on next@16.3.8 the file MUST be
// `proxy.ts` — `middleware.ts` is never called. The named `proxy` export
// delegates every request to `updateSession`.
//
// Managed Neon Auth owns the session cookie end-to-end (set through
// /api/auth/[...path], read per-request in session.ts), so this proxy performs
// ONLY pass-through — no route gating, no role reads, no request body
// inspection (D-06 + AUTH-03). Role protection is server-side RSC resolution
// (workspace.ts) + explicit org_id filters on every query.

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/auth/proxy';

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
