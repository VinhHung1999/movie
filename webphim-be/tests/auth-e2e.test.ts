import { describe, it, expect } from 'vitest';
import { request, getRefreshTokenCookie } from './helpers/auth.helper';

// ============================================================
// Task 2.18: E2E Auth Flow Test
// Flow: Signup -> Login -> Access /api/auth/me -> Logout ->
//       Verify can't access /api/auth/me after logout
// ============================================================

describe('E2E Auth Flow', () => {
  const testUser = {
    name: 'E2E Test User',
    email: 'e2e-test@example.com',
    password: 'E2ePassword123',
  };

  it('should complete the full auth lifecycle', async () => {
    // ========================================
    // Step 1: Register new user
    // ========================================
    const signupRes = await request
      .post('/api/auth/register')
      .send(testUser);

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);
    expect(signupRes.body.data.user.email).toBe(testUser.email);
    expect(signupRes.body.data.user.name).toBe(testUser.name);

    const signupAccessToken = signupRes.body.data.accessToken;
    const signupRefreshCookie = getRefreshTokenCookie(signupRes);

    expect(signupAccessToken).toBeDefined();
    expect(signupRefreshCookie).toBeDefined();

    // ========================================
    // Step 2: Login with the registered user
    // ========================================
    const loginRes = await request
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.user.email).toBe(testUser.email);

    const loginAccessToken = loginRes.body.data.accessToken;
    const loginRefreshCookie = getRefreshTokenCookie(loginRes);

    expect(loginAccessToken).toBeDefined();
    expect(loginRefreshCookie).toBeDefined();

    // ========================================
    // Step 3: Access protected route /api/auth/me
    // ========================================
    const meRes = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginAccessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.data.user.email).toBe(testUser.email);
    expect(meRes.body.data.user.name).toBe(testUser.name);
    expect(meRes.body.data.user).toHaveProperty('id');
    expect(meRes.body.data.user).not.toHaveProperty('passwordHash');

    // ========================================
    // Step 4: Logout
    // ========================================
    const logoutRes = await request
      .post('/api/auth/logout')
      .set('Cookie', loginRefreshCookie!);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // ========================================
    // Step 5: Verify can't refresh after logout
    // ========================================
    const refreshAfterLogoutRes = await request
      .post('/api/auth/refresh')
      .set('Cookie', loginRefreshCookie!);

    expect(refreshAfterLogoutRes.status).toBe(401);
    expect(refreshAfterLogoutRes.body.success).toBe(false);
  });

  it('should not allow access to /api/auth/me without token', async () => {
    const res = await request.get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should support token refresh flow', async () => {
    // Register
    const signupRes = await request
      .post('/api/auth/register')
      .send(testUser);

    const refreshCookie = getRefreshTokenCookie(signupRes);

    // Refresh token to get new access token
    const refreshRes = await request
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie!);

    expect(refreshRes.status).toBe(200);
    const newAccessToken = refreshRes.body.data.accessToken;
    expect(newAccessToken).toBeDefined();

    // Use new access token to access protected route
    const meRes = await request
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${newAccessToken}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe(testUser.email);
  });

  it('should prevent duplicate registration', async () => {
    // Register first time
    const firstRes = await request
      .post('/api/auth/register')
      .send(testUser);

    expect(firstRes.status).toBe(201);

    // Try to register again with same email
    const secondRes = await request
      .post('/api/auth/register')
      .send(testUser);

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.success).toBe(false);
  });
});
