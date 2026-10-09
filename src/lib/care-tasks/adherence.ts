// src/lib/care-tasks/adherence.ts — adherence derived from the completion log
// (Phase 14, TASK-01; §14).
//
// PURE and scoreless by design: the only facts are a completion count, the
// most recent completion, whether the task was completed today, and whether a
// due date has passed without a completion since. There is no percentage, no
// streak, no level — a score would be the first step toward the gaming-heavy
// UI §27 forbids, and a count plus a date is the honest sentence.
import type { CareTaskRecord } from '@/lib/care-tasks/queries';
import type { CareTaskCompletionRecord } from '@/lib/care-tasks/queries';

export type TaskAdherence = {
  taskId: string;
  completionCount: number;
  lastCompletedAt: string | null;
  completedToday: boolean;
  /** A due date has passed with no completion after it. */
  due: boolean;
};

function isSameUtcDay(at: string, reference: Date): boolean {
  const day = new Date(at);
  return (
    day.getUTCFullYear() === reference.getUTCFullYear() &&
    day.getUTCMonth() === reference.getUTCMonth() &&
    day.getUTCDate() === reference.getUTCDate()
  );
}

/**
 * Derive each active task's adherence from the append-only log. `now` is
 * injected so the derivation is deterministic and unit-testable.
 */
export function adherenceFor(
  tasks: readonly CareTaskRecord[],
  completions: readonly CareTaskCompletionRecord[],
  now: Date,
): TaskAdherence[] {
  return tasks.map((task) => {
    const mine = completions.filter((completion) => completion.taskId === task.id);
    const last = mine.length > 0 ? (mine[0]?.completedAt ?? null) : null;
    const due =
      task.dueAt !== null &&
      Date.parse(task.dueAt) <= now.getTime() &&
      (last === null || Date.parse(last) < Date.parse(task.dueAt));
    return {
      taskId: task.id,
      completionCount: mine.length,
      lastCompletedAt: last,
      completedToday: last !== null && isSameUtcDay(last, now),
      due,
    };
  });
}

/** The one calm sentence both surfaces show (§7 sentence case). */
export function adherenceSentence(adherence: TaskAdherence): string {
  if (adherence.completionCount === 0) {
    return adherence.due ? 'Not logged yet — past its due date' : 'Not logged yet';
  }
  const last = (adherence.lastCompletedAt ?? '').slice(0, 10);
  return `Logged ${adherence.completionCount} ${adherence.completionCount === 1 ? 'time' : 'times'} · last on ${last}`;
}

/** Order for display: due first, then undated, then the rest (calm, stable). */
export function sortTasksForDisplay(
  tasks: readonly CareTaskRecord[],
  adherence: readonly TaskAdherence[],
): CareTaskRecord[] {
  const byId = new Map(adherence.map((entry) => [entry.taskId, entry]));
  return [...tasks].sort((a, b) => {
    const aDue = byId.get(a.id)?.due ?? false;
    const bDue = byId.get(b.id)?.due ?? false;
    if (aDue !== bDue) return aDue ? -1 : 1;
    const aDueAt = a.dueAt ?? '9999';
    const bDueAt = b.dueAt ?? '9999';
    return aDueAt.localeCompare(bDueAt) || a.id.localeCompare(b.id);
  });
}
