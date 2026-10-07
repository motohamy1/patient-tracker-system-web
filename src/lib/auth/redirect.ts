// src/lib/auth/redirect.ts — the D-12 routing rules (AUTH-01/03).
//
// Cross-role navigation NEVER reaches the other workspace: the server resolves
// the role and sends the visitor to their own permitted workspace, and the
// denial surface (03-UI-SPEC §8.4) exists only for deep routes inside the role
// group they otherwise own. The redirect is UX, never the security boundary
// (03-RESEARCH.md Pattern 3) — RLS (migration 0002) enforces everything
// underneath regardless of where the visitor lands.
//
// ONE PLACE for the path strings. The workspace roots and the D-01 org-creation
// onboarding route are exported ONLY here (`redirect.ts` is the single owner of
// these path spellings; callers import the constant). A route here exists on
// the Phase-2 locked route map: /provider, /patient (02-UI-SPEC §6) and the
// 03-05-created /provider/onboarding/create-org (D-01 inside (provider)).
//
// `redirectForRole` calls `redirect()` exactly once per request and returns
// void; the (provider)/(patient) layouts are the only product call sites.

import { redirect } from 'next/navigation';
import type { Role } from '@/lib/auth/roles';
import type { WorkspaceGroup, WorkspaceResolution } from '@/lib/auth/workspace';

export const LOGIN_PATH = '/login';

/** The D-01 owner-bootstrap step (route guarded server-side by plan 03-05). */
export const CREATE_ORG_PATH = '/provider/onboarding/create-org';

/** The provider-group first route: the (provider) group's own workspace root. */
export const PROVIDER_WORKSPACE_PATH = '/provider';

/** The patient-group first route: the (patient) group's own workspace root. */
export const PATIENT_WORKSPACE_PATH = '/patient';

/** The workspace root the given role owns (D-12 "their own permitted workspace"). */
export function ownWorkspaceTarget(role: Role): string {
  return role === 'patient' ? PATIENT_WORKSPACE_PATH : PROVIDER_WORKSPACE_PATH;
}

const PATIENT_ROLE: Role = 'patient';
const ADMIN_OWNER_ROLE: Role = 'admin_owner';

/**
 * Apply the D-12 rules for a visiting group + resolution result. Tables:
 *
 * group     resolution               behaviour
 * any       unauthenticated          redirect /login
 * provider  unaffiliated             redirect /provider/onboarding/create-org (D-01)
 * patient   unaffiliated             redirect /login (patients join via invite, D-03)
 * admin     unaffiliated             redirect /provider/onboarding/create-org
 * provider  role = patient           redirect /patient
 * provider  staff role               render (admin_owner IS a provider-group role)
 * patient   staff role               redirect /provider
 * patient   role = patient           render
 * admin     role = admin_owner       render
 * admin     other roles              redirect own workspace (never reveals the audit surface)
 */
export function redirectForRole(group: WorkspaceGroup, result: WorkspaceResolution): void {
  if (result.kind === 'unauthenticated') {
    redirect(LOGIN_PATH);
    return;
  }

  if (result.kind === 'unaffiliated') {
    redirect(group === 'patient' ? LOGIN_PATH : CREATE_ORG_PATH);
    return;
  }

  if (group === 'admin') {
    if (result.role !== ADMIN_OWNER_ROLE) redirect(ownWorkspaceTarget(result.role));
    return;
  }

  if (group === 'patient') {
    if (result.role !== PATIENT_ROLE) redirect(PROVIDER_WORKSPACE_PATH);
    return;
  }

  // provider group: every staff role renders; the patient role's workspace
  // is the patient group.
  if (result.role === PATIENT_ROLE) redirect(PATIENT_WORKSPACE_PATH);
}
