// The IMMERSIVE patient-workspace frame (D-01, D-02; §4.1, §5.1).
//
// This layout hosts ONLY the workspace frame: it never renders the provider rail
// or the provider top bar — those belong to the `(shell)` group and do not wrap
// this subtree. The result is a full-bleed clinical workspace that owns the
// viewport.
//
// COLOUR (redesign 2026-10-12, reference: the patient-detail artboard "Patient
// Overview — merged reference"): the workspace paints ONE continuous cream
// field — `canvas` — from edge to edge, with the reference's 24px padding. The
// earlier olive frame is GONE: that reference seated a dark band around a light
// panel, and the patient-detail reference replaced it with a single flat cream
// ground the identity card, the timeline band and the bottom cards all sit
// directly on. There is therefore no second surface and no rounding here —
// nothing insets, so nothing needs a silhouette.
//
// Server-side authorization is unchanged: the parent `(provider)` layout already
// ran `resolveWorkspaceRole` + `redirectForRole` before this frame renders, so
// removing the provider chrome never weakened the patient-data boundary (§3.1,
// §12). Every query behind this frame still carries its explicit `org_id`
// predicate.
import type { ReactNode } from 'react';

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return (
    <div className="workspace-field flex min-h-screen flex-col bg-canvas">{children}</div>
  );
}
