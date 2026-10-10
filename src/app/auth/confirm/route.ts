// src/app/auth/confirm — the PKCE token_hash exchange endpoint.
//
// 03-RESEARCH.md Pattern 5 verbatim (supabase.com/docs/guides/auth/passwords
// §PKCE + server-side/nextjs example): the confirmation and recovery email
// templates land here with `token_hash`, `type` and `next`; the route calls
// `verifyOtp` ONCE through the per-request server client, and on success
// redirects to `next` (the emailRedirectTo destination the action validated
// against the 03-01 allowlist). A missing or failed exchange falls to
// /login?error=auth-verification — fixed, calm, no-leak.
//
// D-05: this single endpoint exchanges BOTH token types — the confirmation
// template sends type=email, the recovery template type=recovery.
//
// The unverified session-cookie read appears nowhere; verifyOtp IS the
// verification (RESEARCH anti-pattern list).

import { type EmailOtpType } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSafeNextPath } from '@/lib/auth/schemas';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const requestedNext = searchParams.get('next') ?? '/';
  // Phase 20 (SEC-02): the mint side already validated `next`, but this hop
  // is a separate trust surface — a crafted link carries its own `next`, and
  // verifyOtp succeeds before anything redirects. Re-validate here with the
  // SAME open-redirect guard (03-RESEARCH Pitfall 3) and fall back to the
  // role's landing path. A failed exchange never redirects to user input.
  const next = isSafeNextPath(requestedNext) ? requestedNext : '/';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect(next);
  }
  redirect('/login?error=auth-verification');
}
