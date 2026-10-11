// src/lib/auth/session.ts — server session reader (Managed Neon Auth).
//
// Single seam: every server action/layout resolves identity here, then scopes
// its data access through resolveWorkspaceRole + explicit org_id filters.
import { auth } from "@/lib/auth/server";

/** Verified session user or null. Never throws — callers fail closed. */
export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  try {
    const { data: session } = await auth.getSession();
    const user = session?.user;
    if (!user?.id || !user?.email) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}
