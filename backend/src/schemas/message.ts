import { z } from 'zod';

export const SendMessageSchema = z.object({
  content: z.string().min(1, 'Message content is required').max(1000, 'Message cannot exceed 1000 characters'),
  isMedia: z.boolean().optional().default(false),
  mediaURL: z.string().url('Invalid media URL').optional(),
  mediaType: z.enum(['image', 'video', 'audio', 'file']).optional()
});

export const GetMessagesSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 100, 'Limit must be between 1 and 100').optional(),
  before: z.string().optional(), // Message ID to get messages before
  after: z.string().optional()   // Message ID to get messages after
});

export const MarkAsReadSchema = z.object({
  messageIds: z.array(z.string().min(1, 'Message ID is required')).min(1, 'At least one message ID is required')
});

export type SendMessageRequest = z.infer<typeof SendMessageSchema>;
export type GetMessagesQuery = z.infer<typeof GetMessagesSchema>;
export type MarkAsReadRequest = z.infer<typeof MarkAsReadSchema>;
