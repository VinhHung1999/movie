import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { adminService } from '../services/admin.service';
import { createContentSchema, updateContentSchema, adminListSchema, castListSchema } from '../validations/admin.validation';

export const adminController = {
  async getStats(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      next(error);
    }
  },

  async listContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = adminListSchema.parse({ query: req.query });
      const result = await adminService.listContent(query);
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  },

  async createContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { body } = createContentSchema.parse({ body: req.body });
      const content = await adminService.createContent(body);
      res.status(201).json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  },

  async updateContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { body } = updateContentSchema.parse({ body: req.body });
      const content = await adminService.updateContent(req.params.id as string, body);
      res.json({ success: true, data: content });
    } catch (error) {
      next(error);
    }
  },

  async deleteContent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await adminService.deleteContent(req.params.id as string);
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  },

  async listUsers(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = adminListSchema.parse({ query: req.query });
      const result = await adminService.listUsers(query);
      res.json({ success: true, data: result.data, meta: result.meta });
    } catch (error) {
      next(error);
    }
  },

  async listCast(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { query } = castListSchema.parse({ query: req.query });
      const cast = await adminService.listCast(query);
      res.json({ success: true, data: cast });
    } catch (error) {
      next(error);
    }
  },
};
