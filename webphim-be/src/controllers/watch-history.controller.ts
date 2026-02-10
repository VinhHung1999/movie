import { Response, NextFunction } from 'express';
import { watchHistoryService } from '../services/watch-history.service';
import { saveProgressSchema } from '../validations/watch-history.validation';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

export const watchHistoryController = {
  async saveProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const parsed = saveProgressSchema.shape.body.safeParse(req.body);
      if (!parsed.success) {
        throw ApiError.badRequest('Validation failed', parsed.error.issues.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })));
      }

      const result = await watchHistoryService.saveProgress(req.user!.userId, parsed.data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProgress(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const contentId = req.params.contentId as string;
      // Express 5: req.query is read-only, parse inline
      const episodeId = req.query.episodeId as string | undefined;

      const result = await watchHistoryService.getProgress(req.user!.userId, contentId, episodeId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getContinueWatching(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      // Express 5: req.query is read-only, parse inline
      const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

      const result = await watchHistoryService.getContinueWatching(req.user!.userId, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
