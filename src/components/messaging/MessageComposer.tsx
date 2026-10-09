'use client';

// MessageComposer — the one composer for both sides of the conversation
// (Phase 15, ticket 15-03; COMM-01).
//
// Honest about persistence: the message appears because the server action
// confirmed it, never as an optimistic phantom (§18's discipline). A failed
// send keeps the text and says so.
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { sendMessageAction } from '@/lib/messaging/actions';

const FIELD = 'w-full rounded-md px-lg py-sm text-body leading-body text-text-primary min-h-11';

export function MessageComposer({
  conversationId,
  insetFill,
  placeholder = 'Write a message…',
}: {
  conversationId: string;
  insetFill: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (body.trim() === '') return;
    setPending(true);
    setError(null);
    const result = await sendMessageAction({ conversationId, body });
    setPending(false);
    if (!result.ok) {
      setError("That message didn't send. Try again.");
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-sm">
      <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
        <span className="sr-only">Message</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          maxLength={2000}
          placeholder={placeholder}
          className={`${insetFill} ${FIELD}`}
        />
      </label>
      {error ? (
        <p role="alert" className="text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}
      <div className="flex items-center justify-end">
        <Button type="submit" variant="primary" disabled={pending || body.trim() === ''} ariaBusy={pending}>
          Send message
        </Button>
      </div>
    </form>
  );
}
