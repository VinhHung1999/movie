import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  createTestContent,
  createTestGenres,
  linkContentToGenres,
} from './helpers/content.helper';
import prisma from '../src/config/database';

/**
 * Helper to backfill search_vector for test content.
 * The trigger fires on INSERT, but createTestContent uses Prisma ORM
 * which may bypass the trigger if Prisma uses a different INSERT mechanism.
 * This ensures search_vector is populated.
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
// GET /api/search — Full-Text Search
// ============================================

describe('GET /api/search', () => {
  beforeEach(async () => {
    // Create test content with specific titles for search testing
    await createTestContent({
      title: 'The Dark Knight',
      description: 'When the menace known as the Joker wreaks havoc on Gotham',
      releaseYear: 2008,
      viewCount: 5000,
    });
    await createTestContent({
      title: 'Inception',
      description: 'A thief who steals corporate secrets through dream-sharing technology',
      releaseYear: 2010,
      viewCount: 4000,
    });
    await createTestContent({
      title: 'Interstellar',
      description: 'A team of explorers travel through a wormhole in space',
      releaseYear: 2014,
      viewCount: 3000,
    });
    await createTestContent({
      title: 'The Dark Knight Rises',
      description: 'Eight years after the Joker, Batman encounters Bane',
      releaseYear: 2012,
      viewCount: 4500,
    });
    await createTestContent({
      title: 'Breaking Bad: The Movie',
      description: 'A dark tale of chemistry and crime',
      type: 'SERIES',
      releaseYear: 2019,
      viewCount: 6000,
    });
    await backfillSearchVector();
  });

  describe('basic search', () => {
    it('should return results for a matching query', async () => {
      const res = await request.get('/api/search?q=dark+knight');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.query).toBe('dark knight');
      expect(res.body.meta.total).toBeGreaterThanOrEqual(2);

      // Both Dark Knight movies should be found
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('The Dark Knight');
      expect(titles).toContain('The Dark Knight Rises');
    });

    it('should return exact match for single word', async () => {
      const res = await request.get('/api/search?q=inception');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Inception');
    });

    it('should return empty results for non-matching query', async () => {
      const res = await request.get('/api/search?q=xyznonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);
    });

    it('should search description text', async () => {
      const res = await request.get('/api/search?q=wormhole');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('Interstellar');
    });

    it('should rank title matches higher than description matches', async () => {
      // "dark" appears in Dark Knight titles AND in Breaking Bad description
      const res = await request.get('/api/search?q=dark');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);

      // Title matches (Dark Knight) should rank before description-only matches
      const firstTitle = res.body.data[0].title;
      expect(
        firstTitle === 'The Dark Knight' ||
          firstTitle === 'The Dark Knight Rises',
      ).toBe(true);
    });
  });

  describe('response format', () => {
    it('should return ContentSummary format with genres', async () => {
      const genres = await createTestGenres();
      const content = await createTestContent({
        title: 'Genre Test Movie',
        description: 'A movie for testing genre inclusion',
        viewCount: 100,
      });
      await linkContentToGenres(content.id, [genres[0].id]);
      await backfillSearchVector();

      const res = await request.get('/api/search?q=genre+test');

      expect(res.status).toBe(200);
      const item = res.body.data.find(
        (d: { title: string }) => d.title === 'Genre Test Movie',
      );
      expect(item).toBeDefined();
      expect(item.id).toBeDefined();
      expect(item.type).toBe('MOVIE');
      expect(item.releaseYear).toBeDefined();
      expect(item.maturityRating).toBeDefined();
      expect(item.genres).toBeDefined();
      expect(Array.isArray(item.genres)).toBe(true);
      expect(item.genres.length).toBeGreaterThanOrEqual(1);
      expect(item.genres[0]).toHaveProperty('id');
      expect(item.genres[0]).toHaveProperty('name');
      expect(item.genres[0]).toHaveProperty('slug');
    });

    it('should include pagination meta', async () => {
      const res = await request.get('/api/search?q=dark&page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(1);
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.totalPages).toBe('number');
      expect(res.body.meta.query).toBe('dark');
    });
  });

  describe('pagination', () => {
    it('should respect page and limit params', async () => {
      const res = await request.get('/api/search?q=dark&page=1&limit=1');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(1);
    });

    it('should return second page', async () => {
      const res1 = await request.get('/api/search?q=dark&page=1&limit=1');
      const res2 = await request.get('/api/search?q=dark&page=2&limit=1');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data[0].id).not.toBe(res2.body.data[0]?.id);
    });
  });

  describe('sort options', () => {
    it('should sort by relevance by default', async () => {
      const res = await request.get('/api/search?q=dark+knight');

      expect(res.status).toBe(200);
      // Default sort should be relevance - both Dark Knight movies found
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should sort by newest', async () => {
      const res = await request.get(
        '/api/search?q=dark+knight&sort=newest',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      // Dark Knight Rises (2012) should come before Dark Knight (2008)
      const years = res.body.data.map(
        (d: { releaseYear: number }) => d.releaseYear,
      );
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeLessThanOrEqual(years[i - 1]);
      }
    });

    it('should sort by oldest', async () => {
      const res = await request.get(
        '/api/search?q=dark+knight&sort=oldest',
      );

      expect(res.status).toBe(200);
      const years = res.body.data.map(
        (d: { releaseYear: number }) => d.releaseYear,
      );
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i - 1]);
      }
    });

    it('should sort by views', async () => {
      const res = await request.get('/api/search?q=dark&sort=views');

      expect(res.status).toBe(200);
      const views = res.body.data.map(
        (d: { viewCount: number }) => d.viewCount,
      );
      for (let i = 1; i < views.length; i++) {
        expect(views[i]).toBeLessThanOrEqual(views[i - 1]);
      }
    });
  });

  describe('validation', () => {
    it('should return 400 when q is missing', async () => {
      const res = await request.get('/api/search');

      expect(res.status).toBe(400);
    });

    it('should return 400 when q is empty string', async () => {
      const res = await request.get('/api/search?q=');

      expect(res.status).toBe(400);
    });

    it('should handle special characters gracefully', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent("it's a test")}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle quotes gracefully', async () => {
      const res = await request.get(
        `/api/search?q=${encodeURIComponent('"dark knight"')}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('filters', () => {
    it('should filter by type MOVIE', async () => {
      const res = await request.get('/api/search?q=dark&type=MOVIE');

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
      }
    });

    it('should filter by type SERIES', async () => {
      const res = await request.get('/api/search?q=dark&type=SERIES');

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('SERIES');
      }
    });

    it('should filter by genre slug', async () => {
      const genres = await createTestGenres();
      // Get first Dark Knight content and link to Action
      const darkKnight = await prisma.content.findFirst({
        where: { title: 'The Dark Knight' },
      });
      if (darkKnight) {
        await linkContentToGenres(darkKnight.id, [genres[0].id]); // Action
      }

      const res = await request.get('/api/search?q=dark&genre=action');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].title).toBe('The Dark Knight');
    });

    it('should filter by year range', async () => {
      const res = await request.get(
        '/api/search?q=dark&yearFrom=2010&yearTo=2015',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.releaseYear).toBeGreaterThanOrEqual(2010);
        expect(item.releaseYear).toBeLessThanOrEqual(2015);
      }
    });

    it('should combine multiple filters', async () => {
      const res = await request.get(
        '/api/search?q=dark&type=MOVIE&yearFrom=2000&yearTo=2010',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
        expect(item.releaseYear).toBeGreaterThanOrEqual(2000);
        expect(item.releaseYear).toBeLessThanOrEqual(2010);
      }
    });
  });
});
