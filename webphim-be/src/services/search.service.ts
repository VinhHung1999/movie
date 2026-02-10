import prisma from '../config/database';
import { Prisma } from '@prisma/client';
import { SearchQuery } from '../validations/search.validation';

interface ContentRow {
  id: string;
  type: string;
  title: string;
  description: string;
  release_year: number;
  maturity_rating: string;
  duration: number | null;
  thumbnail_url: string | null;
  banner_url: string | null;
  view_count: number;
  rank: number;
}

export const searchService = {
  async search(query: SearchQuery) {
    const { q, page, limit, type, genre, yearFrom, yearTo, sort } = query;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE fragments
    const typeFilter = type
      ? Prisma.sql`AND c.type = ${type}::"ContentType"`
      : Prisma.empty;
    const genreFilter = genre
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM content_genres cg
          JOIN genres g ON g.id = cg.genre_id
          WHERE cg.content_id = c.id AND g.slug = ${genre}
        )`
      : Prisma.empty;
    const yearFromFilter = yearFrom
      ? Prisma.sql`AND c.release_year >= ${yearFrom}`
      : Prisma.empty;
    const yearToFilter = yearTo
      ? Prisma.sql`AND c.release_year <= ${yearTo}`
      : Prisma.empty;

    // Build ORDER BY
    let orderBy: Prisma.Sql;
    switch (sort) {
      case 'newest':
        orderBy = Prisma.sql`c.release_year DESC, c.title ASC`;
        break;
      case 'oldest':
        orderBy = Prisma.sql`c.release_year ASC, c.title ASC`;
        break;
      case 'views':
        orderBy = Prisma.sql`c.view_count DESC, c.title ASC`;
        break;
      case 'title':
        orderBy = Prisma.sql`c.title ASC`;
        break;
      default:
        orderBy = Prisma.sql`rank DESC, c.view_count DESC`;
        break;
    }

    // Main search query
    const results = await prisma.$queryRaw<ContentRow[]>`
      SELECT c.id, c.type, c.title, c.description,
             c.release_year::int, c.maturity_rating,
             c.duration::int, c.thumbnail_url, c.banner_url,
             c.view_count::int,
             ts_rank(c.search_vector, websearch_to_tsquery('english', ${q}))::float as rank
      FROM content c
      WHERE c.search_vector @@ websearch_to_tsquery('english', ${q})
        ${typeFilter}
        ${genreFilter}
        ${yearFromFilter}
        ${yearToFilter}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count query
    const countResult = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*)::bigint as count
      FROM content c
      WHERE c.search_vector @@ websearch_to_tsquery('english', ${q})
        ${typeFilter}
        ${genreFilter}
        ${yearFromFilter}
        ${yearToFilter}
    `;
    const total = Number(countResult[0].count);

    // Fetch genres for results
    const contentIds = results.map((r) => r.id);
    const genreRecords =
      contentIds.length > 0
        ? await prisma.contentGenre.findMany({
            where: { contentId: { in: contentIds } },
            include: {
              genre: { select: { id: true, name: true, slug: true } },
            },
          })
        : [];

    // Build genre map
    const genreMap = new Map<
      string,
      { id: string; name: string; slug: string }[]
    >();
    for (const cg of genreRecords) {
      const existing = genreMap.get(cg.contentId) || [];
      existing.push(cg.genre);
      genreMap.set(cg.contentId, existing);
    }

    // Map to response format (snake_case -> camelCase)
    const data = results.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description,
      releaseYear: row.release_year,
      maturityRating: row.maturity_rating,
      duration: row.duration,
      thumbnailUrl: row.thumbnail_url,
      bannerUrl: row.banner_url,
      viewCount: row.view_count,
      genres: genreMap.get(row.id) || [],
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        query: q,
      },
    };
  },

  async suggestions(q: string) {
    const suggestions = await prisma.content.findMany({
      where: {
        title: { contains: q, mode: 'insensitive' },
      },
      select: {
        id: true,
        title: true,
        type: true,
        thumbnailUrl: true,
        releaseYear: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 5,
    });

    return suggestions;
  },
};
