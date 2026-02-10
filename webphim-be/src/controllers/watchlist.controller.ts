import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { watchlistService } from '../services/watchlist.service';
import { watchlistQuerySchema, watchlistParamsSchema } from '../validations/watchlist.validation';

export const watchlistController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = watchlistQuerySchema.parse({ query: req.query });
      const result = await watchlistService.getAll(req.user!.userId, query.page, query.limit);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async add(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = watchlistParamsSchema.parse({ params: req.params });
      const data = await watchlistService.add(req.user!.userId, params.contentId);

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = watchlistParamsSchema.parse({ params: req.params });
      const data = await watchlistService.remove(req.user!.userId, params.contentId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async check(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = watchlistParamsSchema.parse({ params: req.params });
      const data = await watchlistService.check(req.user!.userId, params.contentId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
