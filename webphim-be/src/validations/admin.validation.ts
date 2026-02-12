import { z } from 'zod';

export const createContentSchema = z.object({
  body: z.object({
    type: z.enum(['MOVIE', 'SERIES']),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(2000),
    releaseYear: z.number().int().min(1900).max(2100),
    maturityRating: z.enum(['G', 'PG', 'PG13', 'R', 'NC17']).default('PG13'),
    duration: z.number().int().positive().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    bannerUrl: z.string().nullable().optional(),
    trailerUrl: z.string().nullable().optional(),
    genreIds: z.array(z.string().uuid()).default([]),
    cast: z.array(z.object({
      castCrewId: z.string().uuid(),
      role: z.enum(['ACTOR', 'DIRECTOR', 'WRITER']),
      character: z.string().nullable().optional(),
      displayOrder: z.number().int().default(0),
    })).default([]),
  }),
});

export const updateContentSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().min(1).max(2000).optional(),
    releaseYear: z.number().int().min(1900).max(2100).optional(),
    maturityRating: z.enum(['G', 'PG', 'PG13', 'R', 'NC17']).optional(),
    duration: z.number().int().positive().nullable().optional(),
    thumbnailUrl: z.string().nullable().optional(),
    bannerUrl: z.string().nullable().optional(),
    trailerUrl: z.string().nullable().optional(),
    genreIds: z.array(z.string().uuid()).optional(),
    cast: z.array(z.object({
      castCrewId: z.string().uuid(),
      role: z.enum(['ACTOR', 'DIRECTOR', 'WRITER']),
      character: z.string().nullable().optional(),
      displayOrder: z.number().int().default(0),
    })).optional(),
  }),
});

export const adminListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['MOVIE', 'SERIES']).optional(),
    search: z.string().optional(),
  }),
});

export const castListSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});
