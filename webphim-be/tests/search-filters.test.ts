import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  createTestContent,
  createTestGenres,
  linkContentToGenres,
} from './helpers/content.helper';
import prisma from '../src/config/database';

async function backfillSearchVector() {
  await prisma.$executeRaw`
    UPDATE content SET search_vector =
      setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
      setweight(to_tsvector('english', COALESCE(description, '')), 'B')
    WHERE search_vector IS NULL
  `;
}

// ============================================
// GET /api/search — Filter Tests (Task 9.2)
// ============================================

describe('GET /api/search — Filters (Task 9.2)', () => {
  let genres: Awaited<ReturnType<typeof createTestGenres>>;

  beforeEach(async () => {
    genres = await createTestGenres();

    // Create diverse content for filter testing
    const movie1 = await createTestContent({
      title: 'Action Movie Alpha',
      description: 'An explosive action adventure',
      type: 'MOVIE',
      releaseYear: 2005,
      viewCount: 3000,
    });
    await linkContentToGenres(movie1.id, [genres[0].id]); // Action

    const movie2 = await createTestContent({
      title: 'Drama Movie Beta',
      description: 'A dramatic story about action and consequences',
      type: 'MOVIE',
      releaseYear: 2015,
      viewCount: 5000,
    });
    await linkContentToGenres(movie2.id, [genres[1].id]); // Drama

    const series1 = await createTestContent({
      title: 'Action Series Gamma',
      description: 'An action-packed television series',
      type: 'SERIES',
      releaseYear: 2020,
      viewCount: 8000,
    });
    await linkContentToGenres(series1.id, [genres[0].id, genres[1].id]); // Action + Drama

    const movie3 = await createTestContent({
      title: 'Comedy Action Delta',
      description: 'A funny action comedy',
      type: 'MOVIE',
      releaseYear: 2022,
      viewCount: 1000,
    });
    await linkContentToGenres(movie3.id, [genres[0].id, genres[2].id]); // Action + Comedy

    await backfillSearchVector();
  });

  describe('type filter', () => {
    it('should return only MOVIE type when filtered', async () => {
      const res = await request.get('/api/search?q=action&type=MOVIE');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
      }
    });

    it('should return only SERIES type when filtered', async () => {
      const res = await request.get('/api/search?q=action&type=SERIES');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const item of res.body.data) {
        expect(item.type).toBe('SERIES');
      }
    });

    it('should return all types when no type filter', async () => {
      const res = await request.get('/api/search?q=action');

      expect(res.status).toBe(200);
      const types = new Set(
        res.body.data.map((d: { type: string }) => d.type),
      );
      expect(types.size).toBeGreaterThan(1);
    });

    it('should reject invalid type values', async () => {
      const res = await request.get('/api/search?q=action&type=INVALID');

      expect(res.status).toBe(400);
    });
  });

  describe('genre filter', () => {
    it('should filter by genre slug', async () => {
      const res = await request.get('/api/search?q=action&genre=comedy');

      expect(res.status).toBe(200);
      // Only Comedy Action Delta should match (has action in title AND comedy genre)
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('Comedy Action Delta');
    });

    it('should return empty when genre has no matches', async () => {
      const res = await request.get('/api/search?q=action&genre=sci-fi');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });

    it('should ignore empty genre param', async () => {
      const res = await request.get('/api/search?q=action&genre=');

      expect(res.status).toBe(200);
      // Should return all action results, not filter by empty genre
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('year range filter', () => {
    it('should filter by yearFrom only', async () => {
      const res = await request.get('/api/search?q=action&yearFrom=2015');

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.releaseYear).toBeGreaterThanOrEqual(2015);
      }
    });

    it('should filter by yearTo only', async () => {
      const res = await request.get('/api/search?q=action&yearTo=2010');

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.releaseYear).toBeLessThanOrEqual(2010);
      }
    });

    it('should filter by yearFrom and yearTo', async () => {
      const res = await request.get(
        '/api/search?q=action&yearFrom=2010&yearTo=2021',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.releaseYear).toBeGreaterThanOrEqual(2010);
        expect(item.releaseYear).toBeLessThanOrEqual(2021);
      }
    });

    it('should return empty when year range has no matches', async () => {
      const res = await request.get(
        '/api/search?q=action&yearFrom=1900&yearTo=1950',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe('sort options', () => {
    it('should sort by title alphabetically', async () => {
      const res = await request.get('/api/search?q=action&sort=title');

      expect(res.status).toBe(200);
      const titles = res.body.data.map((d: { title: string }) => d.title);
      const sorted = [...titles].sort();
      expect(titles).toEqual(sorted);
    });

    it('should sort by views descending', async () => {
      const res = await request.get('/api/search?q=action&sort=views');

      expect(res.status).toBe(200);
      const views = res.body.data.map(
        (d: { viewCount: number }) => d.viewCount,
      );
      for (let i = 1; i < views.length; i++) {
        expect(views[i]).toBeLessThanOrEqual(views[i - 1]);
      }
    });

    it('should sort by newest (release year DESC)', async () => {
      const res = await request.get('/api/search?q=action&sort=newest');

      expect(res.status).toBe(200);
      const years = res.body.data.map(
        (d: { releaseYear: number }) => d.releaseYear,
      );
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeLessThanOrEqual(years[i - 1]);
      }
    });

    it('should sort by oldest (release year ASC)', async () => {
      const res = await request.get('/api/search?q=action&sort=oldest');

      expect(res.status).toBe(200);
      const years = res.body.data.map(
        (d: { releaseYear: number }) => d.releaseYear,
      );
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeGreaterThanOrEqual(years[i - 1]);
      }
    });

    it('should default to relevance sort', async () => {
      const res = await request.get('/api/search?q=action');

      expect(res.status).toBe(200);
      // No explicit sort param → default relevance
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject invalid sort value', async () => {
      const res = await request.get('/api/search?q=action&sort=invalid');

      expect(res.status).toBe(400);
    });
  });

  describe('combined filters (AND logic)', () => {
    it('should combine type + genre', async () => {
      const res = await request.get(
        '/api/search?q=action&type=MOVIE&genre=action',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
      }
      // Should not include the SERIES with action genre
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).not.toContain('Action Series Gamma');
    });

    it('should combine type + year range + sort', async () => {
      const res = await request.get(
        '/api/search?q=action&type=MOVIE&yearFrom=2010&sort=newest',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
        expect(item.releaseYear).toBeGreaterThanOrEqual(2010);
      }
      // Check sort order
      const years = res.body.data.map(
        (d: { releaseYear: number }) => d.releaseYear,
      );
      for (let i = 1; i < years.length; i++) {
        expect(years[i]).toBeLessThanOrEqual(years[i - 1]);
      }
    });

    it('should combine all filters', async () => {
      const res = await request.get(
        '/api/search?q=action&type=MOVIE&genre=action&yearFrom=2020&yearTo=2025&sort=views',
      );

      expect(res.status).toBe(200);
      for (const item of res.body.data) {
        expect(item.type).toBe('MOVIE');
        expect(item.releaseYear).toBeGreaterThanOrEqual(2020);
        expect(item.releaseYear).toBeLessThanOrEqual(2025);
      }
    });
  });

  describe('Zod validation for filter params', () => {
    it('should reject non-numeric page', async () => {
      const res = await request.get('/api/search?q=test&page=abc');

      expect(res.status).toBe(400);
    });

    it('should reject limit > 50', async () => {
      const res = await request.get('/api/search?q=test&limit=100');

      expect(res.status).toBe(400);
    });

    it('should reject limit < 1', async () => {
      const res = await request.get('/api/search?q=test&limit=0');

      expect(res.status).toBe(400);
    });

    it('should reject yearFrom < 1900', async () => {
      const res = await request.get('/api/search?q=test&yearFrom=1800');

      expect(res.status).toBe(400);
    });

    it('should reject yearTo > 2100', async () => {
      const res = await request.get('/api/search?q=test&yearTo=2200');

      expect(res.status).toBe(400);
    });
  });
});
