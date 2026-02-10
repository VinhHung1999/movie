import { Response, NextFunction } from 'express';
import { VideoStatus } from '@prisma/client';
import { videoService } from '../services/video.service';
import { enqueueTranscode, getJobProgress } from '../services/queue.service';
import { uploadVideoSchema } from '../validations/video.validation';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

export const videoController = {
  // UPLOAD LEARN 5: Sau Multer lưu file, controller tạo record trong DB (status=UPLOADED),
  // convert BigInt→Number cho JSON. Trả video ID về FE. FE tự động gọi transcode (xem LEARN 6).
  async upload(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw ApiError.badRequest('Validation failed', [
          { field: 'video', message: 'Video file is required' },
        ]);
      }

      // Parse and validate body fields from multipart form
      const parsed = uploadVideoSchema.shape.body.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest('Validation failed', parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })));
      }

      const { title, description, contentId } = parsed.data;

      const video = await videoService.create({
        originalName: req.file.originalname,
        originalPath: req.file.path,
        mimeType: req.file.mimetype,
        fileSize: BigInt(req.file.size),
        title,
        description,
        contentId,
      });

      res.status(201).json({
        success: true,
        data: {
          id: video.id,
          originalName: video.originalName,
          mimeType: video.mimeType,
          fileSize: Number(video.fileSize),
          status: video.status,
          contentId: video.contentId,
          createdAt: video.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // UPLOAD LEARN 9: FE poll endpoint này mỗi 3s (SWR refreshInterval) để lấy progress %
  // từ BullMQ job. Khi COMPLETED hoặc FAILED → FE ngừng poll.
  async getStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const video = await videoService.getById(id);

      // Get job progress from BullMQ if available
      let progress: number | null = null;
      if (video.transcodeJobId && ['QUEUED', 'PROCESSING'].includes(video.status)) {
        progress = await getJobProgress(video.transcodeJobId);
      } else if (video.status === 'COMPLETED') {
        progress = 100;
      }

      res.json({
        success: true,
        data: {
          id: video.id,
          status: video.status,
          originalName: video.originalName,
          fileSize: Number(video.fileSize),
          duration: video.duration,
          hlsPath: video.hlsPath,
          thumbnailPaths: video.thumbnailPaths,
          errorMessage: video.errorMessage,
          progress,
          createdAt: video.createdAt,
          updatedAt: video.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Express 5: req.query is read-only, parse inline
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
      const status = req.query.status as VideoStatus | undefined;
      const contentId = req.query.contentId as string | undefined;

      const result = await videoService.list({ page, limit, status, contentId });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  // UPLOAD LEARN 11: Khi COMPLETED, FE gọi endpoint này lấy URL master.m3u8 cho player
  // và thumbnail URLs. Player dùng master.m3u8 để tự chọn chất lượng (Adaptive Bitrate).
  async getStream(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const video = await videoService.getById(id);

      if (video.status !== 'COMPLETED') {
        throw ApiError.conflict('Video transcoding not yet complete');
      }

      res.json({
        success: true,
        data: {
          videoId: video.id,
          streamUrl: video.hlsPath ? `/uploads/${video.hlsPath}` : null,
          thumbnails: video.thumbnailPaths.map((p) => `/uploads/${p}`),
          duration: video.duration,
          status: video.status,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  // UPLOAD LEARN 6: FE gọi POST /api/videos/:id/transcode → controller gọi enqueueTranscode()
  // bỏ job vào Redis queue → trả về ngay 202 Accepted (không chờ). Tiếp: xem LEARN 7.
  async transcode(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const video = await videoService.getById(id);

      if (['QUEUED', 'PROCESSING'].includes(video.status)) {
        throw ApiError.conflict('Video is already being transcoded');
      }

      const jobId = await enqueueTranscode(id, video.originalPath);

      res.status(202).json({
        success: true,
        data: {
          videoId: video.id,
          jobId,
          status: 'QUEUED',
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
