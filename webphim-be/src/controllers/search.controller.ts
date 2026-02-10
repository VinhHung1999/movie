import { Request, Response, NextFunction } from 'express';
import { searchService } from '../services/search.service';
import { searchSchema, suggestionsSchema } from '../validations/search.validation';

export const searchController = {
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      // Re-parse through Zod to get transforms applied (coerce, defaults, empty→undefined)
      // Middleware already validated, so this won't throw — just applies transforms
      const { query } = searchSchema.parse({ query: req.query });

      const result = await searchService.search(query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  },

  async suggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const { query } = suggestionsSchema.parse({ query: req.query });
      const data = await searchService.suggestions(query.q);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
