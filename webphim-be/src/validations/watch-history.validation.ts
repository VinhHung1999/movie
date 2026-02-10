import { z } from 'zod';

export const saveProgressSchema = z.object({
  body: z.object({
    contentId: z.string().uuid('Invalid content ID'),
    episodeId: z.string().uuid('Invalid episode ID').nullable().optional(),
    progress: z.number().int().min(0, 'Progress must be >= 0'),
    duration: z.number().int().min(1, 'Duration must be > 0'),
  }),
});

export type SaveProgressBody = z.infer<typeof saveProgressSchema>['body'];
