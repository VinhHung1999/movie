import { describe, it, expect, beforeEach } from 'vitest';
import { request, registerUser, validUser } from './helpers/auth.helper';
import { createTestContent, createTestGenres, testMovie } from './helpers/content.helper';
import prisma from '../src/config/database';
import bcrypt from 'bcryptjs';

// Helper: create admin user and get token
async function getAdminToken(): Promise<string> {
  const passwordHash = await bcrypt.hash('Admin@123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: { role: 'ADMIN' },
    create: {
      email: 'admin@test.com',
      name: 'Test Admin',
      passwordHash,
      role: 'ADMIN',
    },
  });
  // Also create default profile
  const user = await prisma.user.findUnique({ where: { email: 'admin@test.com' } });
  await prisma.profile.create({ data: { userId: user!.id, name: 'Admin' } });

  const res = await request.post('/api/auth/login').send({
    email: 'admin@test.com',
    password: 'Admin@123456',
  });
  return res.body.data.accessToken;
}

// Helper: get regular user token
async function getUserToken(): Promise<string> {
  const res = await registerUser();
  return res.body.data.accessToken;
}

// ============================================
// Task 12.1: Role + Authorize + Stats
// ============================================
describe('Admin Authorization (Task 12.1)', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await getAdminToken();
  });

  it('should return 401 without auth token', async () => {
    const res = await request.get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('should return 403 for regular user', async () => {
    const userToken = await getUserToken();
    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toBe('Admin access required');
  });

  it('should return 200 for admin user', async () => {
    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should include role in login response', async () => {
    const res = await request.post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'Admin@123456',
    });
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('should include role in register response (default USER)', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'New User',
      email: 'newuser@test.com',
      password: 'Password123',
    });
    expect(res.body.data.user.role).toBe('USER');
  });
});

describe('Admin Stats API (Task 12.1)', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await getAdminToken();
  });

  it('should return stats with correct shape', async () => {
    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const { data } = res.body;
    expect(data).toHaveProperty('totalUsers');
    expect(data).toHaveProperty('totalContent');
    expect(data).toHaveProperty('totalMovies');
    expect(data).toHaveProperty('totalSeries');
    expect(data).toHaveProperty('totalViews');
    expect(data).toHaveProperty('totalVideos');
    expect(data).toHaveProperty('videosCompleted');
    expect(data).toHaveProperty('videosProcessing');
    expect(data).toHaveProperty('videosFailed');
  });

  it('should count users correctly', async () => {
    // Register another user
    await registerUser({ name: 'User2', email: 'user2@test.com', password: 'Password123' });

    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.totalUsers).toBe(2); // admin + user2
  });

  it('should count content by type', async () => {
    await createTestContent({ title: 'Movie 1' });
    await createTestContent({ title: 'Movie 2' });
    await prisma.content.create({
      data: {
        type: 'SERIES',
        title: 'Series 1',
        description: 'Test',
        releaseYear: 2024,
        maturityRating: 'PG13',
        viewCount: 100,
      },
    });

    const res = await request
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.totalContent).toBe(3);
    expect(res.body.data.totalMovies).toBe(2);
    expect(res.body.data.totalSeries).toBe(1);
  });
});

// ============================================
// Task 12.2: Content CRUD API
// ============================================
describe('Admin Content CRUD (Task 12.2)', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await getAdminToken();
  });

  describe('GET /api/admin/content', () => {
    it('should list content with video status', async () => {
      await createTestContent({ title: 'Test List Movie' });

      const res = await request
        .get('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Test List Movie');
      expect(res.body.data[0]).toHaveProperty('hasVideo');
      expect(res.body.data[0]).toHaveProperty('videoStatus');
      expect(res.body.meta).toHaveProperty('total');
    });

    it('should filter by type', async () => {
      await createTestContent({ title: 'Movie' });
      await prisma.content.create({
        data: { type: 'SERIES', title: 'Series', description: 'Test', releaseYear: 2024, maturityRating: 'PG13', viewCount: 0 },
      });

      const res = await request
        .get('/api/admin/content?type=MOVIE')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Movie');
    });

    it('should search by title', async () => {
      await createTestContent({ title: 'Inception Clone' });
      await createTestContent({ title: 'Dark Knight Clone' });

      const res = await request
        .get('/api/admin/content?search=inception')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].title).toBe('Inception Clone');
    });

    it('should paginate', async () => {
      for (let i = 0; i < 5; i++) {
        await createTestContent({ title: `Movie ${i}` });
      }

      const res = await request
        .get('/api/admin/content?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(2);
      expect(res.body.meta.total).toBe(5);
      expect(res.body.meta.totalPages).toBe(3);
    });
  });

  describe('POST /api/admin/content', () => {
    it('should create content', async () => {
      const res = await request
        .post('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'MOVIE',
          title: 'New Movie',
          description: 'A great movie',
          releaseYear: 2026,
          maturityRating: 'PG13',
          duration: 120,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('New Movie');
      expect(res.body.data.type).toBe('MOVIE');
    });

    it('should create content with genres', async () => {
      const genres = await createTestGenres();

      const res = await request
        .post('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'MOVIE',
          title: 'Genre Movie',
          description: 'A movie with genres',
          releaseYear: 2026,
          genreIds: [genres[0].id, genres[1].id],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.genres.length).toBe(2);
    });

    it('should create content with cast', async () => {
      const actor = await prisma.castCrew.create({ data: { name: 'Test Actor' } });

      const res = await request
        .post('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'MOVIE',
          title: 'Cast Movie',
          description: 'A movie with cast',
          releaseYear: 2026,
          cast: [{ castCrewId: actor.id, role: 'ACTOR', character: 'Hero' }],
        });

      expect(res.status).toBe(201);

      // Verify cast was linked
      const castLinks = await prisma.contentCastCrew.findMany({
        where: { contentId: res.body.data.id },
      });
      expect(castLinks.length).toBe(1);
    });

    it('should validate required fields', async () => {
      const res = await request
        .post('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ type: 'MOVIE' }); // missing title, description, releaseYear

      expect(res.status).toBe(400);
    });

    it('should reject invalid type', async () => {
      const res = await request
        .post('/api/admin/content')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'INVALID',
          title: 'Bad',
          description: 'Bad',
          releaseYear: 2026,
        });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/admin/content/:id', () => {
    it('should update content', async () => {
      const content = await createTestContent({ title: 'Original' });

      const res = await request
        .put(`/api/admin/content/${content.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated Title' });

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Updated Title');
    });

    it('should update genres (delete-recreate)', async () => {
      const genres = await createTestGenres();
      const content = await createTestContent({ title: 'Genre Update' });
      await prisma.contentGenre.create({ data: { contentId: content.id, genreId: genres[0].id } });

      const res = await request
        .put(`/api/admin/content/${content.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ genreIds: [genres[1].id, genres[2].id] });

      expect(res.status).toBe(200);
      expect(res.body.data.genres.length).toBe(2);

      // Verify old genre removed
      const links = await prisma.contentGenre.findMany({ where: { contentId: content.id } });
      expect(links.map(l => l.genreId)).not.toContain(genres[0].id);
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request
        .put('/api/admin/content/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/admin/content/:id', () => {
    it('should delete content', async () => {
      const content = await createTestContent({ title: 'Delete Me' });

      const res = await request
        .delete(`/api/admin/content/${content.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);

      // Verify deleted
      const found = await prisma.content.findUnique({ where: { id: content.id } });
      expect(found).toBeNull();
    });

    it('should cascade delete related records', async () => {
      const content = await createTestContent({ title: 'Cascade Delete' });
      const genres = await createTestGenres();
      await prisma.contentGenre.create({ data: { contentId: content.id, genreId: genres[0].id } });

      await request
        .delete(`/api/admin/content/${content.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      const links = await prisma.contentGenre.findMany({ where: { contentId: content.id } });
      expect(links.length).toBe(0);
    });

    it('should return 404 for non-existent content', async () => {
      const res = await request
        .delete('/api/admin/content/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/admin/cast', () => {
    it('should list cast/crew', async () => {
      await prisma.castCrew.create({ data: { name: 'Leonardo DiCaprio' } });
      await prisma.castCrew.create({ data: { name: 'Brad Pitt' } });

      const res = await request
        .get('/api/admin/cast')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
    });

    it('should filter by name search', async () => {
      await prisma.castCrew.create({ data: { name: 'Leonardo DiCaprio' } });
      await prisma.castCrew.create({ data: { name: 'Brad Pitt' } });

      const res = await request
        .get('/api/admin/cast?search=leo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Leonardo DiCaprio');
    });
  });
});

// ============================================
// Task 12.3: User List API
// ============================================
describe('Admin User List (Task 12.3)', () => {
  let adminToken: string;

  beforeEach(async () => {
    adminToken = await getAdminToken();
  });

  it('should list users with profile count', async () => {
    await registerUser();

    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2); // admin + registered user
    expect(res.body.data[0]).toHaveProperty('profileCount');
    expect(res.body.data[0]).toHaveProperty('role');
    expect(res.body.meta).toHaveProperty('total');
  });

  it('should search by name', async () => {
    await registerUser({ name: 'Alice Smith', email: 'alice@test.com', password: 'Password123' });
    await registerUser({ name: 'Bob Jones', email: 'bob@test.com', password: 'Password123' });

    const res = await request
      .get('/api/admin/users?search=alice')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe('Alice Smith');
  });

  it('should search by email', async () => {
    await registerUser({ name: 'Alice', email: 'alice@special.com', password: 'Password123' });

    const res = await request
      .get('/api/admin/users?search=special')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].email).toBe('alice@special.com');
  });

  it('should paginate users', async () => {
    for (let i = 0; i < 5; i++) {
      await registerUser({ name: `User ${i}`, email: `user${i}@test.com`, password: 'Password123' });
    }

    const res = await request
      .get('/api/admin/users?page=1&limit=3')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.body.data.length).toBe(3);
    expect(res.body.meta.total).toBe(6); // 5 + admin
  });

  it('should return 403 for non-admin', async () => {
    const userToken = await getUserToken();
    const res = await request
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });
});
