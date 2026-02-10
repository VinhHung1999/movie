import { z } from 'zod';

export const uploadVideoSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
    description: z.string().max(2000, 'Description must be at most 2000 characters').optional(),
    contentId: z.string().uuid('Invalid content ID').optional(),
  }),
});

export const videoIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid video ID'),
  }),
});

export type UploadVideoBody = z.infer<typeof uploadVideoSchema>['body'];
