import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  createTestContent,
  createTestGenres,
  linkContentToGenres,
} from './helpers/content.helper';
import prisma from '../src/config/database';

/**
 * Backfill search_vector for test content.
 * Prisma ORM INSERT may not trigger the PostgreSQL BEFORE INSERT trigger,
 * so we manually update search_vector for test data.
 */
async function backfillSearchVector() {
  await prisma.$executeRaw`
    UPDATE content SET search_vector =
      setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    WHERE search_vector IS NULL
  `;
}

// ============================================
// QA: GET /api/search — Edge Cases & Data Integrity
// ============================================

describe('QA: GET /api/search — Edge Cases & Data Integrity', () => {
  describe('search_vector data integrity', () => {
    it('should have search_vector populated after backfill', async () => {
      await createTestContent({
        title: 'Integrity Check Movie',
        description: 'Testing search vector population',
      });
      await backfillSearchVector();

      const result = await prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*)::bigint as count FROM content
        WHERE search_vector IS NOT NULL
      `;
      expect(Number(result[0].count)).toBeGreaterThan(0);
    });

    it('should find content by title word after backfill', async () => {
      await createTestContent({
        title: 'UniqueVectorTitle',
        description: 'Some description here',
      });
      await backfillSearchVector();

      const res = await request.get('/api/search?q=UniqueVectorTitle');
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('UniqueVectorTitle');
    });
  });

  describe('tsvector stemming behavior', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'Running in the Park',
        description: 'Runners enjoying a morning jog',
      });
      await createTestContent({
        title: 'The Knight Returns',
        description: 'A tale of knights and honor',
      });
      await backfillSearchVector();
    });

    it('should match stemmed words (run → running)', async () => {
      const res = await request.get('/api/search?q=run');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('Running in the Park');
    });

    it('should match plural forms (knight → knights)', async () => {
      const res = await request.get('/api/search?q=knights');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('The Knight Returns');
    });
  });

  describe('special characters and edge inputs', () => {
    beforeEach(async () => {
      await createTestContent({
        title: "It's a Wonderful Life",
        description: "A man's journey of self-discovery",
      });
      await createTestContent({
        title: 'Café Society',
        description: 'A romantic comedy set in the 1930s',
      });
      await createTestContent({
        title: 'The Good, the Bad & the Ugly',
        description: 'A classic western film',
      });
      await backfillSearchVector();
    });

    it('should handle apostrophes in search query', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent("it's")}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle Unicode characters', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent('café')}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle ampersand in query', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent('bad & ugly')}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle query with only special characters gracefully', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent('!@#$%')}`,
      );

      // websearch_to_tsquery should handle this — either 200 with empty results or 200
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle query at max length (200 chars)', async () => {
      const longQuery = 'a'.repeat(200);
      const res = await request.get(
        `/api/search?q=${encodeURIComponent(longQuery)}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject query exceeding max length (201 chars)', async () => {
      const tooLong = 'a'.repeat(201);
      const res = await request.get(
        `/api/search?q=${encodeURIComponent(tooLong)}`,
      );

      expect(res.status).toBe(400);
    });
  });

  describe('weighted ranking verification', () => {
    beforeEach(async () => {
      // "adventure" in title only
      await createTestContent({
        title: 'Adventure Time the Movie',
        description: 'A cartoon about a boy and his dog',
        viewCount: 100,
      });
      // "adventure" in description only
      await createTestContent({
        title: 'Journey to the Unknown',
        description: 'An adventure through uncharted territories',
        viewCount: 100,
      });
      await backfillSearchVector();
    });

    it('should rank title match higher than description-only match', async () => {
      const res = await request.get('/api/search?q=adventure');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      // Title match (weight A) should rank first
      expect(res.body.data[0].title).toBe('Adventure Time the Movie');
      expect(res.body.data[1].title).toBe('Journey to the Unknown');
    });
  });

  describe('filter edge cases', () => {
    beforeEach(async () => {
      const genres = await createTestGenres();

      const movie1 = await createTestContent({
        title: 'Edge Case Alpha',
        description: 'First edge case movie',
        type: 'MOVIE',
        releaseYear: 2000,
        viewCount: 500,
      });
      await linkContentToGenres(movie1.id, [genres[0].id]); // Action

      const movie2 = await createTestContent({
        title: 'Edge Case Beta',
        description: 'Second edge case movie',
        type: 'MOVIE',
        releaseYear: 2010,
        viewCount: 1500,
      });
      await linkContentToGenres(movie2.id, [genres[1].id]); // Drama

      await createTestContent({
        title: 'Edge Case Gamma',
        description: 'An edge case series',
        type: 'SERIES',
        releaseYear: 2020,
        viewCount: 3000,
      });

      await backfillSearchVector();
    });

    it('should return empty when type filter excludes all matches', async () => {
      // Search for "edge case" but filter SERIES — only Gamma is SERIES
      const res = await request.get(
        '/api/search?q=edge+case+alpha&type=SERIES',
      );

      expect(res.status).toBe(200);
      // Alpha is MOVIE, so filtering for SERIES should exclude it
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).not.toContain('Edge Case Alpha');
    });

    it('should handle yearFrom equal to yearTo (single year)', async () => {
      const res = await request.get(
        '/api/search?q=edge+case&yearFrom=2010&yearTo=2010',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.releaseYear).toBe(2010);
      }
    });

    it('should handle non-existent genre slug gracefully', async () => {
      const res = await request.get(
        '/api/search?q=edge+case&genre=nonexistent-genre',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should return correct total in meta when filters narrow results', async () => {
      const res = await request.get(
        '/api/search?q=edge+case&type=MOVIE',
      );

      expect(res.status).toBe(200);
      expect(res.body.meta.total).toBe(res.body.data.length);
      // All returned items must be MOVIE
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
      }
    });
  });

  describe('pagination edge cases', () => {
    beforeEach(async () => {
      // Create 6 items matching "paginate"
      for (let i = 1; i <= 6; i++) {
        await createTestContent({
          title: `Paginate Movie ${i}`,
          description: 'A movie about pagination testing',
          viewCount: i * 100,
        });
      }
      await backfillSearchVector();
    });

    it('should return correct totalPages with custom limit', async () => {
      const res = await request.get('/api/search?q=paginate&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBe(6);
      expect(res.body.meta.totalPages).toBe(3);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty data for page beyond total pages', async () => {
      const res = await request.get(
        '/api/search?q=paginate&page=10&limit=5',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
      expect(res.body.meta.total).toBe(6);
    });

    it('should return remaining items on last partial page', async () => {
      const res = await request.get('/api/search?q=paginate&page=2&limit=4');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2); // 6 total, page 2 with limit 4 = 2 remaining
      expect(res.body.meta.page).toBe(2);
    });
  });

  describe('cross-endpoint consistency', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'Consistency Test Film',
        description: 'A movie for cross-endpoint testing',
        viewCount: 999,
        releaseYear: 2021,
      });
      await backfillSearchVector();
    });

    it('search and suggestions should return same content for same title', async () => {
      const searchRes = await request.get(
        '/api/search?q=consistency+test',
      );
      const suggestRes = await request.get(
        '/api/search/suggestions?q=Consistency',
      );

      expect(searchRes.status).toBe(200);
      expect(suggestRes.status).toBe(200);

      // Both should find the same content
      expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);
      expect(suggestRes.body.data.length).toBeGreaterThanOrEqual(1);

      const searchId = searchRes.body.data[0].id;
      const suggestId = suggestRes.body.data[0].id;
      expect(searchId).toBe(suggestId);
    });

    it('search result should match content detail endpoint data', async () => {
      const searchRes = await request.get(
        '/api/search?q=consistency+test',
      );
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.length).toBeGreaterThanOrEqual(1);

      const contentId = searchRes.body.data[0].id;
      const detailRes = await request.get(`/api/content/${contentId}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.title).toBe('Consistency Test Film');
      expect(detailRes.body.data.id).toBe(contentId);
    });
  });

  describe('response shape validation', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'Shape Validation Movie',
        description: 'Testing response shape',
        releaseYear: 2020,
        viewCount: 500,
        thumbnailUrl: '/images/shape-thumb.jpg',
        bannerUrl: '/images/shape-banner.jpg',
      });
      await backfillSearchVector();
    });

    it('should return all required ContentSummary fields', async () => {
      const res = await request.get('/api/search?q=shape+validation');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);

      const item = res.body.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('releaseYear');
      expect(item).toHaveProperty('maturityRating');
      expect(item).toHaveProperty('duration');
      expect(item).toHaveProperty('thumbnailUrl');
      expect(item).toHaveProperty('bannerUrl');
      expect(item).toHaveProperty('viewCount');
      expect(item).toHaveProperty('genres');
      expect(Array.isArray(item.genres)).toBe(true);
    });

    it('should return correct meta shape', async () => {
      const res = await request.get('/api/search?q=shape+validation');

      expect(res.status).toBe(200);
      expect(res.body.meta).toHaveProperty('page');
      expect(res.body.meta).toHaveProperty('limit');
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('totalPages');
      expect(res.body.meta).toHaveProperty('query');
      expect(typeof res.body.meta.page).toBe('number');
      expect(typeof res.body.meta.limit).toBe('number');
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.totalPages).toBe('number');
      expect(typeof res.body.meta.query).toBe('string');
    });

    it('should return camelCase field names (not snake_case)', async () => {
      const res = await request.get('/api/search?q=shape+validation');

      expect(res.status).toBe(200);
      const item = res.body.data[0];

      // Verify camelCase
      expect(item).toHaveProperty('releaseYear');
      expect(item).toHaveProperty('maturityRating');
      expect(item).toHaveProperty('thumbnailUrl');
      expect(item).toHaveProperty('bannerUrl');
      expect(item).toHaveProperty('viewCount');

      // Verify NO snake_case
      expect(item).not.toHaveProperty('release_year');
      expect(item).not.toHaveProperty('maturity_rating');
      expect(item).not.toHaveProperty('thumbnail_url');
      expect(item).not.toHaveProperty('banner_url');
      expect(item).not.toHaveProperty('view_count');
    });
  });
});
