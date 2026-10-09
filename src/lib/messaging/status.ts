// src/lib/messaging/status.ts — the unified conversation vocabularies
// (Phase 15; 0014 mirror).
//
// The closed vocabularies mirror migration 0014's check constraints. The
// `channel` value is the Phase-16 seam: an adapter writes the SAME rows with
// `whatsapp` or `telegram` and no UI change (COMM-01, OCR-04's sibling
// architectural rule).
export type ConversationStatus = 'open' | 'closed';

export const CONVERSATION_STATUSES = ['open', 'closed'] as const satisfies readonly ConversationStatus[];

export const CONVERSATION_STATUS_LABELS: Record<ConversationStatus, string> = {
  open: 'Open',
  closed: 'Closed',
};

export type SenderKind = 'staff' | 'patient' | 'system';

export type MessageChannel = 'in_app' | 'whatsapp' | 'telegram';

export const MESSAGE_CHANNELS = ['in_app', 'whatsapp', 'telegram'] as const satisfies readonly MessageChannel[];

export const MESSAGE_CHANNEL_LABELS: Record<MessageChannel, string> = {
  in_app: 'In app',
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
};

export const SENDER_KIND_LABELS: Record<SenderKind, string> = {
  staff: 'Care team',
  patient: 'Patient',
  system: 'System',
};

/** The cap on a message body (0014's app-side discipline). */
export const MESSAGE_BODY_MAX = 2000;

export type ConversationRecord = {
  id: string;
  orgId: string;
  patientId: string;
  patientName: string;
  status: ConversationStatus;
  updatedAt: string;
};

export type ConversationMessageRecord = {
  id: string;
  conversationId: string;
  senderKind: SenderKind;
  senderUserId: string | null;
  channel: MessageChannel;
  body: string;
  createdAt: string;
};

/** A thread row for the list: the conversation plus its derived summary. */
export type ConversationSummary = {
  conversation: ConversationRecord;
  lastMessage: ConversationMessageRecord | null;
  unreadForStaff: number;
};
