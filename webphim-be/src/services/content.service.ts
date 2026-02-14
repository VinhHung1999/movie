import prisma from '../config/database';
import { ContentListQuery } from '../validations/content.validation';
import { ApiError } from '../utils/ApiError';
import { Prisma } from '@prisma/client';

const SORT_MAP: Record<string, Prisma.ContentOrderByWithRelationInput> = {
  newest: { releaseYear: 'desc' },
  oldest: { releaseYear: 'asc' },
  views: { viewCount: 'desc' },
  title: { title: 'asc' },
};

export const contentService = {
  async list(query: ContentListQuery) {
    const { page, limit, type, genre, sort } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ContentWhereInput = {};

    if (type) {
      where.type = type;
    }

    if (genre) {
      where.contentGenres = {
        some: {
          genre: { slug: genre },
        },
      };
    }

    const orderBy = SORT_MAP[sort] || SORT_MAP.newest;

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          contentGenres: {
            include: {
              genre: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
      prisma.content.count({ where }),
    ]);

    const data = items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      releaseYear: item.releaseYear,
      maturityRating: item.maturityRating,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      bannerUrl: item.bannerUrl,
      viewCount: item.viewCount,
      genres: item.contentGenres.map((cg) => cg.genre),
    }));

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getById(id: string) {
    const content = await prisma.content.findUnique({
      where: { id },
      include: {
        contentGenres: {
          include: {
            genre: { select: { id: true, name: true, slug: true } },
          },
        },
        contentCast: {
          include: {
            castCrew: { select: { id: true, name: true, photoUrl: true } },
          },
          orderBy: { displayOrder: 'asc' },
        },
        seasons: {
          orderBy: { seasonNumber: 'asc' },
          include: {
            episodes: {
              orderBy: { episodeNumber: 'asc' },
              select: {
                id: true,
                episodeNumber: true,
                title: true,
                description: true,
                duration: true,
                thumbnailUrl: true,
                videoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      throw ApiError.notFound('Content not found');
    }

    return {
      id: content.id,
      type: content.type,
      title: content.title,
      description: content.description,
      releaseYear: content.releaseYear,
      maturityRating: content.maturityRating,
      duration: content.duration,
      thumbnailUrl: content.thumbnailUrl,
      bannerUrl: content.bannerUrl,
      trailerUrl: content.trailerUrl,
      viewCount: content.viewCount,
      genres: content.contentGenres.map((cg) => cg.genre),
      cast: content.contentCast.map((cc) => ({
        id: cc.castCrew.id,
        name: cc.castCrew.name,
        role: cc.role,
        character: cc.character,
        photoUrl: cc.castCrew.photoUrl,
      })),
      seasons: content.type === 'SERIES'
        ? content.seasons.map((s) => ({
            id: s.id,
            seasonNumber: s.seasonNumber,
            title: s.title,
            episodes: s.episodes,
          }))
        : undefined,
    };
  },

  async getSimilar(id: string, limit: number = 12) {
    const target = await prisma.content.findUnique({
      where: { id },
      include: { contentGenres: { select: { genreId: true } } },
    });

    if (!target) {
      throw ApiError.notFound('Content not found');
    }

    const genreIds = target.contentGenres.map((cg) => cg.genreId);

    if (genreIds.length === 0) {
      return [];
    }

    const candidates = await prisma.content.findMany({
      where: {
        id: { not: id },
        contentGenres: { some: { genreId: { in: genreIds } } },
      },
      include: {
        contentGenres: {
          include: { genre: { select: { id: true, name: true, slug: true } } },
        },
      },
      take: limit * 3,
    });

    const ranked = candidates
      .map((item) => ({
        item,
        overlap: item.contentGenres.filter((cg) => genreIds.includes(cg.genreId)).length,
      }))
      .sort((a, b) => b.overlap - a.overlap || b.item.viewCount - a.item.viewCount)
      .slice(0, limit);

    return ranked.map(({ item }) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      releaseYear: item.releaseYear,
      maturityRating: item.maturityRating,
      duration: item.duration,
      thumbnailUrl: item.thumbnailUrl,
      bannerUrl: item.bannerUrl,
      viewCount: item.viewCount,
      genres: item.contentGenres.map((cg) => cg.genre),
    }));
  },

  async getFeatured() {
    const count = await prisma.content.count({
      where: { bannerUrl: { not: null } },
    });

    if (count === 0) {
      throw ApiError.notFound('No featured content available');
    }

    const randomSkip = Math.floor(Math.random() * count);

    const items = await prisma.content.findMany({
      where: { bannerUrl: { not: null } },
      skip: randomSkip,
      take: 1,
      include: {
        contentGenres: {
          include: {
            genre: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    const item = items[0];
    if (!item) {
      throw ApiError.notFound('No featured content available');
    }

    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      releaseYear: item.releaseYear,
      maturityRating: item.maturityRating,
      duration: item.duration,
      bannerUrl: item.bannerUrl,
      trailerUrl: item.trailerUrl,
      genres: item.contentGenres.map((cg) => cg.genre),
    };
  },
};
