import { z } from 'zod';

export const rateSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID'),
  }),
  body: z.object({
    score: z.number().int().min(1).max(2),
  }),
});

export const ratingParamsSchema = z.object({
  params: z.object({
    contentId: z.string().uuid('Invalid content ID'),
  }),
});

export const ratingsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export type RateInput = z.infer<typeof rateSchema>;
export type RatingsQuery = z.infer<typeof ratingsQuerySchema>['query'];
