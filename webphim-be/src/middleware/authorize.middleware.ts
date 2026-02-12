import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { AuthRequest } from '../types';

export function authorize(...roles: string[]) {
  return async (req: AuthRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('Authentication required');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        select: { role: true },
      });

      if (!user || !roles.includes(user.role)) {
        throw ApiError.forbidden('Admin access required');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
