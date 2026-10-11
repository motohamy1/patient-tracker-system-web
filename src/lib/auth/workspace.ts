// src/lib/auth/workspace.ts — server-side workspace-role resolution (Neon).
//
// Same contract as the Supabase version: verified identity first, membership
// second, typed RESULT — never a redirect inside this module. Identity comes
// from the Better Auth session (session.ts); memberships from Lakebase
// Postgres via getSql() with an explicit user_id pin. RLS policies are inert
// for the owner connection (neon/README.md posture note), so the explicit
// org_id filters on every downstream query are the enforcement.
import "server-only";

import { ROLES, type Role } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";
import { getSql } from "@/lib/db/neon";

/** The route groups this module resolves for (Phase 3: provider + patient; admin for 03-06's guarded surface). */
export type WorkspaceGroup = "provider" | "patient" | "admin";

/**
 * The discriminated resolution result.
 * - `signed-in`      verified identity + a valid membership row for the group
 * - `unaffiliated`   verified identity with zero usable membership rows
 *                    (D-01: an unaffiliated provider user still gets in, to
 *                    create their org; patients join via invite only, D-03)
 * - `unauthenticated` no verifiable session on the request
 */
export type WorkspaceResolution =
  | { kind: "signed-in"; role: Role; orgId: string }
  | { kind: "unaffiliated" }
  | { kind: "unauthenticated" };

// The provider-side roles, as distinct from the patient role. Routing groups
// are role-ACCESS groups: `patient` is its own workspace; every staff role —
// admin_owner included per spec §12's Admin/Organization Owner — lives in the
// (provider) group.
const STAFF_ROLES: Record<string, true> = {
  provider_doctor: true,
  nurse: true,
  receptionist: true,
  admin_owner: true,
};

type MembershipRow = { org_id: string; role: string; created_at: string };

export async function resolveWorkspaceRole(group: WorkspaceGroup): Promise<WorkspaceResolution> {
  const user = await getSessionUser();
  if (!user) return { kind: "unauthenticated" };

  let rows: MembershipRow[];
  try {
    const sql = getSql();
    rows = (await sql`
      select org_id, role, created_at from public.memberships
      where user_id = ${user.id}
      order by created_at asc
    `) as unknown as MembershipRow[];
  } catch (error) {
    // A failed membership READ must not masquerade as "this user has no
    // organisation": that routes a signed-in owner into the create-org flow and
    // lets them mint duplicate orgs. Keep the fail-closed result but surface the
    // reason on the server, where the old silent catch made the failure
    // undiagnosable. Message only — never the connection string or row data.
    const detail = error instanceof Error ? error.message : "unknown error";
    console.error(`[workspace] membership read failed for group "${group}": ${detail}`);
    return { kind: "unaffiliated" };
  }

  const memberships = rows
    .filter((row) => (ROLES as readonly string[]).includes(row.role))
    .map((row) => ({ orgId: row.org_id, role: row.role as Role }));

  if (memberships.length === 0) return { kind: "unaffiliated" };

  // Deterministic pick: the group-appropriate roles first (the visit intends
  // that group), falling back to any membership so redirectForRole can send a
  // cross-role visitor to their own workspace. D-10 guarantees one role per
  // (user, org); between multiple ORGANIZATIONS the earliest membership wins
  // (`order by created_at` above) so the choice never flips between renders.
  const preferred = memberships.filter((membership) =>
    group === "patient" ? membership.role === "patient" : STAFF_ROLES[membership.role],
  );
  const chosen = (preferred.length > 0 ? preferred : memberships)[0];
  return { kind: "signed-in", role: chosen.role, orgId: chosen.orgId };
}
