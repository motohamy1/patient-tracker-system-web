// tests/visual/auth.ts — the shared authenticated-state contract for the
// Phase-3 visual harness (plan 03-07).
//
// WHY THIS FILE EXISTS. Phase 3 wired server-side role resolution into the
// (provider)/(patient) layouts (plan 03-03), so an unauthenticated navigation
// to /provider or /patient now lands on /login. Every authenticated surface the
// phase mandates — the D-13 denial page, the UX-03 offline strip, the D-15
// admin audit view, and the four regressed Phase-2 workspace shells — must be
// captured in its real, signed-in state. This module is the single source of
// truth for the seeded credentials, the role landing URLs, and the
// storageState file paths that the setup project (`auth.setup.ts`) writes and
// the specs consume via `test.use({ storageState })`.
//
// CREDENTIALS ARE THE SEEDED LOCAL DEV ACCOUNTS, NOT SECRETS. owner@clinic.test
// and patient@clinic.test are two of the six AUTH-08 acceptance accounts; every
// one shares the documented local-only dev password `Phase3Dev!pass`. These are
// fixed dev addresses that never resemble real accounts, and the harness runs
// only against the local dev server. The Supabase seed file that used to create
// them is retired (neon/README.md → Dev users), so they must exist in the Neon
// auth branch before this harness runs. No production credential ever enters
// this file.
//
// LANDING URLS ARE THE D-12 RULE. A successful sign-in pushes /provider
// (login-form.tsx), then the layout slot resolves the role: a staff/owner
// principal stays on /provider, and a patient principal is redirected to
// /patient. auth.setup.ts waits for the role's landing so a missing/renamed
// seed account fails loudly instead of silently persisting an unauthenticated
// state.
//
// STATE PATHS LIVE UNDER tests/visual/.auth/, WHICH IS GITIGNORED. The
// storageState JSON holds live session cookies and is a runtime artifact: the
// committed baselines are the durable output, the auth state never is (D-14 /
// D-15 / D-17 harness rules).
import path from 'node:path';

export type AuthRole = 'owner' | 'patient';

export type AuthUser = {
  role: AuthRole;
  email: string;
  password: string;
  /** The D-12 workspace landing a successful sign-in resolves to for this role. */
  landing: RegExp;
  /** Absolute storageState path written by the setup project and read by test.use. */
  statePath: string;
};

const AUTH_DIR = path.join(process.cwd(), 'tests', 'visual', '.auth');

/**
 * The storageState file paths, keyed by role. `AUTH_USERS` and every spec's
 * `test.use({ storageState })` reference these same strings, so the writer and
 * the readers can never disagree about where the state lives.
 */
export const AUTH_STATE = {
  owner: path.join(AUTH_DIR, 'owner.json'),
  patient: path.join(AUTH_DIR, 'patient.json'),
} as const;

/**
 * The two principals the Phase-3 baselines sign in as. Exactly two: the owner
 * drives the provider-group surfaces (denial, offline strip, audit) and the
 * patient drives the patient-group shells.
 */
export const AUTH_USERS: readonly AuthUser[] = [
  {
    role: 'owner',
    email: 'owner@clinic.test',
    password: 'Phase3Dev!pass',
    landing: /\/provider(\/|$)/,
    statePath: AUTH_STATE.owner,
  },
  {
    role: 'patient',
    email: 'patient@clinic.test',
    password: 'Phase3Dev!pass',
    landing: /\/patient(\/|$)/,
    statePath: AUTH_STATE.patient,
  },
];
