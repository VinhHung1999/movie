import { Request, Response, NextFunction } from 'express';
import { contentService } from '../services/content.service';
import { ContentListQuery } from '../validations/content.validation';

export const contentController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      // Use validated query from validation middleware parse result
      // Express 5: req.query is read-only, so we parse it via Zod in middleware
      // and pass the validated result through req.body (for query schemas)
      // Actually, since validate middleware parses { body, query, params } but only writes back body,
      // we re-parse query here from req.query with defaults applied by Zod
      const query: ContentListQuery = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 20,
        type: req.query.type as ContentListQuery['type'],
        genre: req.query.genre as string | undefined,
        sort: (req.query.sort as ContentListQuery['sort']) || 'newest',
        search: req.query.search as string | undefined,
        maturityRating: req.query.maturityRating as ContentListQuery['maturityRating'],
        yearFrom: req.query.yearFrom ? Number(req.query.yearFrom) : undefined,
        yearTo: req.query.yearTo ? Number(req.query.yearTo) : undefined,
      };

      const result = await contentService.list(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async getDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await contentService.getById(id);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getSimilar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const limit = Number(req.query.limit) || 12;
      const result = await contentService.getSimilar(id, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async getFeatured(_req: Request, res: Response, next: NextFunction) {
    try {
      const result = await contentService.getFeatured();

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
