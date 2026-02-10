import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';

export const ratingService = {
  async rate(userId: string, contentId: string, score: number) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw ApiError.notFound('Content not found');

    const record = await prisma.rating.upsert({
      where: { userId_contentId: { userId, contentId } },
      update: { score },
      create: { userId, contentId, score },
    });

    return {
      contentId: record.contentId,
      score: record.score,
      updatedAt: record.updatedAt,
    };
  },

  async remove(userId: string, contentId: string) {
    await prisma.rating.deleteMany({ where: { userId, contentId } });
    return { contentId, removed: true };
  },

  async get(userId: string, contentId: string) {
    const record = await prisma.rating.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });

    if (!record) return null;

    return {
      contentId: record.contentId,
      score: record.score,
      updatedAt: record.updatedAt,
    };
  },

  async getAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.rating.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            select: {
              id: true,
              type: true,
              title: true,
              thumbnailUrl: true,
              releaseYear: true,
            },
          },
        },
      }),
      prisma.rating.count({ where: { userId } }),
    ]);

    const data = items.map((item) => ({
      contentId: item.contentId,
      score: item.score,
      updatedAt: item.updatedAt,
      content: item.content,
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
};
