// src/app/(provider)/provider/members/remove-member-overlay.tsx — the member
// removal confirmation (03-UI-SPEC §8.3 + §Copywriting): the ONLY destructive
// action of this phase, wired to the security-definer remove_membership RPC
// and guarded in SQL, never a direct delete grant.
//
// Contract: heading "Remove {name}", consequence "They will lose access to
// this workspace immediately.", confirm button labeled "Remove" itself —
// never the generic confirm word — inside the Overlay primitive (modal
// ≥1024px / sheet below, full Phase-2 a11y contract). On success the list
// refreshes.
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { removeMemberAction } from '@/lib/auth/actions.membership';

export function RemoveMemberControl({
  memberId,
  displayName,
}: {
  memberId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await removeMemberAction(memberId);
    setPending(false);
    if (result.ok) {
      setOpen(false);
      router.refresh();
      return;
    }
    setError('Couldn\'t remove this member. Try again.');
  }

  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        Remove
      </Button>
      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title={`Remove ${displayName}`}
        description="They will lose access to this workspace immediately."
        footer={
          <Button variant="primary" onClick={handleRemove} disabled={pending}>
            Remove
          </Button>
        }
      >
        {error ? (
          <p className="flex items-center gap-xs text-label leading-label text-text-primary">
            <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
            {error}
          </p>
        ) : null}
      </Overlay>
    </>
  );
}
