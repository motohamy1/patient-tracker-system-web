// OverviewBody — the data-backed body of the Overview tab (WSP-02).
//
// Split from page.tsx so the page can stream: the top bar paints immediately
// and this async component suspends inside its own `<Suspense>` boundary, with
// `OverviewSkeleton` as the fallback (§24 — a token-derived skeleton, never a
// generic "Loading…" screen and never a blank panel).
//
// Authorization runs server-side first: `resolveWorkspaceRole('provider')`
// gives the org scope for the RLS-scoped `getPatient` call. The (provider)
// layout has already redirected a cross-role or unauthenticated visitor, so a
// non-signed-in resolution here renders nothing rather than guessing (a fake
// gate that looks real is worse than none — provider/page.tsx precedent).
//
// A member of another organization reads zero rows under migration 0005's
// RLS; a malformed route segment never reaches the query at all
// (`patientIdSchema`). Both land on the no-leak denial state — the copy never
// says whether the record exists (UX-02, AUTH-03).
//
// Server Component: no hook, no client directive.
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { ContextStatRow } from '@/components/workspace/ContextStatRow';
import { PatientIdentityCard } from '@/components/workspace/PatientIdentityCard';
import { ownWorkspaceTarget } from '@/lib/auth/redirect';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';
import { getPatient, type PatientRecord } from '@/lib/patients/queries';
import { patientIdSchema } from '@/lib/patients/schemas';
import { tabHref } from '@/app/(provider)/provider/patients/[patientId]/tabs';

export async function OverviewBody({ patientId }: { patientId: string }) {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  const parsedId = patientIdSchema.safeParse(patientId);

  let patient: PatientRecord | null = null;
  let failed = false;
  if (parsedId.success) {
    try {
      patient = await getPatient(resolution.orgId, parsedId.data);
    } catch {
      // §7: a data-backed surface never renders blank — the error state names
      // the surface and offers a wired retry (this route, re-requested).
      failed = true;
    }
  }

  if (failed) {
    return (
      <StateVariant
        surface="patient record"
        retryHref={tabHref(patientId, 'overview')}
      />
    );
  }

  if (patient === null) {
    return (
      <EmptyState
        icon={Lock}
        title="You don't have access to this patient record"
        body="Ask your organization owner for access to patient records."
        action={{
          label: 'Go to your workspace',
          href: ownWorkspaceTarget(resolution.role),
        }}
      />
    );
  }

  return (
    <section
      aria-label="Patient overview"
      className="grid grid-cols-1 gap-lg lg:grid-cols-[19rem_minmax(0,1fr)]"
    >
      <PatientIdentityCard patient={patient} />
      <ContextStatRow patient={patient} />
    </section>
  );
}
