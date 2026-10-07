// src/lib/auth/workspace.ts — server-side workspace-role resolution (AUTH-01/03).
//
// Implements 03-RESEARCH.md Pattern 3: verified identity first, membership
// second, and a typed RESULT — never a redirect inside this module. Redirect
// is UX (D-12), owned by src/lib/auth/redirect.ts at one call site per layout;
// keeping that split makes every resolution branch table-testable with a
// mocked Supabase client and no network.
//
// How the server answer is obtained (the D-12 citation for every step):
//  1. `supabase.auth.getClaims()` verifies the request's JWT server-side;
//     the unverified session-cookie read is never used for authorization
//     anywhere in this module (RESEARCH anti-pattern list).
//  2. `memberships` rows for the claimed user come back already filtered by
//     migration 0002's RLS SELECT policy (own row OR the revision-r2
//     admin_owner/provider_doctor org visibility); the `.eq('user_id', uid)`
//     here pins the query to the caller's own rows regardless.
//  3. An unknown role string filters out and leaves zero valid rows -> the
//     resolver FAILS CLOSED (`unaffiliated`), never invents a role.
//
// This is NOT the security boundary. RLS (migration 0002) enforces everything
// underneath every data path; this module exists so the layouts can render the
// right chrome and send cross-role visitors to their own workspace.

import 'server-only';

import { ROLES, type Role } from '@/lib/auth/roles';
import { createClient } from '@/lib/supabase/server';

/** The route groups this module resolves for (Phase 3: provider + patient; admin for 03-06's guarded surface). */
export type WorkspaceGroup = 'provider' | 'patient' | 'admin';

/**
 * The discriminated resolution result.
 * - `signed-in`      verified identity + a valid membership row for the group
 * - `unaffiliated`   verified identity with zero usable membership rows
 *                    (D-01: an unaffiliated provider user still gets in, to
 *                    create their org; patients join via invite only, D-03)
 * - `unauthenticated` no verifiable claims on the request
 */
export type WorkspaceResolution =
  | { kind: 'signed-in'; role: Role; orgId: string }
  | { kind: 'unaffiliated' }
  | { kind: 'unauthenticated' };

// The provider-side roles, as distinct from the patient role. Routing groups
// are role-ACCESS groups: `patient` is its own workspace; every staff role —
// admin_owner included per spec §12's Admin/Organization Owner — lives in the
// (provider) group.
const STAFF_ROLES: ReadonlySet<Role> = new Set([
  'provider_doctor',
  'nurse',
  'receptionist',
  'admin_owner',
]);

export async function resolveWorkspaceRole(group: WorkspaceGroup): Promise<WorkspaceResolution> {
  const supabase = await createClient();

  const { data, error: claimsError } = await supabase.auth.getClaims();
  const claims = claimsError ? null : (data?.claims ?? null);
  const uid = claims?.sub;
  if (!uid) return { kind: 'unauthenticated' };

  const { data: rows, error: rowsError } = await supabase
    .from('memberships')
    .select('org_id, role, created_at')
    .eq('user_id', uid)
    .order('created_at', { ascending: true });

  const memberships = (rowsError ? [] : (rows ?? []))
    .filter((row) => (ROLES as readonly string[]).includes(row.role))
    .map((row) => ({ orgId: row.org_id, role: row.role as Role }));

  if (memberships.length === 0) return { kind: 'unaffiliated' };

  // Deterministic pick: the group-appropriate roles first (the visit intends
  // that group), falling back to any membership so redirectForRole can send a
  // cross-role visitor to their own workspace. D-10 guarantees one role per
  // (user, org); between multiple ORGANIZATIONS the earliest membership wins
  // (`order('created_at')` above) so the choice never flips between renders.
  const preferred = memberships.filter((membership) =>
    group === 'patient' ? membership.role === 'patient' : STAFF_ROLES.has(membership.role),
  );
  const chosen = (preferred.length > 0 ? preferred : memberships)[0];
  return { kind: 'signed-in', role: chosen.role, orgId: chosen.orgId };
}
