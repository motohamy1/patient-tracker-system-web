// src/lib/channels/status.ts — channel vocabularies (Phase 16; 0015 mirror).
export type ChannelName = 'whatsapp' | 'telegram';

export const CHANNEL_NAMES = ['whatsapp', 'telegram'] as const satisfies readonly ChannelName[];

export const CHANNEL_LABELS: Record<ChannelName, string> = {
  whatsapp: 'WhatsApp',
  telegram: 'Telegram',
};

export type EndpointStatus = 'active' | 'inactive';

export const ENDPOINT_STATUSES = ['active', 'inactive'] as const satisfies readonly EndpointStatus[];

export const ENDPOINT_STATUS_LABELS: Record<EndpointStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
};

/** The delivery states, including the honest unconfigured one. */
export type DeliveryStatus = 'delivered' | 'not_configured' | 'failed';

export const DELIVERY_STATUSES = [
  'delivered',
  'not_configured',
  'failed',
] as const satisfies readonly DeliveryStatus[];

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  delivered: 'Delivered',
  not_configured: 'Channel not connected',
  failed: 'Delivery failed',
};

/** Closed tint family for the delivery pill (D-04). */
export const DELIVERY_STATUS_TOKEN: Record<DeliveryStatus, 'success' | 'warning' | 'critical'> = {
  delivered: 'success',
  not_configured: 'warning',
  failed: 'critical',
};

export type ChannelEndpointRecord = {
  id: string;
  patientId: string;
  channel: ChannelName;
  handle: string;
  status: EndpointStatus;
};

export type NotificationDeliveryRecord = {
  id: string;
  conversationId: string;
  messageId: string;
  channel: ChannelName;
  handle: string;
  status: DeliveryStatus;
  providerReference: string | null;
  reason: string | null;
  createdAt: string;
};
