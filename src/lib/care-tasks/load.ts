// src/lib/care-tasks/load.ts — the shared two-read load for both surfaces
// (Phase 14, ticket 14-03).
//
// Both the patient Home and the provider Overview read the SAME rows and
// derive the SAME adherence, so the two surfaces can never tell different
// stories about a task. The caller owns the degradation: a failed read is the
// region's quiet error state, never a blank page (§24).
import { adherenceFor } from '@/lib/care-tasks/adherence';
import { listCareTasks, listCareTaskCompletions } from '@/lib/care-tasks/queries';
import type { TaskAdherence } from '@/lib/care-tasks/adherence';
import type { CareTaskRecord, CareTaskCompletionRecord } from '@/lib/care-tasks/queries';

export type CareTaskState = {
  tasks: readonly CareTaskRecord[];
  completions: readonly CareTaskCompletionRecord[];
  adherence: readonly TaskAdherence[];
};

export async function loadCareTaskState(
  orgId: string,
  patientId: string,
  now: Date = new Date(),
): Promise<CareTaskState> {
  const [tasks, completions] = await Promise.all([
    listCareTasks(orgId, patientId),
    listCareTaskCompletions(orgId, patientId),
  ]);
  return { tasks, completions, adherence: adherenceFor(tasks, completions, now) };
}
