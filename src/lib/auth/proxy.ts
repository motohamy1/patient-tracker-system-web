// src/lib/auth/proxy.ts — the Next 16 proxy helper (Managed Neon Auth).
//
// Managed Auth owns the session cookie end-to-end (set on sign-in through the
// /api/auth/[...all] handler, read per-request via getSession in session.ts),
// so there is no token-refresh bridge to run here. This helper performs ONLY
// pass-through — no role reads, no redirects (D-06 + AUTH-03; protection is
// RSC resolution via workspace.ts + explicit org_id filters).
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  return NextResponse.next({ request: { headers: request.headers } });
}
