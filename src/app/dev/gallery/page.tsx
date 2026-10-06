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
// dev fixtures (D-18). It reads the empty patient list only to hand a neutral
// count to the gallery's empty-state section; it never renders a fixture record
// as visible content, and it passes the count down as a plain number.
import { notFound } from 'next/navigation';
import { Gallery } from '@/components/dev/Gallery';
import { isDevRouteAllowed } from '@/lib/dev/dev-route-gate';
import { EMPTY_PATIENT_LIST } from '@/lib/dev/fixtures';

export default function DevGalleryPage() {
  if (!isDevRouteAllowed()) notFound();

  return <Gallery emptyCount={EMPTY_PATIENT_LIST.length} />;
}
