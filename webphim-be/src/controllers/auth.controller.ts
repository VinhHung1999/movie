import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthRequest } from '../types';
import { config } from '../config';
import { changePasswordSchema } from '../validations/auth.validation';

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.status(201).json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        res.status(401).json({
          success: false,
          message: 'No refresh token provided',
        });
        return;
      }

      const tokens = await authService.refresh(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, _next: NextFunction) {
    const refreshToken = req.cookies?.refreshToken;

    await authService.logout(refreshToken);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax' as const,
      path: '/api/auth',
    });

    res.json({
      success: true,
      data: {
        message: 'Logged out',
      },
    });
  },

  async changePassword(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { body } = changePasswordSchema.parse({ body: req.body });
      await authService.changePassword(req.user!.userId, body.currentPassword, body.newPassword);
      res.json({ success: true, data: { message: 'Password changed successfully' } });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const user = await authService.getMe(req.user.userId);

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
