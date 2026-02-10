import { z } from 'zod';

export const createProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(30),
    avatarUrl: z.string().nullable().optional(),
    isKids: z.boolean().default(false),
  }),
});

export const updateProfileSchema = z.object({
  params: z.object({
    profileId: z.string().uuid('Invalid profile ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(30).optional(),
    avatarUrl: z.string().nullable().optional(),
    isKids: z.boolean().optional(),
  }),
});

export const profileParamsSchema = z.object({
  params: z.object({
    profileId: z.string().uuid('Invalid profile ID'),
  }),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
