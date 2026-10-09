// CareTasksRegion — the shared care-task region for both surfaces (Phase 13/14
// boundary; TASK-01/02, ticket 14-03).
//
// One presentational region, two homes: the patient's Home shows their tasks
// with a "Mark done" control; the provider's patient Overview shows the same
// tasks with their completion counts and the assign/archive controls. The
// adherence line is deliberately quiet — a count and a date, never a score, a
// streak or a celebration (§14, §27).
//
// Server Component: the controls it embeds are the only client boundary.
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import {
  ArchiveTaskControl,
  AssignCareTaskControl,
  CompleteTaskControl,
} from '@/components/care-tasks/CareTaskControls';
import { adherenceSentence, type TaskAdherence } from '@/lib/care-tasks/adherence';
import { CARE_TASK_KIND_LABELS, type CareTaskStatus } from '@/lib/care-tasks/status';
import type { CareTaskRecord } from '@/lib/care-tasks/queries';
import { INSET_FILL } from '@/components/primitives/CompactControl';

function quiet(body: string) {
  return <p className="text-body leading-body text-text-secondary">{body}</p>;
}

export function CareTasksRegion({
  tasks,
  adherence,
  variant,
  patientId,
  status = 'active',
}: {
  tasks: readonly CareTaskRecord[];
  adherence: readonly TaskAdherence[];
  variant: 'patient' | 'provider';
  patientId?: string;
  status?: CareTaskStatus;
}) {
  const byId = new Map(adherence.map((entry) => [entry.taskId, entry]));

  return (
    <Surface variant="surface" className="flex flex-col gap-md">
      <div className="flex flex-wrap items-center justify-between gap-md">
        <h2 className="text-label leading-label font-semibold text-text-primary">Care tasks</h2>
        {variant === 'provider' && patientId !== undefined ? (
          <AssignCareTaskControl patientId={patientId} insetFill={INSET_FILL} />
        ) : null}
      </div>

      {tasks.length === 0 ? (
        quiet(
          variant === 'provider'
            ? 'No care tasks yet. Assign a small task such as a weekly weight.'
            : 'No care tasks yet. Your care team can add small tasks here.',
        )
      ) : (
        <ul className="flex flex-col gap-sm">
          {tasks.map((task) => {
            const entry = byId.get(task.id);
            const sentence = entry !== undefined ? adherenceSentence(entry) : 'Not logged yet';
            return (
              <li
                key={task.id}
                className="flex flex-wrap items-baseline justify-between gap-md border-0"
              >
                <span className="flex min-w-0 flex-col gap-xs">
                  <span className="flex flex-wrap items-center gap-sm">
                    <span className="text-body leading-body text-text-primary">{task.title}</span>
                    <span className="text-label leading-label text-text-secondary">
                      {CARE_TASK_KIND_LABELS[task.kind]}
                    </span>
                    {entry?.due === true ? <Pill tone="warning" label="Past due" /> : null}
                    {entry?.completedToday === true ? <Pill tone="success" label="Done today" /> : null}
                  </span>
                  <span className="text-label leading-label text-text-secondary tabular-nums">
                    {sentence}
                  </span>
                </span>
                {variant === 'patient' ? (
                  <CompleteTaskControl taskId={task.id} />
                ) : (
                  <span className="flex items-center gap-sm">
                    {task.dueAt !== null ? (
                      <span className="text-label leading-label text-text-secondary tabular-nums">
                        Due {task.dueAt.slice(0, 10)}
                      </span>
                    ) : null}
                    {status === 'active' ? <ArchiveTaskControl taskId={task.id} /> : null}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Surface>
  );
}
