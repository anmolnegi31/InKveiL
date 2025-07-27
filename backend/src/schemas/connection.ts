import { z } from 'zod';

export const CreateConnectionRequestSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  message: z.string().max(300, 'Message cannot exceed 300 characters').optional().default('')
});

export const UpdateConnectionStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected'])
});

export const GetConnectionsSchema = z.object({
  status: z.enum(['pending', 'accepted', 'rejected', 'expired']).optional(),
  type: z.enum(['sent', 'received', 'all']).optional().default('all'),
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 50, 'Limit must be between 1 and 50').optional()
});

export type CreateConnectionRequestRequest = z.infer<typeof CreateConnectionRequestSchema>;
export type UpdateConnectionStatusRequest = z.infer<typeof UpdateConnectionStatusSchema>;
export type GetConnectionsQuery = z.infer<typeof GetConnectionsSchema>;
