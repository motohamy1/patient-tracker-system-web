'use client';

// Care-task controls — assign (provider), mark done (patient), archive
// (provider) (Phase 14, ticket 14-03; TASK-01/02).
//
// The buttons carry the verb (§7): "Assign a task", "Mark done". Nothing here
// decides anything: each action re-checks its capability server-side and the
// database re-derives the actor (the patient's completion is self-scoped by
// migration 0013's guard).
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import {
  archiveCareTaskAction,
  assignCareTaskAction,
  completeCareTaskAction,
} from '@/lib/care-tasks/actions';
import { CARE_TASK_KINDS, CARE_TASK_KIND_LABELS } from '@/lib/care-tasks/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

export function AssignCareTaskControl({
  patientId,
  insetFill,
}: {
  patientId: string;
  insetFill: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [kind, setKind] = useState<string>('measurement');
  const [dueAt, setDueAt] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await assignCareTaskAction({
      patientId,
      title,
      detail,
      kind,
      dueAt: dueAt === '' ? undefined : new Date(dueAt).toISOString(),
    });
    setPending(false);
    if (!result.ok) {
      setError("That task couldn't be assigned. Try again.");
      return;
    }
    setOpen(false);
    setTitle('');
    setDetail('');
    setDueAt('');
    router.refresh();
  }

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Assign a task
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Assign a care task"
        description="A small, concrete task for this patient — a measurement to take, a medication to remember, or a follow-up to keep."
      >
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Task
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={160}
              className={`${insetFill} ${FIELD}`}
              required
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Kind
            <select value={kind} onChange={(event) => setKind(event.target.value)} className={`${insetFill} ${FIELD}`}>
              {CARE_TASK_KINDS.map((option) => (
                <option key={option} value={option}>
                  {CARE_TASK_KIND_LABELS[option]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Details (optional)
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              rows={2}
              maxLength={400}
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Due (optional)
            <input
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
              className={`${insetFill} ${FIELD}`}
            />
          </label>
          {error ? (
            <p role="alert" className="text-label leading-label text-text-primary">
              {error}
            </p>
          ) : null}
          <div className="flex items-center justify-end gap-sm">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending} ariaBusy={pending}>
              Assign task
            </Button>
          </div>
        </form>
      </Overlay>
    </>
  );
}

export function CompleteTaskControl({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex items-center gap-sm">
      {failed ? (
        <span role="alert" className="text-label leading-label text-text-primary">
          That didn&apos;t save. Try again.
        </span>
      ) : null}
      <Button
        variant="secondary"
        disabled={pending}
        ariaBusy={pending}
        onClick={async () => {
          setPending(true);
          setFailed(false);
          const result = await completeCareTaskAction({ taskId });
          setPending(false);
          if (!result.ok) {
            setFailed(true);
            return;
          }
          router.refresh();
        }}
      >
        Mark done
      </Button>
    </span>
  );
}

export function ArchiveTaskControl({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      variant="ghost"
      disabled={pending}
      ariaBusy={pending}
      onClick={async () => {
        setPending(true);
        const result = await archiveCareTaskAction({ taskId });
        setPending(false);
        if (result.ok) router.refresh();
      }}
    >
      Archive
    </Button>
  );
}
