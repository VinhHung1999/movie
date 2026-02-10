import prisma from '../config/database';
import { VideoStatus } from '@prisma/client';
import { ApiError } from '../utils/ApiError';

export const videoService = {
  async create(data: {
    originalName: string;
    originalPath: string;
    mimeType: string;
    fileSize: bigint;
    title: string;
    description?: string;
    contentId?: string;
  }) {
    // Validate contentId exists if provided
    if (data.contentId) {
      const content = await prisma.content.findUnique({
        where: { id: data.contentId },
      });
      if (!content) {
        throw ApiError.badRequest('Content not found', [
          { field: 'contentId', message: 'Content with this ID does not exist' },
        ]);
      }
    }

    const video = await prisma.video.create({
      data: {
        originalName: data.originalName,
        originalPath: data.originalPath,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        status: 'UPLOADED',
        contentId: data.contentId || null,
      },
    });

    return video;
  },

  async getById(id: string) {
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        content: {
          select: { id: true, title: true },
        },
      },
    });

    if (!video) {
      throw ApiError.notFound('Video not found');
    }

    return video;
  },

  async updateStatus(id: string, status: VideoStatus, extra?: {
    hlsPath?: string;
    thumbnailPaths?: string[];
    duration?: number;
    errorMessage?: string;
    transcodeJobId?: string;
  }) {
    return prisma.video.update({
      where: { id },
      data: {
        status,
        ...extra,
      },
    });
  },

  async list(query: { page: number; limit: number; status?: VideoStatus; contentId?: string }) {
    const { page, limit, status, contentId } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (contentId) where.contentId = contentId;

    const [videos, total] = await Promise.all([
      prisma.video.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          content: {
            select: { id: true, title: true },
          },
        },
      }),
      prisma.video.count({ where }),
    ]);

    return {
      videos: videos.map((v) => ({
        id: v.id,
        originalName: v.originalName,
        fileSize: Number(v.fileSize),
        status: v.status,
        contentId: v.contentId,
        contentTitle: v.content?.title || null,
        createdAt: v.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};
