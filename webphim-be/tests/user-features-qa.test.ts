import { describe, it, expect, beforeEach } from 'vitest';
import { request, createTestContent } from './helpers/content.helper';
import { registerUser } from './helpers/auth.helper';
import prisma from '../src/config/database';

// ============================================
// QA: User Features Edge Cases (Task 10.8)
// ============================================

let token: string;
let userId: string;

async function getTokenAndUserId() {
  const res = await registerUser();
  const accessToken = res.body.data.accessToken as string;
  // Decode JWT to get userId (payload is base64url)
  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64url').toString(),
  );
  return { token: accessToken, userId: payload.userId as string };
}

describe('QA: Watchlist Edge Cases', () => {
  let contentId: string;

  beforeEach(async () => {
    const auth = await getTokenAndUserId();
    token = auth.token;
    userId = auth.userId;
    const content = await createTestContent({ title: 'QA Watchlist Movie' });
    contentId = content.id;
  });

  it('should return all ContentSummary fields in watchlist item', async () => {
    await request
      .post(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = res.body.data[0];
    expect(item).toHaveProperty('contentId');
    expect(item).toHaveProperty('addedAt');
    expect(item.content).toHaveProperty('id');
    expect(item.content).toHaveProperty('type');
    expect(item.content).toHaveProperty('title');
    expect(item.content).toHaveProperty('description');
    expect(item.content).toHaveProperty('releaseYear');
    expect(item.content).toHaveProperty('maturityRating');
    expect(item.content).toHaveProperty('duration');
    expect(item.content).toHaveProperty('thumbnailUrl');
    expect(item.content).toHaveProperty('bannerUrl');
    expect(item.content).toHaveProperty('viewCount');
    expect(item.content).toHaveProperty('genres');
    expect(Array.isArray(item.content.genres)).toBe(true);
  });

  it('should return empty data for page beyond total', async () => {
    await request
      .post(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get('/api/watchlist?page=100&limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
    expect(res.body.meta.total).toBe(1);
  });

  it('should check inWatchlist:false for valid UUID not in DB', async () => {
    const res = await request
      .get('/api/watchlist/check/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.inWatchlist).toBe(false);
  });

  it('add→remove→check cycle should return inWatchlist:false', async () => {
    await request
      .post(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);
    await request
      .delete(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get(`/api/watchlist/check/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.inWatchlist).toBe(false);
  });

  it('watchlist should order by addedAt DESC (most recent first)', async () => {
    const c1 = await createTestContent({ title: 'WL First Added' });
    const c2 = await createTestContent({ title: 'WL Second Added' });

    await request
      .post(`/api/watchlist/${c1.id}`)
      .set('Authorization', `Bearer ${token}`);
    // Small delay to ensure different timestamps
    await new Promise((r) => setTimeout(r, 50));
    await request
      .post(`/api/watchlist/${c2.id}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    // Most recent (c2) should be first
    expect(res.body.data[0].contentId).toBe(c2.id);
    expect(res.body.data[1].contentId).toBe(c1.id);
  });
});

describe('QA: Rating Edge Cases', () => {
  let contentId: string;

  beforeEach(async () => {
    const auth = await getTokenAndUserId();
    token = auth.token;
    userId = auth.userId;
    const content = await createTestContent({ title: 'QA Rating Movie' });
    contentId = content.id;
  });

  it('should reject non-integer score (1.5)', async () => {
    const res = await request
      .post(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 1.5 });

    expect(res.status).toBe(400);
  });

  it('should reject missing score field', async () => {
    const res = await request
      .post(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('rate→remove→get should return null', async () => {
    await request
      .post(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 1 });

    await request
      .delete(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    const res = await request
      .get(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  it('ratings list should paginate correctly', async () => {
    const c1 = await createTestContent({ title: 'Rate Page 1' });
    const c2 = await createTestContent({ title: 'Rate Page 2' });
    const c3 = await createTestContent({ title: 'Rate Page 3' });

    for (const c of [c1, c2, c3]) {
      await request
        .post(`/api/ratings/${c.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 1 });
    }

    const res = await request
      .get('/api/ratings?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(3);
    expect(res.body.meta.totalPages).toBe(2);
  });

  it('should reject negative score (-1)', async () => {
    const res = await request
      .post(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: -1 });

    expect(res.status).toBe(400);
  });
});

describe('QA: Profile Edge Cases', () => {
  beforeEach(async () => {
    const auth = await getTokenAndUserId();
    token = auth.token;
    userId = auth.userId;
  });

  it('should accept name at exactly 30 chars', async () => {
    const res = await request
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'A'.repeat(30) });

    expect(res.status).toBe(201);
    expect(res.body.data.name.length).toBe(30);
  });

  it('delete then re-create should work (back under limit)', async () => {
    // Auto-created = 1, add 4 more = 5 total
    for (let i = 2; i <= 5; i++) {
      await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: `Profile ${i}` });
    }

    // At limit — 6th should fail
    const failRes = await request
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Too Many' });
    expect(failRes.status).toBe(409);

    // Delete one
    const listRes = await request
      .get('/api/profiles')
      .set('Authorization', `Bearer ${token}`);
    const lastProfileId = listRes.body.data[4].id;
    await request
      .delete(`/api/profiles/${lastProfileId}`)
      .set('Authorization', `Bearer ${token}`);

    // Now can create again
    const okRes = await request
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Replacement' });
    expect(okRes.status).toBe(201);
  });

  it('partial update should preserve unchanged fields', async () => {
    // Create a profile with known values
    const createRes = await request
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Original', avatarUrl: '/images/avatars/avatar-1.png', isKids: true });

    const profileId = createRes.body.data.id;

    // Update only name
    const updateRes = await request
      .put(`/api/profiles/${profileId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Updated');
    expect(updateRes.body.data.avatarUrl).toBe('/images/avatars/avatar-1.png');
    expect(updateRes.body.data.isKids).toBe(true);
  });

  it('profile data shape should have exactly the expected fields', async () => {
    const res = await request
      .get('/api/profiles')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const profile = res.body.data[0];
    const keys = Object.keys(profile).sort();
    expect(keys).toEqual(['avatarUrl', 'createdAt', 'id', 'isKids', 'name']);
  });
});

describe('QA: Continue Watching — Boundary Filter', () => {
  beforeEach(async () => {
    const auth = await getTokenAndUserId();
    token = auth.token;
    userId = auth.userId;
  });

  it('should exclude progress at exactly 5% (boundary)', async () => {
    const content = await createTestContent({ title: 'CW 5% Boundary' });

    // Create watch history at exactly 5% (progress=50, duration=1000)
    await prisma.watchHistory.create({
      data: {
        userId,
        contentId: content.id,
        progress: 50,
        duration: 1000,
      },
    });

    const res = await request
      .get('/api/watch-history/continue?limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: { contentId: string }) => d.contentId);
    expect(ids).not.toContain(content.id);
  });

  it('should exclude progress at exactly 90% (boundary)', async () => {
    const content = await createTestContent({ title: 'CW 90% Boundary' });

    // Create watch history at exactly 90% (progress=900, duration=1000)
    await prisma.watchHistory.create({
      data: {
        userId,
        contentId: content.id,
        progress: 900,
        duration: 1000,
      },
    });

    const res = await request
      .get('/api/watch-history/continue?limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: { contentId: string }) => d.contentId);
    expect(ids).not.toContain(content.id);
  });

  it('should include progress at 6% (just above lower boundary)', async () => {
    const content = await createTestContent({ title: 'CW 6% Include' });

    await prisma.watchHistory.create({
      data: {
        userId,
        contentId: content.id,
        progress: 60,
        duration: 1000,
      },
    });

    const res = await request
      .get('/api/watch-history/continue?limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: { contentId: string }) => d.contentId);
    expect(ids).toContain(content.id);
  });

  it('should include progress at 89% (just below upper boundary)', async () => {
    const content = await createTestContent({ title: 'CW 89% Include' });

    await prisma.watchHistory.create({
      data: {
        userId,
        contentId: content.id,
        progress: 890,
        duration: 1000,
      },
    });

    const res = await request
      .get('/api/watch-history/continue?limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const ids = res.body.data.map((d: { contentId: string }) => d.contentId);
    expect(ids).toContain(content.id);
  });

  it('should return progressPercent correctly calculated', async () => {
    const content = await createTestContent({ title: 'CW Percent Check' });

    await prisma.watchHistory.create({
      data: {
        userId,
        contentId: content.id,
        progress: 450,
        duration: 1000,
      },
    });

    const res = await request
      .get('/api/watch-history/continue?limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const item = res.body.data.find(
      (d: { contentId: string }) => d.contentId === content.id,
    );
    expect(item).toBeDefined();
    expect(item.progressPercent).toBe(45);
  });
});

describe('QA: Cross-Endpoint Consistency', () => {
  let contentId: string;

  beforeEach(async () => {
    const auth = await getTokenAndUserId();
    token = auth.token;
    userId = auth.userId;
    const content = await createTestContent({
      title: 'Cross Check Movie',
      description: 'For cross-endpoint QA',
      releaseYear: 2024,
    });
    contentId = content.id;
  });

  it('watchlist content should match content detail endpoint', async () => {
    await request
      .post(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    const wlRes = await request
      .get('/api/watchlist')
      .set('Authorization', `Bearer ${token}`);

    const detailRes = await request.get(`/api/content/${contentId}`);

    expect(wlRes.status).toBe(200);
    expect(detailRes.status).toBe(200);

    const wlContent = wlRes.body.data[0].content;
    const detailContent = detailRes.body.data;

    expect(wlContent.id).toBe(detailContent.id);
    expect(wlContent.title).toBe(detailContent.title);
    expect(wlContent.type).toBe(detailContent.type);
    expect(wlContent.releaseYear).toBe(detailContent.releaseYear);
  });

  it('rating should persist after watchlist toggle', async () => {
    // Rate thumbs up
    await request
      .post(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ score: 1 });

    // Add to watchlist
    await request
      .post(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    // Remove from watchlist
    await request
      .delete(`/api/watchlist/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    // Rating should still exist
    const res = await request
      .get(`/api/ratings/${contentId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.score).toBe(1);
  });

  it('profile data round-trip: create → get → matches', async () => {
    const createRes = await request
      .post('/api/profiles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Round Trip', isKids: true });

    expect(createRes.status).toBe(201);
    const created = createRes.body.data;

    const listRes = await request
      .get('/api/profiles')
      .set('Authorization', `Bearer ${token}`);

    const found = listRes.body.data.find(
      (p: { id: string }) => p.id === created.id,
    );

    expect(found).toBeDefined();
    expect(found.name).toBe('Round Trip');
    expect(found.isKids).toBe(true);
  });
});
