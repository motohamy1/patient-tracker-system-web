// src/app/(provider)/provider/members/invite-creator.tsx — invite creation
// (03-UI-SPEC §8.3): one primary "Create invite link", the result panel as a
// surfaceMuted inset holding the copyable link + short code + optional expiry
// line, the SegmentedControl role strip with the five exact canonical role
// strings, and the 44px iconOnly copy control (aria-label "Copy invite link")
// whose dot pip swaps to success + aria-live polite announce on copy.
'use client';

import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { CompactControl } from '@/components/primitives/CompactControl';
import { Surface } from '@/components/primitives/Surface';
import { Copy } from 'lucide-react';
import { ROLES, type Role } from '@/lib/auth/roles';
import { createInviteAction } from '@/lib/auth/actions.membership';

export type InviteResult = {
  link: string;
  shortCode: string | null;
  expiresAt: string | null;
};

export function InviteCreatorPresentation({
  orgName,
  role,
  onRoleChange,
  pending,
  result,
  copied,
  onCreate,
  onCopy,
}: {
  orgName: string;
  role: Role;
  onRoleChange: (role: Role) => void;
  pending: boolean;
  result: InviteResult | null;
  copied: boolean;
  onCreate: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-md">
      <h2 className="text-heading font-semibold leading-heading text-text-primary">Invite</h2>
      <div className="flex flex-wrap items-center gap-xs" role="group" aria-label="Role">
        {ROLES.map((name) => (
          <CompactControl
            key={name}
            variant="rangeToggle"
            ariaLabel={`Role: ${name}`}
            label={name}
            active={role === name}
          />
        ))}
      </div>
      <Button variant="primary" onClick={onCreate} disabled={pending}>
        Create invite link
      </Button>

      {result ? (
        <Surface variant="surfaceMuted" className="flex flex-col gap-sm">
          <p className="text-label leading-label text-text-primary">
            {`Send this link to your team member or patient. They will join ${orgName} as ${role} immediately.`}
          </p>
          <div className="flex items-center gap-md">
            <p className="min-w-0 flex-1 truncate text-body leading-body text-text-primary" title={result.link}>
              {result.link}
            </p>
            <Button variant="iconOnly" ariaLabel="Copy invite link" icon={Copy} onClick={onCopy} />
          </div>
          {result.shortCode ? (
            <p className="text-label leading-label text-text-primary">{`Invite code: ${result.shortCode}`}</p>
          ) : null}
          {result.expiresAt ? (
            <p className="text-label leading-label text-text-primary">{`This link expires on ${result.expiresAt.slice(0, 10)}.`}</p>
          ) : null}
          <p aria-live="polite" className="flex items-center gap-xs text-label leading-label text-text-primary">
            <span
              aria-hidden="true"
              className={`inline-block size-4 shrink-0 rounded-pill ${copied ? 'bg-success' : 'bg-surface-raised'}`}
            />
            {copied ? 'Invite link copied' : ''}
          </p>
        </Surface>
      ) : null}
    </div>
  );
}

export function InviteCreator({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [role, setRole] = useState<Role>('patient');
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(): Promise<void> {
    setPending(true);
    setError(null);
    const outcome = await createInviteAction(orgId, role);
    setPending(false);
    if (outcome.ok && 'link' in outcome) {
      setResult({ link: outcome.link, shortCode: outcome.shortCode, expiresAt: outcome.expiresAt });
      setCopied(false);
      return;
    }
    setError('Couldn\'t create the invite link. Try again.');
  }

  async function handleCopy(): Promise<void> {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + result.link);
      setCopied(true);
    } catch {
      setError('Couldn\'t copy. Try again.');
    }
  }

  return (
    <div className="flex flex-col gap-md">
      {error ? (
        <p className="flex items-center gap-xs text-label leading-label text-text-primary">
          <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
          {error}
        </p>
      ) : null}
      <InviteCreatorPresentation
        orgName={orgName}
        role={role}
        onRoleChange={setRole}
        pending={pending}
        result={result}
        copied={copied}
        onCreate={handleCreate}
        onCopy={handleCopy}
      />
    </div>
  );
}
