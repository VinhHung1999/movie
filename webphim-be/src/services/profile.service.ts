import prisma from '../config/database';
import { ApiError } from '../utils/ApiError';
import { CreateProfileInput, UpdateProfileInput } from '../validations/profile.validation';

const MAX_PROFILES = 5;

export const profileService = {
  async getAll(userId: string) {
    return prisma.profile.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        isKids: true,
        createdAt: true,
      },
    });
  },

  async create(userId: string, data: CreateProfileInput) {
    const count = await prisma.profile.count({ where: { userId } });
    if (count >= MAX_PROFILES) {
      throw ApiError.conflict('Maximum 5 profiles per account');
    }

    return prisma.profile.create({
      data: {
        userId,
        name: data.name,
        avatarUrl: data.avatarUrl ?? null,
        isKids: data.isKids,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        isKids: true,
        createdAt: true,
      },
    });
  },

  async update(userId: string, profileId: string, data: UpdateProfileInput) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });

    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }
    if (profile.userId !== userId) {
      throw ApiError.forbidden('Cannot edit profile owned by another user');
    }

    return prisma.profile.update({
      where: { id: profileId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        ...(data.isKids !== undefined && { isKids: data.isKids }),
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        isKids: true,
        createdAt: true,
      },
    });
  },

  async remove(userId: string, profileId: string) {
    const profile = await prisma.profile.findUnique({ where: { id: profileId } });

    if (!profile) {
      throw ApiError.notFound('Profile not found');
    }
    if (profile.userId !== userId) {
      throw ApiError.forbidden('Cannot delete profile owned by another user');
    }

    const count = await prisma.profile.count({ where: { userId } });
    if (count <= 1) {
      throw ApiError.badRequest('Cannot delete last profile');
    }

    await prisma.profile.delete({ where: { id: profileId } });
    return { id: profileId, removed: true };
  },
};
