import { z } from 'zod';

export const watchlistQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const watchlistParamsSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID'),
  }),
});

export type WatchlistQuery = z.infer<typeof watchlistQuerySchema>['query'];
