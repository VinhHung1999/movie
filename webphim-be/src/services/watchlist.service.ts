import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';

export const watchlistService = {
  async getAll(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.watchlist.findMany({
        where: { userId },
        orderBy: { addedAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            include: {
              contentGenres: {
                include: {
                  genre: { select: { id: true, name: true, slug: true } },
                },
              },
            },
          },
        },
      }),
      prisma.watchlist.count({ where: { userId } }),
    ]);

    const data = items.map((item) => ({
      contentId: item.contentId,
      addedAt: item.addedAt,
      content: {
        id: item.content.id,
        type: item.content.type,
        title: item.content.title,
        description: item.content.description,
        releaseYear: item.content.releaseYear,
        maturityRating: item.content.maturityRating,
        duration: item.content.duration,
        thumbnailUrl: item.content.thumbnailUrl,
        bannerUrl: item.content.bannerUrl,
        viewCount: item.content.viewCount,
        genres: item.content.contentGenres.map((cg) => cg.genre),
      },
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

  async add(userId: string, contentId: string) {
    const content = await prisma.content.findUnique({ where: { id: contentId } });
    if (!content) throw ApiError.notFound('Content not found');

    const record = await prisma.watchlist.upsert({
      where: { userId_contentId: { userId, contentId } },
      update: {},
      create: { userId, contentId },
    });
    return { contentId: record.contentId, addedAt: record.addedAt };
  },

  async remove(userId: string, contentId: string) {
    await prisma.watchlist.deleteMany({ where: { userId, contentId } });
    return { contentId, removed: true };
  },

  async check(userId: string, contentId: string) {
    const record = await prisma.watchlist.findUnique({
      where: { userId_contentId: { userId, contentId } },
    });
    return { inWatchlist: !!record };
  },
};
