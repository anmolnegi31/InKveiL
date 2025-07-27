import { z } from 'zod';

export const CreateRoomSchema = z.object({
  roomName: z.string().min(3, 'Room name must be at least 3 characters').max(100, 'Room name cannot exceed 100 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters'),
  roomType: z.enum(['discussion', 'event', 'meetup', 'hobby']),
  tags: z.array(z.string()).max(5, 'Cannot have more than 5 tags').optional().default([]),
  maxParticipants: z.number().int().min(2).max(10).optional().default(5),
  isPrivate: z.boolean().optional().default(false),
  scheduledFor: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  duration: z.number().int().min(15).max(180).optional().default(60) // 15 minutes to 3 hours
});

export const JoinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required')
});

export const GetRoomsSchema = z.object({
  roomType: z.enum(['discussion', 'event', 'meetup', 'hobby']).optional(),
  tags: z.string().optional().transform(val => val ? val.split(',').map(tag => tag.trim()) : undefined),
  isPrivate: z.enum(['true', 'false']).optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  scheduled: z.enum(['upcoming', 'live', 'past']).optional(),
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 50, 'Limit must be between 1 and 50').optional()
});

export const UpdateRoomSchema = z.object({
  roomName: z.string().min(3, 'Room name must be at least 3 characters').max(100, 'Room name cannot exceed 100 characters').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(500, 'Description cannot exceed 500 characters').optional(),
  tags: z.array(z.string()).max(5, 'Cannot have more than 5 tags').optional(),
  maxParticipants: z.number().int().min(2).max(10).optional(),
  isPrivate: z.boolean().optional(),
  scheduledFor: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  duration: z.number().int().min(15).max(180).optional()
});

export type CreateRoomRequest = z.infer<typeof CreateRoomSchema>;
export type JoinRoomRequest = z.infer<typeof JoinRoomSchema>;
export type GetRoomsQuery = z.infer<typeof GetRoomsSchema>;
export type UpdateRoomRequest = z.infer<typeof UpdateRoomSchema>;
