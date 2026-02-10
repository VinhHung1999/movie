import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { ratingService } from '../services/rating.service';
import {
  rateSchema,
  ratingParamsSchema,
  ratingsQuerySchema,
} from '../validations/rating.validation';

export const ratingController = {
  async rate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params, body } = rateSchema.parse({
        params: req.params,
        body: req.body,
      });
      const data = await ratingService.rate(
        req.user!.userId,
        params.contentId,
        body.score,
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = ratingParamsSchema.parse({ params: req.params });
      const data = await ratingService.remove(req.user!.userId, params.contentId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async get(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = ratingParamsSchema.parse({ params: req.params });
      const data = await ratingService.get(req.user!.userId, params.contentId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = ratingsQuerySchema.parse({ query: req.query });
      const result = await ratingService.getAll(
        req.user!.userId,
        query.page,
        query.limit,
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },
};
