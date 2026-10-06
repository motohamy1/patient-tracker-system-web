// Labs — the workspace tab shell (D-01, D-04).
//
// The real Labs body is owned by Phase 009.
//
// The `[patientId]` route parameter is used ONLY to build the tab hrefs through
// `tabHref`; it is never rendered, and never passed to a query, a filesystem
// path, a template, a log line or any interpreter (ASVS V5, T-02-52).
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { WorkspaceTopBar } from '@/components/shell/WorkspaceTopBar';

export default async function LabsPage({ params }: { params: Promise<{ patientId: string }> }) {
  const { patientId } = await params;
  return (
    <>
      <WorkspaceTopBar patientId={patientId} activeSlug="labs" />
      <Surface variant="canvas" className="flex flex-1 items-center justify-center bg-canvas p-lg">
        <EmptyState
          title="No record yet"
          body="This patient's record fills in as visits, medications and results are documented."
        />
      </Surface>
    </>
  );
}
