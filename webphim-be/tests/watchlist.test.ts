import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestContent } from './helpers/content.helper';
import { registerUser, validUser } from './helpers/auth.helper';

let token: string;
let contentId: string;

async function getToken() {
  const res = await registerUser();
  return res.body.data.accessToken as string;
}

describe('Watchlist API (Task 10.1)', () => {
  beforeEach(async () => {
    token = await getToken();
    const content = await createTestContent({ title: 'Test Movie for Watchlist' });
    contentId = content.id;
  });

  describe('POST /api/watchlist/:contentId — Add to watchlist', () => {
    it('should add content to watchlist', async () => {
      const res = await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contentId).toBe(contentId);
      expect(res.body.data.addedAt).toBeDefined();
    });

    it('should be idempotent — adding twice returns existing record', async () => {
      await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(201);
      expect(res.body.data.contentId).toBe(contentId);
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request
        .post('/api/watchlist/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const res = await request.post(`/api/watchlist/${contentId}`);

      expect(res.status).toBe(401);
    });

    it('should reject invalid UUID', async () => {
      const res = await request
        .post('/api/watchlist/not-a-uuid')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/watchlist/:contentId — Remove from watchlist', () => {
    it('should remove content from watchlist', async () => {
      await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request
        .delete(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.removed).toBe(true);
    });

    it('should be idempotent — removing non-existent returns success', async () => {
      const res = await request
        .delete(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);
    });
  });

  describe('GET /api/watchlist/check/:contentId — Check watchlist', () => {
    it('should return inWatchlist: true when in watchlist', async () => {
      await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request
        .get(`/api/watchlist/check/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inWatchlist).toBe(true);
    });

    it('should return inWatchlist: false when not in watchlist', async () => {
      const res = await request
        .get(`/api/watchlist/check/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.inWatchlist).toBe(false);
    });
  });

  describe('GET /api/watchlist — Get user watchlist', () => {
    it('should return empty watchlist initially', async () => {
      const res = await request
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });

    it('should return watchlist with content details', async () => {
      await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].contentId).toBe(contentId);
      expect(res.body.data[0].content).toBeDefined();
      expect(res.body.data[0].content.title).toBe('Test Movie for Watchlist');
      expect(res.body.data[0].content.genres).toBeDefined();
    });

    it('should paginate correctly', async () => {
      const c1 = await createTestContent({ title: 'WL Movie 1' });
      const c2 = await createTestContent({ title: 'WL Movie 2' });
      const c3 = await createTestContent({ title: 'WL Movie 3' });

      for (const c of [c1, c2, c3]) {
        await request
          .post(`/api/watchlist/${c.id}`)
          .set('Authorization', `Bearer ${token}`);
      }

      const res = await request
        .get('/api/watchlist?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    it('should not show other user watchlist items', async () => {
      await request
        .post(`/api/watchlist/${contentId}`)
        .set('Authorization', `Bearer ${token}`);

      // Register second user
      const res2 = await registerUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123',
      });
      const token2 = res2.body.data.accessToken;

      const res = await request
        .get('/api/watchlist')
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(0);
    });
  });
});
