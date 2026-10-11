// src/lib/auth/server.ts — Managed Neon Auth server (replaces self-hosted Better Auth).
//
// Users + sessions live in the `neon_auth` schema on Lakebase Postgres
// (branch-scoped); emails go through Neon's shared SMTP — no Resend needed.
// Single seam for identity: getSessionUser() below.
import { createNeonAuth } from "@neondatabase/auth/next/server";

export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});
