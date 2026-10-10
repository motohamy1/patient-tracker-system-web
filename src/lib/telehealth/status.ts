// src/lib/telehealth/status.ts — the telehealth session vocabularies
// (Phase 17; the byte-for-byte mirror of migration 0016's checks).
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const SESSION_STATUSES = [
  'scheduled',
  'in_progress',
  'completed',
  'cancelled',
] as const satisfies readonly SessionStatus[];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** The sanctioned status tint per session (INV-04 closed set). */
export const SESSION_STATUS_TOKEN: Record<SessionStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'neutral',
};

/** The transport vocabulary — honest by default (0016). */
export type TransportState = 'not_configured' | 'connected';

export const TRANSPORT_STATES = ['not_configured', 'connected'] as const satisfies readonly TransportState[];

export const TRANSPORT_LABELS: Record<TransportState, string> = {
  not_configured: 'Video not connected',
  connected: 'Video connected',
};

/** Plain-language transport explanation (§7 copy contract, §27 honesty). */
export const TRANSPORT_EXPLANATION: Record<TransportState, string> = {
  not_configured:
    'No video provider is connected to this workspace, so this consultation has no live video room yet. The appointment, the record and the visit documentation all work as usual.',
  connected: 'This workspace has a video provider connected.',
};

export const TELEHEALTH_VISIT_TYPE = 'telehealth';

/** The only statuses a patient may be sent to join. */
export function isJoinable(status: SessionStatus): boolean {
  return status === 'in_progress' || status === 'scheduled';
}

export type TelehealthSessionRecord = {
  id: string;
  orgId: string;
  patientId: string;
  visitId: string;
  status: SessionStatus;
  joinToken: string;
  transport: TransportState;
  transportReference: string | null;
  cancellationReason: string | null;
  startedAt: string | null;
  endedAt: string | null;
};

/** A consultation as the provider's day list reads it. */
export type ConsultationListItem = {
  sessionId: string;
  visitId: string;
  status: SessionStatus;
  joinToken: string;
  transport: TransportState;
  patientId: string;
  patientName: string;
  scheduledAt: string;
  visitType: string | null;
};
