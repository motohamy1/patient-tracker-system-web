// Overview — the patient's command surface (WSP-02, PRODUCT-MASTER-SPEC.md §7).
//
// The page owns only the chrome and the streaming boundary: the top bar
// paints on first paint, and `OverviewBody` (the async data component) runs
// inside its own `<Suspense>` boundary so a slow RLS read streams a
// token-derived skeleton instead of blocking the tab bar or rendering a blank
// panel (§24, UX-01). The fallback is created here, where `patientId` is in
// scope, but renders no patient data of any kind.
//
// The `[patientId]` route parameter is consumed only by `OverviewBody` (bound
// to a UUID-validated equality predicate) and to build the tab hrefs through
// `tabHref`. It is never rendered, never interpolated into a string, a
// filesystem path, a template, a log line or any interpreter (ASVS V5,
// T-02-52).
//
// `dynamic = 'force-dynamic'`: an authenticated workspace route is never
// statically cached or ISR-served — one principal's patient record must never
// be served to another (§12, 02-10's load-bearing precedent).
import { Suspense } from 'react';
import { Surface } from '@/components/primitives';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';
import { ContextStrip } from '@/components/workspace/ContextStrip';
import { OverviewBody } from '@/components/workspace/OverviewBody';
import { OverviewSkeleton } from '@/components/workspace/OverviewSkeleton';

export const dynamic = 'force-dynamic';

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;

  return (
    <>
      {/* The reference seats the identity card, the tab strip and the
          diagnosis/vitals strip in ONE header region; the context strip is
          passed in as the header's lower slot so the two columns stay aligned
          beside the identity card. */}
      <WorkspaceTopBar patientId={patientId} activeSlug="overview">
        <ContextStrip />
      </WorkspaceTopBar>
      <Surface variant="canvas" className="flex flex-1 bg-canvas px-xl pb-xl">
        <div className="mx-auto flex w-full max-w-[87rem] flex-col gap-xl">
          <Suspense fallback={<OverviewSkeleton />}>
            <OverviewBody patientId={patientId} />
          </Suspense>
        </div>
      </Surface>
    </>
  );
}
