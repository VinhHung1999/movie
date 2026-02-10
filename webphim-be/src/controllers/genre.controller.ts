import { Request, Response, NextFunction } from 'express';
import { genreService } from '../services/genre.service';

export const genreController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const data = await genreService.list();

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
