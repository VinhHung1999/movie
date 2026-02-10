import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { profileService } from '../services/profile.service';
import {
  createProfileSchema,
  updateProfileSchema,
  profileParamsSchema,
} from '../validations/profile.validation';

export const profileController = {
  async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await profileService.getAll(req.user!.userId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { body } = createProfileSchema.parse({ body: req.body });
      const data = await profileService.create(req.user!.userId, body);

      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params, body } = updateProfileSchema.parse({
        params: req.params,
        body: req.body,
      });
      const data = await profileService.update(
        req.user!.userId,
        params.profileId,
        body,
      );

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { params } = profileParamsSchema.parse({ params: req.params });
      const data = await profileService.remove(req.user!.userId, params.profileId);

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
};
