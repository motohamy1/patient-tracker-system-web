'use client';

// ChannelEndpointsControl — the patient's reachable channels (Phase 16,
// ticket 16-03; CHAN-03).
//
// Staff-managed contact data: the adapter never guesses a destination, so the
// care team records it here. The control is the honest surface for the honest
// delivery log: an endpoint with no credentials behind it shows up as
// "Channel not connected" on the message, never as a delivery.
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/primitives/Button';
import { Overlay } from '@/components/overlays/Overlay';
import { Pill } from '@/components/primitives/Pill';
import { Surface } from '@/components/primitives';
import { saveChannelEndpointAction, setChannelEndpointStatusAction } from '@/lib/channels/actions';
import {
  CHANNEL_LABELS,
  ENDPOINT_STATUS_LABELS,
  type ChannelEndpointRecord,
  type EndpointStatus,
} from '@/lib/channels/status';

const FIELD = 'w-full rounded-md px-lg text-body leading-body text-text-primary min-h-11 md:min-h-8';

function statusTone(status: EndpointStatus): 'success' | 'neutral' {
  return status === 'active' ? 'success' : 'neutral';
}

export function ChannelEndpointsControl({
  patientId,
  endpoints,
  insetFill,
  canManage = true,
}: {
  patientId: string;
  endpoints: readonly ChannelEndpointRecord[];
  insetFill: string;
  /** Roles that can write endpoints (doctor + nurse, mirroring 0015). */
  canManage?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState<'whatsapp' | 'telegram'>('whatsapp');
  const [handle, setHandle] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending('save');
    setError(null);
    const result = await saveChannelEndpointAction({ patientId, channel, handle });
    setPending(null);
    if (!result.ok) {
      setError("That channel couldn't be saved. Check the details and try again.");
      return;
    }
    setOpen(false);
    setHandle('');
  }

  return (
    <Surface variant="surface" className="flex flex-col gap-sm">
      <div className="flex flex-wrap items-center justify-between gap-sm">
        <h2 className="text-label leading-label font-semibold text-text-primary">Channels</h2>
        {canManage ? (
          <Button variant="secondary" onClick={() => setOpen(true)}>
            Add a channel
          </Button>
        ) : null}
      </div>

      <p className="text-label leading-label text-text-secondary">
        How this patient receives notifications. The message always lives in the thread; these channels only
        carry it.
      </p>

      {endpoints.length === 0 ? (
        <p className="text-body leading-body text-text-secondary">
          {canManage
            ? 'No channels connected for this patient yet.'
            : 'No channels connected for this patient.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-sm">
          {endpoints.map((endpoint) => (
            <li key={endpoint.id} className="flex flex-wrap items-center justify-between gap-sm">
              <span className="flex min-w-0 flex-col gap-xs">
                <span className="text-body leading-body text-text-primary">
                  {CHANNEL_LABELS[endpoint.channel]} · {endpoint.handle}
                </span>
                <span className="text-label leading-label text-text-secondary tabular-nums">
                  {ENDPOINT_STATUS_LABELS[endpoint.status]}
                </span>
              </span>
              <span className="flex items-center gap-sm">
                <Pill tone={statusTone(endpoint.status)} label={ENDPOINT_STATUS_LABELS[endpoint.status]} />
                {canManage ? (
                  <Button
                    variant="ghost"
                    disabled={pending === endpoint.id}
                    ariaBusy={pending === endpoint.id}
                    onClick={async () => {
                      setPending(endpoint.id);
                      setError(null);
                      const result = await setChannelEndpointStatusAction({
                        endpointId: endpoint.id,
                        status: endpoint.status === 'active' ? 'inactive' : 'active',
                      });
                      setPending(null);
                      if (!result.ok) setError("That channel couldn't be updated. Try again.");
                    }}
                  >
                    {endpoint.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p role="alert" className="text-label leading-label text-text-primary">
          {error}
        </p>
      ) : null}

      <Overlay
        open={open}
        onClose={() => setOpen(false)}
        title="Add a channel"
        description="Record the WhatsApp number or Telegram chat id this patient receives notifications on."
      >
        <form onSubmit={submit} className="flex flex-col gap-md">
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Channel
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value as 'whatsapp' | 'telegram')}
              className={`${insetFill} ${FIELD}`}
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="telegram">Telegram</option>
            </select>
          </label>
          <label className="flex flex-col gap-xs text-label leading-label text-text-primary">
            Phone number or chat id
            <input
              type="text"
              value={handle}
              onChange={(event) => setHandle(event.target.value)}
              maxLength={64}
              className={`${insetFill} ${FIELD}`}
              required
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
            <Button type="submit" variant="primary" disabled={pending === 'save'} ariaBusy={pending === 'save'}>
              Save channel
            </Button>
          </div>
        </form>
      </Overlay>
    </Surface>
  );
}
