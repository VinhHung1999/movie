import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  createTestGenres,
  createTestContent,
  linkContentToGenres,
} from './helpers/content.helper';

describe('GET /api/content/:id/similar', () => {
  let genres: Awaited<ReturnType<typeof createTestGenres>>;

  beforeEach(async () => {
    genres = await createTestGenres();
  });

  it('should return content sharing genres, excluding the target', async () => {
    // Movie A: Action + Drama
    const movieA = await createTestContent({ title: 'Movie A', viewCount: 100 });
    await linkContentToGenres(movieA.id, [genres[0].id, genres[1].id]);

    // Movie B: Action + Comedy (shares Action with A)
    const movieB = await createTestContent({ title: 'Movie B', viewCount: 200 });
    await linkContentToGenres(movieB.id, [genres[0].id, genres[2].id]);

    // Movie C: Drama + Sci-Fi (shares Drama with A)
    const movieC = await createTestContent({ title: 'Movie C', viewCount: 50 });
    await linkContentToGenres(movieC.id, [genres[1].id, genres[3].id]);

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(2);

    // Target should NOT be in results
    const ids = res.body.data.map((d: { id: string }) => d.id);
    expect(ids).not.toContain(movieA.id);
    expect(ids).toContain(movieB.id);
    expect(ids).toContain(movieC.id);
  });

  it('should order by genre overlap count DESC, then viewCount DESC', async () => {
    // Movie A: Action + Drama + Comedy
    const movieA = await createTestContent({ title: 'Movie A', viewCount: 100 });
    await linkContentToGenres(movieA.id, [genres[0].id, genres[1].id, genres[2].id]);

    // Movie B: Action + Drama (2 overlaps with A)
    const movieB = await createTestContent({ title: 'Movie B', viewCount: 50 });
    await linkContentToGenres(movieB.id, [genres[0].id, genres[1].id]);

    // Movie C: Action only (1 overlap with A), high viewCount
    const movieC = await createTestContent({ title: 'Movie C', viewCount: 9999 });
    await linkContentToGenres(movieC.id, [genres[0].id]);

    // Movie D: Action + Drama + Comedy (3 overlaps with A)
    const movieD = await createTestContent({ title: 'Movie D', viewCount: 10 });
    await linkContentToGenres(movieD.id, [genres[0].id, genres[1].id, genres[2].id]);

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);

    // D has 3 overlaps → first
    expect(res.body.data[0].id).toBe(movieD.id);
    // B has 2 overlaps → second
    expect(res.body.data[1].id).toBe(movieB.id);
    // C has 1 overlap → third (even though highest viewCount)
    expect(res.body.data[2].id).toBe(movieC.id);
  });

  it('should respect default limit of 12', async () => {
    const movieA = await createTestContent({ title: 'Movie A' });
    await linkContentToGenres(movieA.id, [genres[0].id]);

    // Create 15 movies sharing Action genre
    for (let i = 0; i < 15; i++) {
      const m = await createTestContent({ title: `Similar ${i}`, viewCount: i });
      await linkContentToGenres(m.id, [genres[0].id]);
    }

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(12);
  });

  it('should respect custom limit query param', async () => {
    const movieA = await createTestContent({ title: 'Movie A' });
    await linkContentToGenres(movieA.id, [genres[0].id]);

    for (let i = 0; i < 5; i++) {
      const m = await createTestContent({ title: `Similar ${i}` });
      await linkContentToGenres(m.id, [genres[0].id]);
    }

    const res = await request.get(`/api/content/${movieA.id}/similar?limit=3`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('should return empty array for content with no shared genres', async () => {
    // Movie A: Action
    const movieA = await createTestContent({ title: 'Movie A' });
    await linkContentToGenres(movieA.id, [genres[0].id]);

    // Movie B: Comedy (no overlap)
    const movieB = await createTestContent({ title: 'Movie B' });
    await linkContentToGenres(movieB.id, [genres[2].id]);

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return empty array for content with no genres', async () => {
    const movieA = await createTestContent({ title: 'Movie A' });
    // No genres linked

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  it('should return 404 for non-existent content ID', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request.get(`/api/content/${fakeId}/similar`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Content not found');
  });

  it('should return 400 for invalid UUID', async () => {
    const res = await request.get('/api/content/not-a-uuid/similar');

    expect(res.status).toBe(400);
  });

  it('should return 400 for limit out of range', async () => {
    const movieA = await createTestContent({ title: 'Movie A' });

    const res = await request.get(`/api/content/${movieA.id}/similar?limit=0`);
    expect(res.status).toBe(400);

    const res2 = await request.get(`/api/content/${movieA.id}/similar?limit=21`);
    expect(res2.status).toBe(400);
  });

  it('should return ContentSummary format with genres', async () => {
    const movieA = await createTestContent({ title: 'Movie A' });
    await linkContentToGenres(movieA.id, [genres[0].id]);

    const movieB = await createTestContent({ title: 'Movie B', viewCount: 500 });
    await linkContentToGenres(movieB.id, [genres[0].id]);

    const res = await request.get(`/api/content/${movieA.id}/similar`);

    expect(res.status).toBe(200);
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
    expect(item.genres).toBeInstanceOf(Array);
    expect(item.genres[0]).toHaveProperty('id');
    expect(item.genres[0]).toHaveProperty('name');
    expect(item.genres[0]).toHaveProperty('slug');
  });
});
