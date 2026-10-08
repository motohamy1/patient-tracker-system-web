'use client';

// src/components/patients/QuickActionsOverlay.tsx — the folder-card quick
// actions (PROV-04; D-04/D-13/D-15; 04-UI-SPEC §4.6).
//
// Client island: overlay open state plus the two mutation calls. The trigger
// is the card's three-dot `iconOnly` Button (ariaLabel "Actions for {name}"),
// hosted per card exactly like `remove-member-overlay` lives per row on the
// members list; the surface itself is the Phase-2 `Overlay` primitive (modal
// at ≥1024px / sheet below, full focus-trap + scroll-lock contract) — no
// popover primitive is introduced (02-CONTEXT D-22).
//
// Rows, in order (§4.6):
//   1. Change status — the five D-09 statuses as pill choices with their D-10
//      tone dots; the current one carries `aria-current` plus the raised pill
//      treatment. Selecting one calls `changePatientStatusAction` and closes
//      (D-13/D-22: the grid refreshes, it never navigates away).
//   2. Send invite — rendered ONLY when the patient is unlinked AND the
//      resolved role holds CAN_MANAGE_MEMBERSHIP. The UI hides, never
//      disables: no dead control ships, and the action re-checks the
//      capability server-side anyway. On success the overlay swaps to the
//      invite-confirm state — link + short code + copy control, the
//      03-UI-SPEC §8.3 grammar — with the invite linked to THIS patient (D-04).
//   3. Schedule appointment — disabled with `aria-disabled="true"` and the
//      honest trailing note. It never opens anything and is never a dead
//      ENABLED control (04-CONTEXT discretion, D-15).
//
// Copy is exactly the 04-UI-SPEC §Copywriting table: sentence case, no
// exclamation marks, no specialty vocabulary, no gamified words (INV-06).
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, MoreVertical } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { Pill } from '@/components/primitives/Pill';
import { makeIcon } from '@/components/primitives/Icon';
import { Overlay } from '@/components/overlays/Overlay';
import { changePatientStatusAction, sendPatientInviteAction } from '@/lib/patients/actions';
import {
  PATIENT_STATUS_LABELS,
  PATIENT_STATUSES,
  PATIENT_STATUS_TOKEN,
  type PatientStatus,
} from '@/lib/patients/status';

const KebabGlyph = makeIcon(MoreVertical);
const CopyGlyph = makeIcon(Copy);

const STATUS_ERROR = "Couldn't change the status. Try again.";
const INVITE_ERROR = "Couldn't create the invite link. Try again.";

const ROW_CLASSES =
  'flex w-full min-h-11 items-center justify-between gap-md rounded-md px-md text-body font-semibold leading-body text-text-primary';

export type InviteResult = { link: string; shortCode?: string };

/** The 03-UI-SPEC §8.3 invite display: link + short code + copy control. */
export function InviteConfirm({
  firstName,
  invite,
  copied,
  onCopy,
}: {
  firstName: string;
  invite: InviteResult;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-col gap-md">
      <h3 className="text-heading font-semibold leading-heading text-text-primary">
        {`Invite ready for ${firstName}`}
      </h3>
      <p className="text-body leading-body text-text-primary">
        Share this link with the patient. Their account connects to this record when they sign up.
      </p>
      <div className="flex flex-col gap-sm rounded-md bg-surface-muted px-lg py-md">
        <div className="flex items-center gap-md">
          <p
            className="min-w-0 flex-1 truncate text-body leading-body text-text-primary"
            title={invite.link}
          >
            {invite.link}
          </p>
          <Button variant="iconOnly" ariaLabel="Copy invite link" onClick={onCopy}>
            <CopyGlyph size="lg" />
          </Button>
        </div>
        {invite.shortCode ? (
          <p className="text-label leading-label text-text-primary tabular-nums">
            {`Invite code: ${invite.shortCode}`}
          </p>
        ) : null}
        <p
          aria-live="polite"
          className="flex items-center gap-xs text-label leading-label text-text-primary"
        >
          <span
            aria-hidden="true"
            className={`inline-block size-4 shrink-0 rounded-pill ${copied ? 'bg-success' : 'bg-surface-raised'}`}
          />
          {copied ? 'Invite link copied' : ''}
        </p>
      </div>
    </div>
  );
}

export type QuickActionsPresentationProps = {
  firstName: string;
  status: PatientStatus;
  unlinked: boolean;
  canInvite: boolean;
  invite: InviteResult | null;
  copied: boolean;
  pending: boolean;
  error: string | null;
  onStatus: (status: PatientStatus) => void;
  onInvite: () => void;
  onCopy: () => void;
};

/** The pure §4.6 anatomy — every state is prop-driven so tests render it statically. */
export function QuickActionsPresentation({
  firstName,
  status,
  unlinked,
  canInvite,
  invite,
  copied,
  pending,
  error,
  onStatus,
  onInvite,
  onCopy,
}: QuickActionsPresentationProps) {
  if (invite) {
    return <InviteConfirm firstName={firstName} invite={invite} copied={copied} onCopy={onCopy} />;
  }

  return (
    <div className="flex flex-col gap-md">
      {error ? (
        <p className="flex items-center gap-xs text-label leading-label text-text-primary">
          <span aria-hidden="true" className="inline-block size-4 shrink-0 rounded-pill bg-critical" />
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-sm">
        <h3 className="text-label font-semibold leading-label text-text-primary">Change status</h3>
        <div role="group" aria-label="Change status" className="flex flex-wrap items-center gap-xs">
          {PATIENT_STATUSES.map((value) => {
            const isActive = value === status;
            return (
              <button
                key={value}
                type="button"
                aria-current={isActive ? 'true' : undefined}
                disabled={pending}
                onClick={() => onStatus(value)}
                className={[
                  'inline-flex min-h-11 items-center rounded-pill px-xs',
                  isActive ? 'bg-surface-raised shadow-raised' : 'bg-transparent',
                ].join(' ')}
              >
                <Pill tone={PATIENT_STATUS_TOKEN[value]} label={PATIENT_STATUS_LABELS[value]} />
              </button>
            );
          })}
        </div>
      </div>

      {unlinked && canInvite ? (
        <button
          type="button"
          disabled={pending}
          onClick={onInvite}
          className={`${ROW_CLASSES} hover:bg-surface-raised`}
        >
          <span>Send invite</span>
        </button>
      ) : null}

      {/* D-15: an honest disabled affordance with its note — never a dead enabled control. */}
      <button
        type="button"
        disabled
        aria-disabled="true"
        className={`${ROW_CLASSES} cursor-not-allowed opacity-60`}
      >
        <span>Schedule appointment</span>
        <span className="text-label font-regular leading-label text-text-secondary">
          Available with scheduling
        </span>
      </button>
    </div>
  );
}

export type QuickActionsBodyProps = {
  patientId: string;
  firstName: string;
  status: PatientStatus;
  unlinked: boolean;
  canInvite: boolean;
  /** Closes the overlay and `router.refresh()`es — the parent owns both. */
  onDone: () => void;
};

export function QuickActionsBody({
  patientId,
  firstName,
  status,
  unlinked,
  canInvite,
  onDone,
}: QuickActionsBodyProps) {
  const [pending, setPending] = useState(false);
  const [invite, setInvite] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatus(next: PatientStatus): Promise<void> {
    setPending(true);
    setError(null);
    const result = await changePatientStatusAction(patientId, next);
    setPending(false);
    if (result.ok) {
      onDone();
      return;
    }
    setError(STATUS_ERROR);
  }

  async function handleInvite(): Promise<void> {
    setPending(true);
    setError(null);
    const result = await sendPatientInviteAction(patientId);
    setPending(false);
    if (result.ok) {
      setInvite({ link: result.link ?? '', shortCode: result.shortCode });
      setCopied(false);
      return;
    }
    setError(INVITE_ERROR);
  }

  async function handleCopy(): Promise<void> {
    if (!invite) return;
    try {
      await navigator.clipboard.writeText(window.location.origin + invite.link);
      setCopied(true);
    } catch {
      setError("Couldn't copy. Try again.");
    }
  }

  if (invite) {
    return (
      <InviteConfirm firstName={firstName} invite={invite} copied={copied} onCopy={handleCopy} />
    );
  }

  return (
    <QuickActionsPresentation
      firstName={firstName}
      status={status}
      unlinked={unlinked}
      canInvite={canInvite}
      invite={null}
      copied={copied}
      pending={pending}
      error={error}
      onStatus={handleStatus}
      onInvite={handleInvite}
      onCopy={handleCopy}
    />
  );
}

export type QuickActionsOverlayProps = {
  patientId: string;
  firstName: string;
  status: PatientStatus;
  unlinked: boolean;
  canInvite: boolean;
};

export function QuickActionsOverlay({
  patientId,
  firstName,
  status,
  unlinked,
  canInvite,
}: QuickActionsOverlayProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="iconOnly"
        ariaLabel={`Actions for ${firstName}`}
        onClick={() => setOpen(true)}
      >
        <KebabGlyph size="lg" />
      </Button>
      <Overlay open={open} onClose={() => setOpen(false)} title={firstName}>
        <QuickActionsBody
          patientId={patientId}
          firstName={firstName}
          status={status}
          unlinked={unlinked}
          canInvite={canInvite}
          onDone={() => {
            setOpen(false);
            router.refresh();
          }}
        />
      </Overlay>
    </>
  );
}
