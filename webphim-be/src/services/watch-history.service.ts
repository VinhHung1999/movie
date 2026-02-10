import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';

export const watchHistoryService = {
  async saveProgress(userId: string, data: {
    contentId: string;
    episodeId?: string | null;
    progress: number;
    duration: number;
  }) {
    // Verify content exists
    const content = await prisma.content.findUnique({ where: { id: data.contentId } });
    if (!content) {
      throw ApiError.notFound('Content not found');
    }

    const episodeId = data.episodeId || null;

    // Prisma 7 rejects null in compound unique where clause, so use findFirst + manual upsert
    const existing = await prisma.watchHistory.findFirst({
      where: { userId, contentId: data.contentId, episodeId },
    });

    let record;
    if (existing) {
      record = await prisma.watchHistory.update({
        where: { id: existing.id },
        data: {
          progress: data.progress,
          duration: data.duration,
          watchedAt: new Date(),
        },
      });
    } else {
      record = await prisma.watchHistory.create({
        data: {
          userId,
          contentId: data.contentId,
          episodeId,
          progress: data.progress,
          duration: data.duration,
        },
      });
    }

    return {
      id: record.id,
      contentId: record.contentId,
      episodeId: record.episodeId,
      progress: record.progress,
      duration: record.duration,
      updatedAt: record.updatedAt,
    };
  },

  async getProgress(userId: string, contentId: string, episodeId?: string) {
    const record = await prisma.watchHistory.findFirst({
      where: { userId, contentId, episodeId: episodeId || null },
    });

    if (!record) return null;

    return {
      id: record.id,
      contentId: record.contentId,
      episodeId: record.episodeId,
      progress: record.progress,
      duration: record.duration,
      updatedAt: record.updatedAt,
    };
  },

  async getContinueWatching(userId: string, limit: number) {
    // Fetch user's watch history with content details, ordered by most recent
    const records = await prisma.watchHistory.findMany({
      where: {
        userId,
        duration: { gt: 0 },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            type: true,
            thumbnailUrl: true,
            maturityRating: true,
          },
        },
      },
    });

    // Filter in JS: progress between 5% and 90% of duration
    const filtered = records
      .filter((r) => {
        const percent = r.progress / r.duration;
        return percent > 0.05 && percent < 0.90;
      })
      .slice(0, limit);

    return filtered.map((r) => ({
      id: r.id,
      contentId: r.contentId,
      episodeId: r.episodeId,
      progress: r.progress,
      duration: r.duration,
      progressPercent: Math.round((r.progress / r.duration) * 100),
      updatedAt: r.updatedAt,
      content: r.content,
    }));
  },
};
