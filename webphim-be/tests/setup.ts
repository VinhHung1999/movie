import prisma from '../src/config/database';
import { beforeAll, afterAll, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../src/config';

async function cleanDatabase() {
  // Clean in dependency order (children first)
  await prisma.video.deleteMany();
  await prisma.rating.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.watchHistory.deleteMany();
  await prisma.contentCastCrew.deleteMany();
  await prisma.contentGenre.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.season.deleteMany();
  await prisma.castCrew.deleteMany();
  await prisma.content.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
}

beforeAll(async () => {
  await prisma.$connect();
  await cleanDatabase();
  // Ensure uploads/raw directory exists for upload tests
  await fs.mkdir(path.join(config.storage.localDir, 'raw'), { recursive: true });
});

afterEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export { prisma };
