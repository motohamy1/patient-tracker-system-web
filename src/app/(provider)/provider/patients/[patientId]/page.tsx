// /provider/patients/[patientId] — redirect to the first workspace tab (D-01).
//
// A routing convenience only: the bare workspace URL lands on `DEFAULT_TAB_SLUG`
// so it is never a dead end and the tab bar always has a defined active item on
// first paint. This redirect carries NO authorization meaning — the route is
// open by decision D-03 until Phase 003's server-side role resolution lands.
//
// The `[patientId]` parameter is consumed only through `tabHref`; it is never
// rendered and never passed to a query, a path, a template, a log or any
// interpreter (ASVS V5, T-02-52).
import { redirect } from 'next/navigation';
import { DEFAULT_TAB_SLUG, tabHref } from './tabs';

export default async function WorkspaceIndexPage({
  params,
}: {
  params: Promise<{ patientId: string }>;
}) {
  const { patientId } = await params;
  redirect(tabHref(patientId, DEFAULT_TAB_SLUG));
}
