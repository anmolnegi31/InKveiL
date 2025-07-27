import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters').optional(),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional(),
  interests: z.array(z.string()).max(10, 'Cannot have more than 10 interests').optional(),
  photoURL: z.string().url('Invalid photo URL').optional(),
  isAnonymous: z.boolean().optional(),
  intent: z.enum(['dating', 'friendship', 'both']).optional(),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required')
  }).optional()
});

export const UpdatePreferencesSchema = z.object({
  ageRange: z.object({
    min: z.number().int().min(18).max(100),
    max: z.number().int().min(18).max(100)
  }).optional(),
  maxDistance: z.number().int().min(1).max(500).optional(),
  genderPreference: z.enum(['male', 'female', 'both', 'non-binary']).optional(),
  intentPreference: z.enum(['dating', 'friendship', 'both']).optional()
});

export const DiscoverUsersSchema = z.object({
  page: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Page must be positive').optional(),
  limit: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0 && val <= 50, 'Limit must be between 1 and 50').optional(),
  minAge: z.string().transform(val => parseInt(val, 10)).refine(val => val >= 18, 'Min age must be at least 18').optional(),
  maxAge: z.string().transform(val => parseInt(val, 10)).refine(val => val <= 100, 'Max age cannot exceed 100').optional(),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']).optional(),
  intent: z.enum(['dating', 'friendship', 'both']).optional(),
  maxDistance: z.string().transform(val => parseInt(val, 10)).refine(val => val > 0, 'Max distance must be positive').optional()
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileSchema>;
export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesSchema>;
export type DiscoverUsersQuery = z.infer<typeof DiscoverUsersSchema>;
