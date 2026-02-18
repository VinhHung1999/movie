import { z } from 'zod';

export const contentListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    type: z.enum(['MOVIE', 'SERIES']).optional(),
    genre: z.string().optional(),
    sort: z.enum(['newest', 'oldest', 'rating', 'views', 'title']).default('newest'),
    search: z.string().optional(),
    maturityRating: z.enum(['G', 'PG', 'PG13', 'R', 'NC17']).optional(),
    yearFrom: z.coerce.number().int().min(1900).max(2100).optional(),
    yearTo: z.coerce.number().int().min(1900).max(2100).optional(),
  }),
});

export const contentDetailSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid content ID'),
  }),
});

export const similarContentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid content ID'),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(20).default(12),
  }),
});

export type ContentListQuery = z.infer<typeof contentListSchema>['query'];
export type ContentDetailParams = z.infer<typeof contentDetailSchema>['params'];
