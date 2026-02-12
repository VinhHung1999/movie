import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';

export const adminService = {
  async getStats() {
    const [totalUsers, totalContent, totalMovies, totalSeries, viewsResult, videoStats] =
      await Promise.all([
        prisma.user.count(),
        prisma.content.count(),
        prisma.content.count({ where: { type: 'MOVIE' } }),
        prisma.content.count({ where: { type: 'SERIES' } }),
        prisma.content.aggregate({ _sum: { viewCount: true } }),
        prisma.video.groupBy({
          by: ['status'],
          _count: { id: true },
        }),
      ]);

    const videoStatusMap: Record<string, number> = {};
    for (const stat of videoStats) {
      videoStatusMap[stat.status] = stat._count.id;
    }

    return {
      totalUsers,
      totalContent,
      totalMovies,
      totalSeries,
      totalViews: viewsResult._sum.viewCount ?? 0,
      totalVideos: Object.values(videoStatusMap).reduce((a, b) => a + b, 0),
      videosCompleted: videoStatusMap['COMPLETED'] ?? 0,
      videosProcessing: (videoStatusMap['PROCESSING'] ?? 0) + (videoStatusMap['QUEUED'] ?? 0) + (videoStatusMap['UPLOADED'] ?? 0),
      videosFailed: videoStatusMap['FAILED'] ?? 0,
    };
  },

  async listContent(query: { page: number; limit: number; type?: string; search?: string }) {
    const { page, limit, type, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (search) where.title = { contains: search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          contentGenres: {
            include: { genre: { select: { name: true } } },
          },
          videos: {
            select: { id: true, status: true },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
      prisma.content.count({ where }),
    ]);

    const data = items.map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      releaseYear: item.releaseYear,
      maturityRating: item.maturityRating,
      duration: item.duration,
      viewCount: item.viewCount,
      hasVideo: item.videos.length > 0,
      videoStatus: item.videos[0]?.status ?? null,
      genreNames: item.contentGenres.map((cg) => cg.genre.name),
      createdAt: item.createdAt,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async createContent(data: {
    type: string;
    title: string;
    description: string;
    releaseYear: number;
    maturityRating?: string;
    duration?: number | null;
    thumbnailUrl?: string | null;
    bannerUrl?: string | null;
    trailerUrl?: string | null;
    genreIds?: string[];
    cast?: { castCrewId: string; role: string; character?: string | null; displayOrder?: number }[];
  }) {
    return prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          type: data.type as 'MOVIE' | 'SERIES',
          title: data.title,
          description: data.description,
          releaseYear: data.releaseYear,
          maturityRating: (data.maturityRating as 'G' | 'PG' | 'PG13' | 'R' | 'NC17') ?? 'PG13',
          duration: data.duration ?? null,
          thumbnailUrl: data.thumbnailUrl ?? null,
          bannerUrl: data.bannerUrl ?? null,
          trailerUrl: data.trailerUrl ?? null,
        },
      });

      if (data.genreIds?.length) {
        await tx.contentGenre.createMany({
          data: data.genreIds.map((genreId) => ({ contentId: content.id, genreId })),
        });
      }

      if (data.cast?.length) {
        await tx.contentCastCrew.createMany({
          data: data.cast.map((c) => ({
            contentId: content.id,
            castCrewId: c.castCrewId,
            role: c.role as 'ACTOR' | 'DIRECTOR' | 'WRITER',
            character: c.character ?? null,
            displayOrder: c.displayOrder ?? 0,
          })),
        });
      }

      const result = await tx.content.findUnique({
        where: { id: content.id },
        include: {
          contentGenres: {
            include: { genre: { select: { id: true, name: true, slug: true } } },
          },
        },
      });

      return {
        id: result!.id,
        type: result!.type,
        title: result!.title,
        description: result!.description,
        releaseYear: result!.releaseYear,
        maturityRating: result!.maturityRating,
        duration: result!.duration,
        genres: result!.contentGenres.map((cg) => cg.genre),
        createdAt: result!.createdAt,
      };
    });
  },

  async updateContent(id: string, data: {
    title?: string;
    description?: string;
    releaseYear?: number;
    maturityRating?: string;
    duration?: number | null;
    thumbnailUrl?: string | null;
    bannerUrl?: string | null;
    trailerUrl?: string | null;
    genreIds?: string[];
    cast?: { castCrewId: string; role: string; character?: string | null; displayOrder?: number }[];
  }) {
    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Content not found');

    return prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.releaseYear !== undefined) updateData.releaseYear = data.releaseYear;
      if (data.maturityRating !== undefined) updateData.maturityRating = data.maturityRating;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
      if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl;
      if (data.trailerUrl !== undefined) updateData.trailerUrl = data.trailerUrl;

      await tx.content.update({ where: { id }, data: updateData });

      if (data.genreIds !== undefined) {
        await tx.contentGenre.deleteMany({ where: { contentId: id } });
        if (data.genreIds.length) {
          await tx.contentGenre.createMany({
            data: data.genreIds.map((genreId) => ({ contentId: id, genreId })),
          });
        }
      }

      if (data.cast !== undefined) {
        await tx.contentCastCrew.deleteMany({ where: { contentId: id } });
        if (data.cast.length) {
          await tx.contentCastCrew.createMany({
            data: data.cast.map((c) => ({
              contentId: id,
              castCrewId: c.castCrewId,
              role: c.role as 'ACTOR' | 'DIRECTOR' | 'WRITER',
              character: c.character ?? null,
              displayOrder: c.displayOrder ?? 0,
            })),
          });
        }
      }

      const result = await tx.content.findUnique({
        where: { id },
        include: {
          contentGenres: {
            include: { genre: { select: { id: true, name: true, slug: true } } },
          },
        },
      });

      return {
        id: result!.id,
        type: result!.type,
        title: result!.title,
        description: result!.description,
        releaseYear: result!.releaseYear,
        maturityRating: result!.maturityRating,
        duration: result!.duration,
        genres: result!.contentGenres.map((cg) => cg.genre),
        createdAt: result!.createdAt,
      };
    });
  },

  async deleteContent(id: string) {
    const existing = await prisma.content.findUnique({ where: { id } });
    if (!existing) throw ApiError.notFound('Content not found');

    await prisma.content.delete({ where: { id } });
    return { id, removed: true };
  },

  async listUsers(query: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          _count: { select: { profiles: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const data = items.map((item) => ({
      id: item.id,
      email: item.email,
      name: item.name,
      role: item.role,
      profileCount: item._count.profiles,
      createdAt: item.createdAt,
    }));

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  },

  async listCast(query: { search?: string; limit: number }) {
    const where: Record<string, unknown> = {};
    if (query.search) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    return prisma.castCrew.findMany({
      where,
      select: { id: true, name: true, photoUrl: true },
      orderBy: { name: 'asc' },
      take: query.limit,
    });
  },
};
