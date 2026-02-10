import { describe, it, expect, beforeEach } from 'vitest';
import { request } from './helpers/content.helper';
import { registerUser } from './helpers/auth.helper';

let token: string;

async function getToken() {
  const res = await registerUser();
  return res.body.data.accessToken as string;
}

describe('Profile API (Task 10.3)', () => {
  beforeEach(async () => {
    token = await getToken();
  });

  describe('Auto-create on signup', () => {
    it('should auto-create a default profile on registration', async () => {
      const res = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].name).toBe('Test User');
      expect(res.body.data[0].isKids).toBe(false);
      expect(res.body.data[0].avatarUrl).toBeNull();
    });
  });

  describe('GET /api/profiles — List profiles', () => {
    it('should return profiles for current user', async () => {
      const res = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0]).toHaveProperty('id');
      expect(res.body.data[0]).toHaveProperty('name');
      expect(res.body.data[0]).toHaveProperty('avatarUrl');
      expect(res.body.data[0]).toHaveProperty('isKids');
      expect(res.body.data[0]).toHaveProperty('createdAt');
    });

    it('should return 401 without auth', async () => {
      const res = await request.get('/api/profiles');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/profiles — Create profile', () => {
    it('should create a new profile', async () => {
      const res = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Kids Profile', isKids: true });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Kids Profile');
      expect(res.body.data.isKids).toBe(true);
    });

    it('should create profile with avatar', async () => {
      const res = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Avatar Profile', avatarUrl: '/images/avatars/avatar-1.png' });

      expect(res.status).toBe(201);
      expect(res.body.data.avatarUrl).toBe('/images/avatars/avatar-1.png');
    });

    it('should enforce max 5 profiles', async () => {
      // Already have 1 from auto-create, add 4 more
      for (let i = 2; i <= 5; i++) {
        await request
          .post('/api/profiles')
          .set('Authorization', `Bearer ${token}`)
          .send({ name: `Profile ${i}` });
      }

      // 6th profile should fail
      const res = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Too Many' });

      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Maximum 5 profiles');
    });

    it('should reject empty name', async () => {
      const res = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should reject name longer than 30 chars', async () => {
      const res = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'A'.repeat(31) });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/profiles/:profileId — Update profile', () => {
    it('should update profile name', async () => {
      const listRes = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);
      const profileId = listRes.body.data[0].id;

      const res = await request
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it('should update isKids flag', async () => {
      const listRes = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);
      const profileId = listRes.body.data[0].id;

      const res = await request
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ isKids: true });

      expect(res.status).toBe(200);
      expect(res.body.data.isKids).toBe(true);
    });

    it('should return 403 for other user profile', async () => {
      const listRes = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);
      const profileId = listRes.body.data[0].id;

      // Register second user
      const res2 = await registerUser({
        name: 'Other User',
        email: 'other@example.com',
        password: 'Password123',
      });
      const token2 = res2.body.data.accessToken;

      const res = await request
        .put(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({ name: 'Hacked' });

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent profile', async () => {
      const res = await request
        .put('/api/profiles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Ghost' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/profiles/:profileId — Delete profile', () => {
    it('should delete a profile when more than 1 exists', async () => {
      // Create a second profile
      const createRes = await request
        .post('/api/profiles')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'To Delete' });
      const profileId = createRes.body.data.id;

      const res = await request
        .delete(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.removed).toBe(true);
    });

    it('should refuse to delete last profile', async () => {
      const listRes = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);
      const profileId = listRes.body.data[0].id;

      const res = await request
        .delete(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot delete last profile');
    });

    it('should return 403 for other user profile', async () => {
      const listRes = await request
        .get('/api/profiles')
        .set('Authorization', `Bearer ${token}`);
      const profileId = listRes.body.data[0].id;

      const res2 = await registerUser({
        name: 'Other User',
        email: 'other2@example.com',
        password: 'Password123',
      });
      const token2 = res2.body.data.accessToken;

      const res = await request
        .delete(`/api/profiles/${profileId}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent profile', async () => {
      const res = await request
        .delete('/api/profiles/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
