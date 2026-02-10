import supertest from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';

export const request = supertest(app);

// Test genre data
export const testGenres = [
  { name: 'Action', slug: 'action' },
  { name: 'Drama', slug: 'drama' },
  { name: 'Comedy', slug: 'comedy' },
  { name: 'Sci-Fi', slug: 'sci-fi' },
];

// Test movie data
export const testMovie = {
  type: 'MOVIE' as const,
  title: 'Test Movie',
  description: 'A test movie description for QA testing.',
  releaseYear: 2024,
  maturityRating: 'PG13' as const,
  duration: 120,
  thumbnailUrl: '/images/test-movie-thumb.jpg',
  bannerUrl: '/images/test-movie-banner.jpg',
  trailerUrl: '/videos/test-movie-trailer.mp4',
  viewCount: 1000,
};

// Test series data
export const testSeries = {
  type: 'SERIES' as const,
  title: 'Test Series',
  description: 'A test series description for QA testing.',
  releaseYear: 2023,
  maturityRating: 'R' as const,
  duration: null,
  thumbnailUrl: '/images/test-series-thumb.jpg',
  bannerUrl: '/images/test-series-banner.jpg',
  viewCount: 5000,
};

// Test cast data
export const testCast = [
  { name: 'Test Actor', photoUrl: '/images/actor.jpg' },
  { name: 'Test Director', photoUrl: '/images/director.jpg' },
];

/**
 * Create test genres and return created records
 */
export async function createTestGenres(genres = testGenres) {
  const created = [];
  for (const genre of genres) {
    const g = await prisma.genre.create({ data: genre });
    created.push(g);
  }
  return created;
}

/**
 * Create a test content (movie by default) and return created record
 */
export async function createTestContent(overrides: Record<string, unknown> = {}) {
  const data = { ...testMovie, ...overrides };
  return prisma.content.create({ data });
}

/**
 * Create a test series with seasons and episodes
 */
export async function createTestSeriesWithEpisodes() {
  const series = await prisma.content.create({ data: testSeries });

  const season = await prisma.season.create({
    data: {
      contentId: series.id,
      seasonNumber: 1,
      title: 'Season 1',
    },
  });

  const episodes = [];
  for (let i = 1; i <= 3; i++) {
    const ep = await prisma.episode.create({
      data: {
        seasonId: season.id,
        episodeNumber: i,
        title: `Episode ${i}`,
        description: `Description for episode ${i}`,
        duration: 45 + i,
      },
    });
    episodes.push(ep);
  }

  return { series, season, episodes };
}

/**
 * Create test cast/crew and link to content
 */
export async function createTestCastForContent(contentId: string) {
  const actor = await prisma.castCrew.create({
    data: { name: testCast[0].name, photoUrl: testCast[0].photoUrl },
  });
  const director = await prisma.castCrew.create({
    data: { name: testCast[1].name, photoUrl: testCast[1].photoUrl },
  });

  await prisma.contentCastCrew.create({
    data: {
      contentId,
      castCrewId: actor.id,
      role: 'ACTOR',
      character: 'Main Character',
      displayOrder: 0,
    },
  });
  await prisma.contentCastCrew.create({
    data: {
      contentId,
      castCrewId: director.id,
      role: 'DIRECTOR',
      displayOrder: 1,
    },
  });

  return { actor, director };
}

/**
 * Link content to genres
 */
export async function linkContentToGenres(contentId: string, genreIds: string[]) {
  for (const genreId of genreIds) {
    await prisma.contentGenre.create({
      data: { contentId, genreId },
    });
  }
}

/**
 * Seed full test data: genres + movies + series + cast
 * Returns all created entities for assertions
 */
export async function seedTestData() {
  const genres = await createTestGenres();
  const movie = await createTestContent();
  const { series, season, episodes } = await createTestSeriesWithEpisodes();

  // Link movie to Action + Drama
  await linkContentToGenres(movie.id, [genres[0].id, genres[1].id]);
  // Link series to Drama + Sci-Fi
  await linkContentToGenres(series.id, [genres[1].id, genres[3].id]);

  // Add cast to movie
  const { actor, director } = await createTestCastForContent(movie.id);

  return {
    genres,
    movie,
    series,
    season,
    episodes,
    actor,
    director,
  };
}
