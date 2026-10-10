// /provider/consultations — the provider's telehealth day list (Phase 17,
// ticket 17-03; TH-01).
//
// A PROFILE-LEVEL surface (its own route, like /provider/messages) — never a
// ninth tab on the locked 8-tab workspace navigation (§6). The URL carries no
// state: the day list is derived from the session's org scope per request,
// and each row links into that appointment's consultation surface.
import Link from 'next/link';
import { Surface } from '@/components/primitives';
import { EmptyState } from '@/components/primitives/EmptyState';
import { StateVariant } from '@/components/state/StateVariant';
import { Pill } from '@/components/primitives/Pill';
import { listConsultations } from '@/lib/telehealth/queries';
import { SESSION_STATUS_LABELS, SESSION_STATUS_TOKEN } from '@/lib/telehealth/status';
import { resolveWorkspaceRole } from '@/lib/auth/workspace';

export const dynamic = 'force-dynamic';

function formatTime(iso: string): string {
  return iso.slice(11, 16);
}

export default async function ProviderConsultationsPage() {
  const resolution = await resolveWorkspaceRole('provider');
  if (resolution.kind !== 'signed-in') return null;

  // The consultation day is the server's UTC day; the query re-scopes to the
  // org under RLS either way.
  const day = new Date().toISOString().slice(0, 10);

  let items: Awaited<ReturnType<typeof listConsultations>> = [];
  let failed = false;
  try {
    items = await listConsultations(resolution.orgId, day);
  } catch {
    failed = true;
  }

  const today = new Date(`${day}T00:00:00.000Z`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Surface variant="canvas" className="flex flex-1 bg-canvas p-lg">
      <div className="mx-auto flex w-full max-w-[72rem] flex-col gap-lg">
        <div className="flex flex-col gap-xs">
          <h1 className="text-heading font-semibold leading-heading text-text-primary">Consultations</h1>
          <p className="text-label leading-label text-text-secondary">Today&apos;s telehealth appointments · {today}</p>
        </div>

        {failed ? (
          <StateVariant surface="consultations" retryHref="/provider/consultations" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No telehealth appointments today"
            body="Telehealth appointments appear here on the day, with their consultation state."
          />
        ) : (
          <ul className="flex flex-col gap-md">
            {items.map((item) => (
              <li key={item.visitId}>
                <Surface variant="surface" className="flex flex-wrap items-center justify-between gap-md">
                  <span className="flex min-w-0 flex-col gap-xs">
                    <span className="text-body leading-body text-text-primary">{item.patientName}</span>
                    <span className="text-label leading-label text-text-secondary tabular-nums">
                      {formatTime(item.scheduledAt)}
                    </span>
                  </span>
                  <span className="flex items-center gap-sm">
                    <Pill tone={SESSION_STATUS_TOKEN[item.status]} label={SESSION_STATUS_LABELS[item.status]} />
                    <Link
                      href={`/provider/consultations/${item.visitId}`}
                      className="text-label leading-label text-text-primary hover:text-text-secondary"
                    >
                      {item.status === 'in_progress' ? 'Continue consultation' : 'Open consultation'}
                    </Link>
                  </span>
                </Surface>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Surface>
  );
}
