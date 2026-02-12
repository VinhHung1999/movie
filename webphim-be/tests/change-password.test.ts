import { describe, it, expect, beforeEach } from 'vitest';
import { request, registerUser } from './helpers/auth.helper';

const testUser = {
  name: 'Password User',
  email: 'pwuser@test.com',
  password: 'OldPass@123',
};

describe('Change Password API (Task 13.1)', () => {
  let accessToken: string;

  beforeEach(async () => {
    const res = await registerUser(testUser);
    accessToken = res.body.data.accessToken;
  });

  it('should return 401 without auth token', async () => {
    const res = await request.put('/api/auth/change-password').send({
      currentPassword: 'OldPass@123',
      newPassword: 'NewPass@456',
    });
    expect(res.status).toBe(401);
  });

  it('should change password successfully', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe('Password changed successfully');
  });

  it('should login with new password after change', async () => {
    await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });

    const res = await request.post('/api/auth/login').send({
      email: testUser.email,
      password: 'NewPass@456',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('should reject login with old password after change', async () => {
    await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPass@456',
      });

    const res = await request.post('/api/auth/login').send({
      email: testUser.email,
      password: 'OldPass@123',
    });
    expect(res.status).toBe(401);
  });

  it('should return 401 for wrong current password', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'WrongPass@999',
        newPassword: 'NewPass@456',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Current password is incorrect');
  });

  it('should return 400 for weak new password (too short)', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
        newPassword: 'Sh@1',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for new password missing special char', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
        newPassword: 'NewPassword123',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing currentPassword', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        newPassword: 'NewPass@456',
      });

    expect(res.status).toBe(400);
  });

  it('should return 400 for missing newPassword', async () => {
    const res = await request
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: 'OldPass@123',
      });

    expect(res.status).toBe(400);
  });
});
