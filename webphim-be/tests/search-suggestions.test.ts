import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestContent } from './helpers/content.helper';

// ============================================
// GET /api/search/suggestions — Typeahead (Task 9.3)
// ============================================

describe('GET /api/search/suggestions', () => {
  beforeEach(async () => {
    // Create content with varied titles and view counts for testing
    await createTestContent({
      title: 'The Dark Knight',
      description: 'Batman vs Joker',
      viewCount: 5000,
    });
    await createTestContent({
      title: 'The Dark Knight Rises',
      description: 'Batman vs Bane',
      viewCount: 4000,
    });
    await createTestContent({
      title: 'Darkest Hour',
      description: 'Churchill during WWII',
      viewCount: 2000,
    });
    await createTestContent({
      title: 'Inception',
      description: 'Dream within a dream',
      viewCount: 6000,
    });
    await createTestContent({
      title: 'Interstellar',
      description: 'Space exploration',
      viewCount: 5500,
    });
    await createTestContent({
      title: 'Dark Shadows',
      description: 'A vampire comedy',
      viewCount: 1000,
    });
    await createTestContent({
      title: 'A Dark Song',
      description: 'Occult horror film',
      viewCount: 500,
    });
    await createTestContent({
      title: 'Darkness Falls',
      description: 'A horror movie',
      viewCount: 800,
    });
  });

  describe('basic functionality', () => {
    it('should return suggestions for partial title match', async () => {
      const res = await request.get('/api/search/suggestions?q=Dark');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.length).toBeLessThanOrEqual(5);
    });

    it('should return max 5 suggestions', async () => {
      // 6 titles contain "Dark" — should return max 5
      const res = await request.get('/api/search/suggestions?q=Dark');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(5);
    });

    it('should be case-insensitive', async () => {
      const res1 = await request.get('/api/search/suggestions?q=dark');
      const res2 = await request.get('/api/search/suggestions?q=DARK');

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res1.body.data.length).toBe(res2.body.data.length);
    });

    it('should return empty for no matches', async () => {
      const res = await request.get(
        '/api/search/suggestions?q=xyznonexistent',
      );

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('response format', () => {
    it('should return minimal data fields', async () => {
      const res = await request.get('/api/search/suggestions?q=Inception');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);

      const item = res.body.data[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title', 'Inception');
      expect(item).toHaveProperty('type', 'MOVIE');
      expect(item).toHaveProperty('thumbnailUrl');
      expect(item).toHaveProperty('releaseYear');
      // Should NOT include description, bannerUrl, viewCount, genres
      expect(item).not.toHaveProperty('description');
      expect(item).not.toHaveProperty('bannerUrl');
      expect(item).not.toHaveProperty('genres');
    });
  });

  describe('ordering', () => {
    it('should order by viewCount DESC', async () => {
      const res = await request.get('/api/search/suggestions?q=Dark');

      expect(res.status).toBe(200);
      // The Dark Knight (5000) should come before Dark Knight Rises (4000)
      // which should come before Darkest Hour (2000) etc.
      const firstTitle = res.body.data[0].title;
      expect(firstTitle).toBe('The Dark Knight');
    });
  });

  describe('validation', () => {
    it('should return 400 when q is missing', async () => {
      const res = await request.get('/api/search/suggestions');

      expect(res.status).toBe(400);
    });

    it('should return 400 when q is empty', async () => {
      const res = await request.get('/api/search/suggestions?q=');

      expect(res.status).toBe(400);
    });

    it('should handle single character query', async () => {
      const res = await request.get('/api/search/suggestions?q=D');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle special characters', async () => {
      const res = await request.get(
        `/api/search/suggestions?q=${encodeURIComponent("it's")}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('partial matching', () => {
    it('should match substring anywhere in title', async () => {
      const res = await request.get('/api/search/suggestions?q=Knight');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      const titles = res.body.data.map((d: { title: string }) => d.title);
      expect(titles).toContain('The Dark Knight');
      expect(titles).toContain('The Dark Knight Rises');
    });

    it('should match prefix of title', async () => {
      const res = await request.get('/api/search/suggestions?q=Inter');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Interstellar');
    });
  });
});
