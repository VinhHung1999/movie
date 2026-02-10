import { z } from 'zod';

export const searchSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(200),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(['MOVIE', 'SERIES']).optional(),
    genre: z.string().optional().transform((v) => v || undefined),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
    sort: z
      .enum(['relevance', 'newest', 'oldest', 'views', 'title'])
      .default('relevance'),
  }),
});

export const suggestionsSchema = z.object({
  query: z.object({
    q: z.string().min(1).max(100),
  }),
});

export type SearchQuery = z.infer<typeof searchSchema>['query'];
export type SuggestionsQuery = z.infer<typeof suggestionsSchema>['query'];
