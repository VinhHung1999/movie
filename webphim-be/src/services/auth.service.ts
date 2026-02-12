import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { ApiError } from '../utils/ApiError';
import { RegisterInput, LoginInput } from '../validations/auth.validation';
import { UserResponse, AuthResult } from '../types';

function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: string;
  createdAt: Date;
}): UserResponse {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    createdAt: user.createdAt,
  };
}

function parseExpiry(expiresIn: string): Date {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7d

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const ms: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return new Date(Date.now() + value * ms[unit]);
}

async function createRefreshTokenInDb(userId: string, token: string): Promise<void> {
  const expiresAt = parseExpiry(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });
}

async function generateTokens(userId: string, email: string) {
  const tokenId = uuidv4();
  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, tokenId });

  await createRefreshTokenInDb(userId, refreshToken);

  return { accessToken, refreshToken };
}

export const authService = {
  async register(data: RegisterInput): Promise<AuthResult> {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw ApiError.conflict('Email already registered');
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: data.email,
          name: data.name,
          passwordHash,
        },
      });

      // Auto-create default profile for new user
      await tx.profile.create({
        data: {
          userId: newUser.id,
          name: newUser.name,
          avatarUrl: null,
          isKids: false,
        },
      });

      return newUser;
    });

    const tokens = await generateTokens(user.id, user.email);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async login(data: LoginInput): Promise<AuthResult> {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const valid = await comparePassword(data.password, user.passwordHash);
    if (!valid) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const tokens = await generateTokens(user.id, user.email);

    return {
      user: sanitizeUser(user),
      ...tokens,
    };
  },

  async refresh(refreshTokenStr: string): Promise<{ accessToken: string; refreshToken: string }> {
    let payload;
    try {
      payload = verifyRefreshToken(refreshTokenStr);
    } catch {
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshTokenStr },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      }
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    // Token rotation: delete old, create new
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw ApiError.unauthorized('User not found');
    }

    const tokens = await generateTokens(user.id, user.email);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  },

  async logout(refreshTokenStr: string): Promise<void> {
    if (!refreshTokenStr) return;

    try {
      await prisma.refreshToken.deleteMany({
        where: { token: refreshTokenStr },
      });
    } catch {
      // Logout always succeeds
    }
  },

  async getMe(userId: string): Promise<UserResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }
    return sanitizeUser(user);
  },
};
