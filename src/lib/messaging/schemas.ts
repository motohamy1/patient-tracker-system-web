// src/lib/messaging/schemas.ts — Zod validation for the Phase-15 conversation
// model. Parse BEFORE any capability check or write.
import { z } from 'zod';
import { MESSAGE_CHANNELS } from '@/lib/messaging/status';

export const conversationIdSchema = z.string().uuid();

export const messageBodySchema = z
  .string()
  .trim()
  .min(1, 'Write a message first.')
  .max(2000, 'That message is too long.');

export const sendMessageSchema = z.object({
  conversationId: conversationIdSchema,
  body: messageBodySchema,
  channel: z.enum(MESSAGE_CHANNELS).optional(),
});

export const startConversationSchema = z.object({
  patientId: z.string().uuid(),
  body: messageBodySchema,
});

export const closeConversationSchema = z.object({
  conversationId: conversationIdSchema,
});
