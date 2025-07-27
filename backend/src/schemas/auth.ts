import { z } from 'zod';

export const SignupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  gender: z.enum(['male', 'female', 'non-binary', 'prefer-not-to-say']),
  age: z.number().int().min(18, 'Must be at least 18 years old').max(100, 'Age cannot exceed 100'),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    city: z.string().min(1, 'City is required'),
    country: z.string().min(1, 'Country is required')
  }),
  intent: z.enum(['dating', 'friendship', 'both']),
  bio: z.string().max(500, 'Bio cannot exceed 500 characters').optional().default(''),
  interests: z.array(z.string()).max(10, 'Cannot have more than 10 interests').optional().default([]),
  isAnonymous: z.boolean().optional().default(false),
  authType: z.enum(['email', 'google', 'phone']).default('email'),
  phone: z.string().optional(),
  preferences: z.object({
    ageRange: z.object({
      min: z.number().int().min(18).max(100),
      max: z.number().int().min(18).max(100)
    }),
    maxDistance: z.number().int().min(1).max(500).default(50),
    genderPreference: z.enum(['male', 'female', 'both', 'non-binary']).default('both'),
    intentPreference: z.enum(['dating', 'friendship', 'both']).default('both')
  }).optional()
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format')
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters')
});

export type SignupRequest = z.infer<typeof SignupSchema>;
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
