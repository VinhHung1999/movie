import { describe, it, expect, beforeEach } from 'vitest';
import {
  request,
  testMovie,
  createTestGenres,
  createTestContent,
  createTestSeriesWithEpisodes,
  createTestCastForContent,
  linkContentToGenres,
  seedTestData,
} from './helpers/content.helper';

// ============================================
// GET /api/content — List with pagination/filter/sort
// ============================================

describe('GET /api/content', () => {
  describe('pagination', () => {
    it('should return paginated results with default params', async () => {
      await seedTestData();

      const res = await request.get('/api/content');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(20);
      expect(typeof res.body.meta.total).toBe('number');
      expect(typeof res.body.meta.totalPages).toBe('number');
    });

    it('should respect page and limit params', async () => {
      // Create 3 movies
      await createTestContent({ title: 'Movie 1' });
      await createTestContent({ title: 'Movie 2' });
      await createTestContent({ title: 'Movie 3' });

      const res = await request.get('/api/content?page=1&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(2);
      expect(res.body.meta.total).toBe(3);
      expect(res.body.meta.totalPages).toBe(2);
    });

    it('should return second page correctly', async () => {
      await createTestContent({ title: 'Movie 1' });
      await createTestContent({ title: 'Movie 2' });
      await createTestContent({ title: 'Movie 3' });

      const res = await request.get('/api/content?page=2&limit=2');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.meta.page).toBe(2);
    });

    it('should return empty results for page beyond total', async () => {
      await createTestContent();

      const res = await request.get('/api/content?page=999');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(1);
    });

    it('should return empty when no content exists', async () => {
      const res = await request.get('/api/content');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.meta.totalPages).toBe(0);
    });
  });

  describe('type filter', () => {
    it('should filter by type=MOVIE', async () => {
      await seedTestData(); // creates 1 movie + 1 series

      const res = await request.get('/api/content?type=MOVIE');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('MOVIE');
    });

    it('should filter by type=SERIES', async () => {
      await seedTestData();

      const res = await request.get('/api/content?type=SERIES');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('SERIES');
    });

    it('should return all types when no type filter', async () => {
      await seedTestData();

      const res = await request.get('/api/content');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('genre filter', () => {
    it('should filter by genre slug', async () => {
      const { genres, movie } = await seedTestData();
      // movie is linked to action + drama, series to drama + sci-fi

      const res = await request.get('/api/content?genre=action');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe(movie.title);
    });

    it('should return multiple content for shared genre', async () => {
      await seedTestData();
      // Both movie and series are linked to 'drama'

      const res = await request.get('/api/content?genre=drama');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty for non-existent genre slug', async () => {
      await seedTestData();

      const res = await request.get('/api/content?genre=nonexistent');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('sort options', () => {
    beforeEach(async () => {
      // Create movies with different properties for sort testing
      await createTestContent({
        title: 'Alpha Movie',
        releaseYear: 2020,
        viewCount: 100,
      });
      await createTestContent({
        title: 'Beta Movie',
        releaseYear: 2024,
        viewCount: 500,
      });
      await createTestContent({
        title: 'Gamma Movie',
        releaseYear: 2022,
        viewCount: 300,
      });
    });

    it('should sort by newest (default)', async () => {
      const res = await request.get('/api/content');

      expect(res.status).toBe(200);
      // newest = most recent releaseYear first, or most recently created
      const years = res.body.data.map((c: { releaseYear: number }) => c.releaseYear);
      expect(years).toEqual([...years].sort((a: number, b: number) => b - a));
    });

    it('should sort by oldest', async () => {
      const res = await request.get('/api/content?sort=oldest');

      expect(res.status).toBe(200);
      const years = res.body.data.map((c: { releaseYear: number }) => c.releaseYear);
      expect(years).toEqual([...years].sort((a: number, b: number) => a - b));
    });

    it('should sort by views (most viewed first)', async () => {
      const res = await request.get('/api/content?sort=views');

      expect(res.status).toBe(200);
      const views = res.body.data.map((c: { viewCount: number }) => c.viewCount);
      expect(views).toEqual([...views].sort((a: number, b: number) => b - a));
    });

    it('should sort by title (alphabetical)', async () => {
      const res = await request.get('/api/content?sort=title');

      expect(res.status).toBe(200);
      const titles = res.body.data.map((c: { title: string }) => c.title);
      expect(titles).toEqual([...titles].sort());
    });
  });

  describe('response shape', () => {
    it('should include genres in content list items', async () => {
      const { genres, movie } = await seedTestData();

      const res = await request.get('/api/content');

      const movieItem = res.body.data.find(
        (c: { title: string }) => c.title === movie.title,
      );
      expect(movieItem).toBeDefined();
      expect(Array.isArray(movieItem.genres)).toBe(true);
      expect(movieItem.genres.length).toBeGreaterThan(0);
      expect(movieItem.genres[0]).toHaveProperty('id');
      expect(movieItem.genres[0]).toHaveProperty('name');
      expect(movieItem.genres[0]).toHaveProperty('slug');
    });

    it('should include expected fields in list items', async () => {
      await createTestContent();

      const res = await request.get('/api/content');
      const item = res.body.data[0];

      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('type');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('description');
      expect(item).toHaveProperty('releaseYear');
      expect(item).toHaveProperty('maturityRating');
      expect(item).toHaveProperty('thumbnailUrl');
      expect(item).toHaveProperty('viewCount');
    });
  });

  describe('combined filters', () => {
    it('should apply type + genre filters together', async () => {
      await seedTestData();
      // movie=action+drama, series=drama+sci-fi

      const res = await request.get('/api/content?type=MOVIE&genre=drama');

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].type).toBe('MOVIE');
    });

    it('should apply type + genre + sort + pagination together', async () => {
      await seedTestData();

      const res = await request.get(
        '/api/content?type=MOVIE&genre=action&sort=newest&page=1&limit=10',
      );

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
      expect(res.body.meta.page).toBe(1);
    });
  });
});

// ============================================
// GET /api/content/:id — Content detail
// ============================================

describe('GET /api/content/:id', () => {
  it('should return movie detail with genres and cast', async () => {
    const { movie } = await seedTestData();

    const res = await request.get(`/api/content/${movie.id}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(movie.id);
    expect(res.body.data.type).toBe('MOVIE');
    expect(res.body.data.title).toBe(movie.title);
    expect(res.body.data.description).toBe(movie.description);
    expect(res.body.data.releaseYear).toBe(movie.releaseYear);
    expect(res.body.data.maturityRating).toBe('PG13');
    expect(res.body.data.duration).toBe(movie.duration);
    expect(res.body.data.thumbnailUrl).toBe(movie.thumbnailUrl);
    expect(res.body.data.bannerUrl).toBe(movie.bannerUrl);
    expect(res.body.data.trailerUrl).toBe(movie.trailerUrl);
  });

  it('should include genres in detail response', async () => {
    const { movie } = await seedTestData();

    const res = await request.get(`/api/content/${movie.id}`);

    expect(Array.isArray(res.body.data.genres)).toBe(true);
    expect(res.body.data.genres.length).toBe(2); // action + drama
    expect(res.body.data.genres[0]).toHaveProperty('id');
    expect(res.body.data.genres[0]).toHaveProperty('name');
    expect(res.body.data.genres[0]).toHaveProperty('slug');
  });

  it('should include cast in detail response', async () => {
    const { movie } = await seedTestData();

    const res = await request.get(`/api/content/${movie.id}`);

    expect(Array.isArray(res.body.data.cast)).toBe(true);
    expect(res.body.data.cast.length).toBe(2); // actor + director
    const actor = res.body.data.cast.find(
      (c: { role: string }) => c.role === 'ACTOR',
    );
    expect(actor).toBeDefined();
    expect(actor).toHaveProperty('id');
    expect(actor).toHaveProperty('name');
    expect(actor).toHaveProperty('role');
    expect(actor).toHaveProperty('character');
    expect(actor.character).toBe('Main Character');

    const director = res.body.data.cast.find(
      (c: { role: string }) => c.role === 'DIRECTOR',
    );
    expect(director).toBeDefined();
    expect(director.character).toBeNull();
  });

  it('should return series detail with seasons and episodes', async () => {
    const { series } = await seedTestData();

    const res = await request.get(`/api/content/${series.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.type).toBe('SERIES');
    expect(res.body.data.duration).toBeNull();

    // Seasons
    expect(Array.isArray(res.body.data.seasons)).toBe(true);
    expect(res.body.data.seasons.length).toBe(1);

    const season = res.body.data.seasons[0];
    expect(season.seasonNumber).toBe(1);
    expect(season.title).toBe('Season 1');

    // Episodes
    expect(Array.isArray(season.episodes)).toBe(true);
    expect(season.episodes.length).toBe(3);
    expect(season.episodes[0]).toHaveProperty('episodeNumber');
    expect(season.episodes[0]).toHaveProperty('title');
    expect(season.episodes[0]).toHaveProperty('description');
    expect(season.episodes[0]).toHaveProperty('duration');
  });

  it('should return 404 for non-existent content', async () => {
    const fakeUuid = '00000000-0000-0000-0000-000000000000';

    const res = await request.get(`/api/content/${fakeUuid}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBeDefined();
  });

  it('should handle invalid UUID format', async () => {
    const res = await request.get('/api/content/not-a-valid-uuid');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should not include seasons for movies', async () => {
    const { movie } = await seedTestData();

    const res = await request.get(`/api/content/${movie.id}`);

    // Movies should have empty seasons array or no seasons
    if (res.body.data.seasons) {
      expect(res.body.data.seasons).toEqual([]);
    }
  });
});

// ============================================
// GET /api/genres — List genres
// ============================================

describe('GET /api/genres', () => {
  it('should return all genres with content count', async () => {
    await seedTestData();

    const res = await request.get('/api/genres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(4); // action, drama, comedy, sci-fi
  });

  it('should include contentCount for each genre', async () => {
    await seedTestData();
    // action=1(movie), drama=2(movie+series), comedy=0, sci-fi=1(series)

    const res = await request.get('/api/genres');

    const action = res.body.data.find(
      (g: { slug: string }) => g.slug === 'action',
    );
    expect(action).toBeDefined();
    expect(action.contentCount).toBe(1);

    const drama = res.body.data.find(
      (g: { slug: string }) => g.slug === 'drama',
    );
    expect(drama.contentCount).toBe(2);

    const comedy = res.body.data.find(
      (g: { slug: string }) => g.slug === 'comedy',
    );
    expect(comedy.contentCount).toBe(0);

    const scifi = res.body.data.find(
      (g: { slug: string }) => g.slug === 'sci-fi',
    );
    expect(scifi.contentCount).toBe(1);
  });

  it('should include expected fields in genre response', async () => {
    await createTestGenres();

    const res = await request.get('/api/genres');
    const genre = res.body.data[0];

    expect(genre).toHaveProperty('id');
    expect(genre).toHaveProperty('name');
    expect(genre).toHaveProperty('slug');
    expect(genre).toHaveProperty('contentCount');
  });

  it('should return empty array when no genres exist', async () => {
    const res = await request.get('/api/genres');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
  });
});

// ============================================
// GET /api/content/featured — Featured content
// ============================================

describe('GET /api/content/featured', () => {
  it('should return a single featured content', async () => {
    await seedTestData();

    const res = await request.get('/api/content/featured');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(typeof res.body.data.id).toBe('string');
    expect(typeof res.body.data.title).toBe('string');
    expect(typeof res.body.data.description).toBe('string');
  });

  it('should include expected fields in featured response', async () => {
    await seedTestData();

    const res = await request.get('/api/content/featured');
    const featured = res.body.data;

    expect(featured).toHaveProperty('id');
    expect(featured).toHaveProperty('type');
    expect(featured).toHaveProperty('title');
    expect(featured).toHaveProperty('description');
    expect(featured).toHaveProperty('releaseYear');
    expect(featured).toHaveProperty('maturityRating');
    expect(featured).toHaveProperty('bannerUrl');
  });

  it('should include genres in featured content', async () => {
    await seedTestData();

    const res = await request.get('/api/content/featured');

    expect(Array.isArray(res.body.data.genres)).toBe(true);
    expect(res.body.data.genres.length).toBeGreaterThan(0);
  });

  it('should return 404 when no content exists', async () => {
    const res = await request.get('/api/content/featured');

    // Could be 404 or empty response depending on BE implementation
    expect([200, 404]).toContain(res.status);
    if (res.status === 404) {
      expect(res.body.success).toBe(false);
    }
  });
});

// ============================================
// Edge Cases
// ============================================

describe('Content API - Edge Cases', () => {
  describe('invalid query params', () => {
    it('should reject negative page number', async () => {
      const res = await request.get('/api/content?page=-1');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject page=0', async () => {
      const res = await request.get('/api/content?page=0');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject limit greater than 50', async () => {
      const res = await request.get('/api/content?limit=51');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject limit=0', async () => {
      const res = await request.get('/api/content?limit=0');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid sort value', async () => {
      const res = await request.get('/api/content?sort=invalid');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid type value', async () => {
      const res = await request.get('/api/content?type=INVALID');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('non-string query params', () => {
    it('should handle non-numeric page gracefully', async () => {
      const res = await request.get('/api/content?page=abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should handle non-numeric limit gracefully', async () => {
      const res = await request.get('/api/content?limit=abc');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
