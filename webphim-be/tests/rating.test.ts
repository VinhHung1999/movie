import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestContent } from './helpers/content.helper';
import { registerUser } from './helpers/auth.helper';

let token: string;
let contentId: string;

async function getToken() {
  const res = await registerUser();
  return res.body.data.accessToken as string;
}

describe('Ratings API (Task 10.2)', () => {
  beforeEach(async () => {
    token = await getToken();
    const content = await createTestContent({ title: 'Test Movie for Rating' });
    contentId = content.id;
  });

  describe('POST /api/ratings/:contentId — Rate content', () => {
    it('should rate thumbs up (score 1)', async () => {
      const res = await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contentId).toBe(contentId);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.updatedAt).toBeDefined();
    });

    it('should rate thumbs down (score 2)', async () => {
      const res = await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(2);
    });

    it('should upsert — change rating from up to down', async () => {
      await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      const res = await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 2 });

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(2);
    });

    it('should reject invalid score (0)', async () => {
      const res = await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 0 });

      expect(res.status).toBe(400);
    });

    it('should reject invalid score (3)', async () => {
      const res = await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 3 });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request
        .post('/api/ratings/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request
        .post(`/api/ratings/${contentId}`)
        .send({ score: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/ratings/:contentId — Remove rating', () => {
    it('should remove existing rating', async () => {
      await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      const res = await request
        .delete(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);
    });

    it('should be idempotent — removing non-existent returns success', async () => {
      const res = await request
        .delete(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);
    });
  });

  describe('GET /api/ratings/:contentId — Get rating', () => {
    it('should return rating when exists', async () => {
      await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      const res = await request
        .get(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.contentId).toBe(contentId);
    });

    it('should return null when no rating', async () => {
      const res = await request
        .get(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe('GET /api/ratings — Get all ratings', () => {
    it('should return empty list initially', async () => {
      const res = await request
        .get('/api/ratings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('should return rated content with details', async () => {
      await request
        .post(`/api/ratings/${contentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });

      const res = await request
        .get('/api/ratings')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].score).toBe(1);
      expect(res.body.data[0].content).toBeDefined();
      expect(res.body.data[0].content.title).toBe('Test Movie for Rating');
    });
  });
});
