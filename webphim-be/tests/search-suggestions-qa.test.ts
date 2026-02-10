import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestContent } from './helpers/content.helper';

// ============================================
// QA: GET /api/search/suggestions — Edge Cases
// ============================================

describe('QA: GET /api/search/suggestions — Edge Cases', () => {
  describe('boundary conditions', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'Boundary Test Alpha',
        description: 'First boundary test',
        viewCount: 3000,
      });
      await createTestContent({
        title: 'Boundary Test Beta',
        description: 'Second boundary test',
        viewCount: 2000,
      });
    });

    it('should handle query at max length (100 chars)', async () => {
      const maxQuery = 'a'.repeat(100);
      const res = await request.get(
        `/api/search/suggestions?q=${encodeURIComponent(maxQuery)}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject query exceeding max length (101 chars)', async () => {
      const tooLong = 'a'.repeat(101);
      const res = await request.get(
        `/api/search/suggestions?q=${encodeURIComponent(tooLong)}`,
      );

      expect(res.status).toBe(400);
    });

    it('should handle single character query', async () => {
      const res = await request.get('/api/search/suggestions?q=B');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Should match "Boundary Test Alpha" and "Boundary Test Beta"
      for (const item of res.body.data) {
        expect(item.title.toLowerCase()).toContain('b');
      }
    });
  });

  describe('special characters in suggestions', () => {
    beforeEach(async () => {
      await createTestContent({
        title: "Logan's Run",
        description: 'A sci-fi classic',
        viewCount: 2000,
      });
      await createTestContent({
        title: 'Amélie',
        description: 'A French romantic comedy',
        viewCount: 4000,
      });
    });

    it('should handle apostrophe in suggestion query', async () => {
      const res = await request.get(
        `/api/search/suggestions?q=${encodeURIComponent("Logan's")}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should handle Unicode in suggestion query', async () => {
      const res = await request.get(
        `/api/search/suggestions?q=${encodeURIComponent('Amél')}`,
      );

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('viewCount ordering verification', () => {
    beforeEach(async () => {
      // Create 3 items with same partial title but different viewCounts
      await createTestContent({
        title: 'Order Check Low',
        description: 'Low views',
        viewCount: 100,
      });
      await createTestContent({
        title: 'Order Check High',
        description: 'High views',
        viewCount: 9000,
      });
      await createTestContent({
        title: 'Order Check Medium',
        description: 'Medium views',
        viewCount: 3000,
      });
    });

    it('should return suggestions ordered by viewCount DESC', async () => {
      const res = await request.get('/api/search/suggestions?q=Order+Check');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);

      // Verify order: High (9000) → Medium (3000) → Low (100)
      expect(res.body.data[0].title).toBe('Order Check High');
      expect(res.body.data[1].title).toBe('Order Check Medium');
      expect(res.body.data[2].title).toBe('Order Check Low');
    });
  });

  describe('data shape strictness', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'Shape Strict Movie',
        description: 'Should not appear in suggestions',
        viewCount: 500,
        releaseYear: 2020,
        thumbnailUrl: '/images/strict-thumb.jpg',
        bannerUrl: '/images/strict-banner.jpg',
      });
    });

    it('should return exactly the documented fields', async () => {
      const res = await request.get(
        '/api/search/suggestions?q=Shape+Strict',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);

      const item = res.body.data[0];
      const keys = Object.keys(item).sort();

      // Only these 5 fields: id, title, type, thumbnailUrl, releaseYear
      expect(keys).toEqual(
        ['id', 'releaseYear', 'thumbnailUrl', 'title', 'type'].sort(),
      );
    });

    it('should NOT include heavy fields (description, bannerUrl, viewCount, genres)', async () => {
      const res = await request.get(
        '/api/search/suggestions?q=Shape+Strict',
      );

      expect(res.status).toBe(200);
      const item = res.body.data[0];

      expect(item).not.toHaveProperty('description');
      expect(item).not.toHaveProperty('bannerUrl');
      expect(item).not.toHaveProperty('viewCount');
      expect(item).not.toHaveProperty('genres');
      expect(item).not.toHaveProperty('maturityRating');
      expect(item).not.toHaveProperty('duration');
    });
  });

  describe('cross-check with search endpoint', () => {
    beforeEach(async () => {
      await createTestContent({
        title: 'CrossCheck Movie',
        description: 'For cross-checking suggestions vs search',
        viewCount: 1000,
      });
    });

    it('suggestions result ID should be valid for content detail', async () => {
      const suggestRes = await request.get(
        '/api/search/suggestions?q=CrossCheck',
      );

      expect(suggestRes.status).toBe(200);
      expect(suggestRes.body.data.length).toBe(1);

      const contentId = suggestRes.body.data[0].id;
      const detailRes = await request.get(`/api/content/${contentId}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.title).toBe('CrossCheck Movie');
    });
  });
});
