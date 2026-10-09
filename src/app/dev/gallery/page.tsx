// src/app/dev/gallery/page.tsx — the dev-only primitives gallery route (D-16, D-26).
//
// THE GATE CALL IS IN THE RENDER PATH, NEVER AT MODULE SCOPE. Next's
// `notFound` helper throws in order to render the 404 page; a throw outside the
// render path is not caught by Next, so the gate would appear to work while
// doing nothing (02-RESEARCH.md Pattern 4, T-02-70). The call therefore sits
// inside the component body, after the component declaration, and the file's
// shape is asserted by plan 02-10's acceptance criteria.
//
// `notFound` also makes Next emit a `<meta name="robots" content="noindex">`
// tag for this route, which is the correct behaviour for a surface that must
// never be indexed by a crawler even when the harness flag is set.
//
// This page is the SINGLE file outside `src/lib/dev/` permitted to import the
// dev fixtures and the dev mock data (D-18). Every value is passed down as a
// prop to a child; the fixture/mock modules never enter a product route and
// never ship as a client module (they ride the request-time render payload).
//
// TWO SURFACES, ONE GATE. The default render (no query parameter) is the
// primitives gallery, unchanged — so its committed visual baseline is
// preserved. When `?preview=doctor` is present the page renders the dev-only
// doctor-dashboard preview populated with MOCK patients
// (`src/lib/dev/mock-clinical.ts`). Both sit behind the same D-26 gate and are
// therefore absent from every real deployment.
import { notFound } from 'next/navigation';
import { Gallery } from '@/components/dev/Gallery';
import { MockDoctorDashboard } from '@/components/dev/MockDoctorDashboard';
import { TimelinePreview } from '@/components/dev/TimelinePreview';
import { isDevRouteAllowed } from '@/lib/dev/dev-route-gate';
import { MOCK_PATIENTS } from '@/lib/dev/mock-clinical';
import { DEV_TIMELINE_EVENTS } from '@/lib/dev/timeline-fixture';
import { EMPTY_PATIENT_LIST } from '@/lib/dev/fixtures';

// The gate MUST be evaluated per request, so the route is forced dynamic. A
// statically prerendered route bakes the gate's build-time result into the
// served HTML: a build without the flag would serve a frozen 404 (the visual
// harness could never reach the gallery), and a build WITH the flag would ship
// the gallery inside the deployment artifacts, defeating D-26's claim that the
// route is absent from every real deployment. Runtime evaluation is what makes
// the D-26 flag a real switch and keeps the dev route out of production
// (ASVS V14).
export const dynamic = 'force-dynamic';

export default async function DevGalleryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!isDevRouteAllowed()) notFound();

  const params = await searchParams;
  const preview = typeof params.preview === 'string' ? params.preview : undefined;

  if (preview === 'doctor') {
    return <MockDoctorDashboard patients={MOCK_PATIENTS} />;
  }

  if (preview === 'timeline') {
    return <TimelinePreview events={DEV_TIMELINE_EVENTS} />;
  }

  return <Gallery emptyCount={EMPTY_PATIENT_LIST.length} />;
}
