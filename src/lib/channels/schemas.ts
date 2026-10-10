// src/lib/channels/schemas.ts — Zod validation for the channel endpoints
// (Phase 16). Parse BEFORE any capability check or write.
import { z } from 'zod';
import { CHANNEL_NAMES, ENDPOINT_STATUSES } from '@/lib/channels/status';

export const channelEndpointIdSchema = z.string().uuid();

// A handle is a phone number or a chat id: a short, sane token. The adapter
// normalizes further; the schema only refuses junk.
const handle = z
  .string()
  .trim()
  .min(3, 'Enter the phone number or chat id.')
  .max(64)
  .regex(/^[+()\-\s0-9A-Za-z_.]+$/, 'Use digits, spaces, or a @handle.');

export const saveChannelEndpointSchema = z.object({
  patientId: z.string().uuid(),
  channel: z.enum(CHANNEL_NAMES),
  handle,
  status: z.enum(ENDPOINT_STATUSES).optional(),
});

export const setChannelEndpointStatusSchema = z.object({
  endpointId: channelEndpointIdSchema,
  status: z.enum(ENDPOINT_STATUSES),
});
