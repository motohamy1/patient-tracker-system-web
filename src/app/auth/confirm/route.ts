// src/app/auth/confirm — the email-verification landing endpoint.
//
// Managed Neon Auth delivers verification + recovery links; this route keeps
// the app's fixed UX: re-validate `next` with the SAME open-redirect guard
// (03-RESEARCH Pitfall 3) and land there. A crafted link never redirects to
// user input; an unknown shape falls to /login?error=auth-verification.
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { isSafeNextPath } from '@/lib/auth/schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const requestedNext = searchParams.get('next') ?? '/';
  const next = isSafeNextPath(requestedNext) ? requestedNext : '/';
  redirect(next);
}
