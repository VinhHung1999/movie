import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/database';

// Helper to register and get auth token
async function getAuthToken(email = 'wh-test@example.com') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password: 'Test1234!', name: 'WH Tester' });
  return res.body.data.accessToken;
}

// Helper to create test content
async function createTestContent() {
  return prisma.content.create({
    data: {
      type: 'MOVIE',
      title: 'Test Movie for WH',
      description: 'A test movie',
      releaseYear: 2024,
    },
  });
}

describe('Watch History API', () => {
  let token: string;
  let content: { id: string };

  beforeEach(async () => {
    token = await getAuthToken(`wh-${Date.now()}@test.com`);
    content = await createTestContent();
  });

  // =============================================
  // 7.7 Watch Progress API
  // =============================================
  describe('POST /api/watch-history', () => {
    it('should save watch progress and return 200', async () => {
      const res = await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: content.id,
          progress: 120,
          duration: 7200,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contentId).toBe(content.id);
      expect(res.body.data.progress).toBe(120);
      expect(res.body.data.duration).toBe(7200);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });

    it('should upsert (update existing) on same contentId', async () => {
      // First save
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 60, duration: 7200 });

      // Second save (update)
      const res = await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 300, duration: 7200 });

      expect(res.status).toBe(200);
      expect(res.body.data.progress).toBe(300);

      // Should only have 1 record
      const count = await prisma.watchHistory.count();
      expect(count).toBe(1);
    });

    it('should save with episodeId for series', async () => {
      const episodeId = 'a0000000-0000-4000-8000-000000000001';
      const res = await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: content.id,
          episodeId,
          progress: 45,
          duration: 3600,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.episodeId).toBe(episodeId);
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({
          contentId: 'a0000000-0000-4000-8000-000000000099',
          progress: 60,
          duration: 7200,
        });

      expect(res.status).toBe(404);
    });

    it('should return 400 for invalid body', async () => {
      const res = await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: 'not-a-uuid', progress: -1, duration: 0 });

      expect(res.status).toBe(400);
      expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it('should return 401 without auth token', async () => {
      const res = await request(app)
        .post('/api/watch-history')
        .send({ contentId: content.id, progress: 60, duration: 7200 });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/watch-history/:contentId', () => {
    it('should return saved progress', async () => {
      // Save progress first
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 500, duration: 7200 });

      const res = await request(app)
        .get(`/api/watch-history/${content.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.progress).toBe(500);
      expect(res.body.data.duration).toBe(7200);
    });

    it('should return null data for unwatched content', async () => {
      const res = await request(app)
        .get(`/api/watch-history/${content.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('should filter by episodeId query param', async () => {
      const episodeId = 'a0000000-0000-4000-8000-000000000002';

      // Save for episode
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, episodeId, progress: 200, duration: 3600 });

      // Get with episodeId
      const res = await request(app)
        .get(`/api/watch-history/${content.id}?episodeId=${episodeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.episodeId).toBe(episodeId);
      expect(res.body.data.progress).toBe(200);

      // Get without episodeId → null (different compound key)
      const res2 = await request(app)
        .get(`/api/watch-history/${content.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res2.body.data).toBeNull();
    });
  });

  // =============================================
  // 7.8 Continue Watching API
  // =============================================
  describe('GET /api/watch-history/continue', () => {
    it('should return items between 5% and 90% progress', async () => {
      // Create 3 watch records with different progress levels
      const content2 = await createTestContent();
      const content3 = await createTestContent();

      // 50% progress → should be included
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 3600, duration: 7200 });

      // 2% progress → should be excluded (< 5%)
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content2.id, progress: 14, duration: 7200 });

      // 95% progress → should be excluded (> 90%)
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content3.id, progress: 6840, duration: 7200 });

      const res = await request(app)
        .get('/api/watch-history/continue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].contentId).toBe(content.id);
      expect(res.body.data[0].progressPercent).toBe(50);
      expect(res.body.data[0].content).toBeDefined();
      expect(res.body.data[0].content.title).toBe('Test Movie for WH');
    });

    it('should include content details', async () => {
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 1000, duration: 7200 });

      const res = await request(app)
        .get('/api/watch-history/continue')
        .set('Authorization', `Bearer ${token}`);

      const item = res.body.data[0];
      expect(item.content.id).toBe(content.id);
      expect(item.content.type).toBe('MOVIE');
      expect(item.content.maturityRating).toBeDefined();
    });

    it('should order by most recently watched', async () => {
      const content2 = await createTestContent();

      // Watch content first
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 1000, duration: 7200 });

      // Watch content2 after (more recent)
      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content2.id, progress: 2000, duration: 7200 });

      const res = await request(app)
        .get('/api/watch-history/continue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].contentId).toBe(content2.id);
      expect(res.body.data[1].contentId).toBe(content.id);
    });

    it('should respect limit query param', async () => {
      const content2 = await createTestContent();

      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content.id, progress: 1000, duration: 7200 });

      await request(app)
        .post('/api/watch-history')
        .set('Authorization', `Bearer ${token}`)
        .send({ contentId: content2.id, progress: 2000, duration: 7200 });

      const res = await request(app)
        .get('/api/watch-history/continue?limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.body.data).toHaveLength(1);
    });

    it('should return empty array when no history', async () => {
      const res = await request(app)
        .get('/api/watch-history/continue')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
