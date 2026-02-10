import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  createTestGenres,
  createTestContent,
  linkContentToGenres,
  testSeries,
} from './helpers/content.helper';

describe('QA: GET /api/content/:id/similar', () => {
  let genres: Awaited<ReturnType<typeof createTestGenres>>;

  beforeEach(async () => {
    genres = await createTestGenres();
  });

  it('should sort by viewCount DESC when overlap count is the same', async () => {
    // Target: Action
    const target = await createTestContent({ title: 'Target', viewCount: 100 });
    await linkContentToGenres(target.id, [genres[0].id]);

    // All share 1 genre (Action) — should sort by viewCount DESC
    const low = await createTestContent({ title: 'Low Views', viewCount: 10 });
    await linkContentToGenres(low.id, [genres[0].id]);

    const high = await createTestContent({ title: 'High Views', viewCount: 9000 });
    await linkContentToGenres(high.id, [genres[0].id]);

    const mid = await createTestContent({ title: 'Mid Views', viewCount: 500 });
    await linkContentToGenres(mid.id, [genres[0].id]);

    const res = await request.get(`/api/content/${target.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
    expect(res.body.data[0].id).toBe(high.id);
    expect(res.body.data[1].id).toBe(mid.id);
    expect(res.body.data[2].id).toBe(low.id);
  });

  it('should include both MOVIE and SERIES types in results', async () => {
    const movie = await createTestContent({ title: 'Target Movie', viewCount: 100 });
    await linkContentToGenres(movie.id, [genres[0].id]);

    const similarMovie = await createTestContent({ title: 'Similar Movie', viewCount: 200 });
    await linkContentToGenres(similarMovie.id, [genres[0].id]);

    const similarSeries = await createTestContent({
      ...testSeries,
      title: 'Similar Series',
      viewCount: 300,
    });
    await linkContentToGenres(similarSeries.id, [genres[0].id]);

    const res = await request.get(`/api/content/${movie.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);

    const types = res.body.data.map((d: { type: string }) => d.type);
    expect(types).toContain('MOVIE');
    expect(types).toContain('SERIES');
  });

  it('should work with limit=1 (minimum boundary)', async () => {
    const target = await createTestContent({ title: 'Target' });
    await linkContentToGenres(target.id, [genres[0].id]);

    for (let i = 0; i < 5; i++) {
      const m = await createTestContent({ title: `Similar ${i}` });
      await linkContentToGenres(m.id, [genres[0].id]);
    }

    const res = await request.get(`/api/content/${target.id}/similar?limit=1`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('should work with limit=20 (maximum boundary)', async () => {
    const target = await createTestContent({ title: 'Target' });
    await linkContentToGenres(target.id, [genres[0].id]);

    for (let i = 0; i < 25; i++) {
      const m = await createTestContent({ title: `Similar ${i}`, viewCount: i });
      await linkContentToGenres(m.id, [genres[0].id]);
    }

    const res = await request.get(`/api/content/${target.id}/similar?limit=20`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(20);
  });

  it('should return all genre-sharing content when target has all genres', async () => {
    // Target has all 4 genres
    const target = await createTestContent({ title: 'Target All Genres' });
    await linkContentToGenres(target.id, genres.map((g) => g.id));

    // Each other content has 1 genre — all should appear as similar
    const others = [];
    for (let i = 0; i < 4; i++) {
      const m = await createTestContent({ title: `Other ${i}`, viewCount: (i + 1) * 100 });
      await linkContentToGenres(m.id, [genres[i].id]);
      others.push(m);
    }

    const res = await request.get(`/api/content/${target.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(4);

    const ids = res.body.data.map((d: { id: string }) => d.id);
    for (const other of others) {
      expect(ids).toContain(other.id);
    }
  });

  it('should not include genres of non-overlapping content in response', async () => {
    // Target: Action
    const target = await createTestContent({ title: 'Target' });
    await linkContentToGenres(target.id, [genres[0].id]);

    // Similar: Action + Comedy
    const similar = await createTestContent({ title: 'Similar' });
    await linkContentToGenres(similar.id, [genres[0].id, genres[2].id]);

    const res = await request.get(`/api/content/${target.id}/similar`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    // Verify the similar content's full genres are returned (not just overlapping ones)
    const item = res.body.data[0];
    expect(item.genres.length).toBe(2);
    const genreNames = item.genres.map((g: { name: string }) => g.name);
    expect(genreNames).toContain('Action');
    expect(genreNames).toContain('Comedy');
  });
});
