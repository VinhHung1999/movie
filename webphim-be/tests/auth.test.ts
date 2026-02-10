import { describe, it, expect } from 'vitest';
import {
  request,
  validUser,
  secondUser,
  registerUser,
  loginUser,
  getRefreshTokenCookie,
  getAuthTokens,
} from './helpers/auth.helper';

// ============================================================
// Task 2.17: BE Unit Tests - Auth API Endpoints
// Test Framework: Vitest + Supertest
// API Contract: docs/architecture/sprint2-architecture.md
// ============================================================

describe('Auth API', () => {
  // ==========================================================
  // POST /api/auth/register
  // ==========================================================
  describe('POST /api/auth/register', () => {
    describe('Valid registration', () => {
      it('should register a new user and return 201', async () => {
        const res = await registerUser();

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data).toHaveProperty('accessToken');
      });

      it('should return user data without passwordHash', async () => {
        const res = await registerUser();

        const user = res.body.data.user;
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email', validUser.email);
        expect(user).toHaveProperty('name', validUser.name);
        expect(user).toHaveProperty('createdAt');
        expect(user).not.toHaveProperty('passwordHash');
        expect(user).not.toHaveProperty('password_hash');
        expect(user).not.toHaveProperty('password');
      });

      it('should set httpOnly refresh token cookie', async () => {
        const res = await registerUser();

        const cookie = getRefreshTokenCookie(res);
        expect(cookie).toBeDefined();
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('Path=/api/auth');
      });

      it('should return a valid JWT access token', async () => {
        const res = await registerUser();

        const accessToken = res.body.data.accessToken;
        expect(accessToken).toBeDefined();
        expect(typeof accessToken).toBe('string');
        // JWT format: header.payload.signature
        expect(accessToken.split('.')).toHaveLength(3);
      });
    });

    describe('Invalid input (400)', () => {
      it('should reject registration with missing email', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject registration with invalid email format', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'not-an-email', password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject registration with missing password', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'test@example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject password shorter than 8 characters', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'test@example.com', password: 'Pass1' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject password without uppercase letter', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject password without lowercase letter', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'test@example.com', password: 'PASSWORD123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject password without number', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'Test', email: 'test@example.com', password: 'Passwordabc' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject registration with missing name', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ email: 'test@example.com', password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject name shorter than 2 characters', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'A', email: 'test@example.com', password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject name longer than 50 characters', async () => {
        const res = await request
          .post('/api/auth/register')
          .send({ name: 'A'.repeat(51), email: 'test@example.com', password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject empty request body', async () => {
        const res = await request.post('/api/auth/register').send({});

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('Duplicate email (409)', () => {
      it('should reject registration with existing email', async () => {
        // Register first user
        await registerUser();

        // Try to register with same email
        const res = await registerUser();

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/already/i);
      });

      it('should be case-insensitive for email uniqueness', async () => {
        await registerUser({ ...validUser, email: 'Test@Example.com' });

        const res = await registerUser({ ...validUser, email: 'test@example.com' });

        expect(res.status).toBe(409);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ==========================================================
  // POST /api/auth/login
  // ==========================================================
  describe('POST /api/auth/login', () => {
    describe('Correct credentials', () => {
      it('should login successfully and return 200', async () => {
        await registerUser();

        const res = await loginUser();

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data).toHaveProperty('accessToken');
      });

      it('should return user data matching registered user', async () => {
        await registerUser();

        const res = await loginUser();

        expect(res.body.data.user.email).toBe(validUser.email);
        expect(res.body.data.user.name).toBe(validUser.name);
        expect(res.body.data.user).not.toHaveProperty('passwordHash');
      });

      it('should set httpOnly refresh token cookie', async () => {
        await registerUser();

        const res = await loginUser();

        const cookie = getRefreshTokenCookie(res);
        expect(cookie).toBeDefined();
        expect(cookie).toContain('HttpOnly');
      });

      it('should return a valid JWT access token', async () => {
        await registerUser();

        const res = await loginUser();

        const accessToken = res.body.data.accessToken;
        expect(accessToken).toBeDefined();
        expect(accessToken.split('.')).toHaveLength(3);
      });
    });

    describe('Wrong password (401)', () => {
      it('should reject login with wrong password', async () => {
        await registerUser();

        const res = await loginUser({ email: validUser.email, password: 'WrongPass123' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/invalid/i);
      });

      it('should not reveal whether email or password is wrong', async () => {
        await registerUser();

        const res = await loginUser({ email: validUser.email, password: 'WrongPass123' });

        // Should say "Invalid email or password", not "Wrong password"
        expect(res.body.message.toLowerCase()).not.toContain('password is wrong');
        expect(res.body.message.toLowerCase()).not.toContain('incorrect password');
      });
    });

    describe('Non-existent user (401)', () => {
      it('should reject login with non-existent email', async () => {
        const res = await loginUser({ email: 'nonexistent@example.com', password: 'Password123' });

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should return same error message as wrong password', async () => {
        await registerUser();

        const wrongPasswordRes = await loginUser({ email: validUser.email, password: 'WrongPass123' });
        const nonExistentRes = await loginUser({ email: 'no@example.com', password: 'Password123' });

        // Same message to prevent email enumeration
        expect(wrongPasswordRes.body.message).toBe(nonExistentRes.body.message);
      });
    });

    describe('Invalid input', () => {
      it('should reject login with missing email', async () => {
        const res = await request
          .post('/api/auth/login')
          .send({ password: 'Password123' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });

      it('should reject login with missing password', async () => {
        const res = await request
          .post('/api/auth/login')
          .send({ email: 'test@example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      });
    });
  });

  // ==========================================================
  // POST /api/auth/refresh
  // ==========================================================
  describe('POST /api/auth/refresh', () => {
    describe('Valid refresh token', () => {
      it('should issue a new access token', async () => {
        const { refreshCookie } = await getAuthTokens();

        const res = await request
          .post('/api/auth/refresh')
          .set('Cookie', refreshCookie!);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data.accessToken.split('.')).toHaveLength(3);
      });

      it('should set a new refresh token cookie (rotation)', async () => {
        const { refreshCookie } = await getAuthTokens();

        const res = await request
          .post('/api/auth/refresh')
          .set('Cookie', refreshCookie!);

        const newCookie = getRefreshTokenCookie(res);
        expect(newCookie).toBeDefined();
        expect(newCookie).toContain('HttpOnly');
      });

      it('should invalidate old refresh token after rotation', async () => {
        const { refreshCookie } = await getAuthTokens();

        // Use refresh token once
        await request
          .post('/api/auth/refresh')
          .set('Cookie', refreshCookie!);

        // Try to use old refresh token again
        const res = await request
          .post('/api/auth/refresh')
          .set('Cookie', refreshCookie!);

        expect(res.status).toBe(401);
      });
    });

    describe('Invalid/expired refresh token (401)', () => {
      it('should reject with no refresh token cookie', async () => {
        const res = await request.post('/api/auth/refresh');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject with invalid refresh token', async () => {
        const res = await request
          .post('/api/auth/refresh')
          .set('Cookie', 'refreshToken=invalid-token-value');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject after user logout (token revoked)', async () => {
        const { refreshCookie } = await getAuthTokens();

        // Logout first
        await request
          .post('/api/auth/logout')
          .set('Cookie', refreshCookie!);

        // Try to refresh after logout
        const res = await request
          .post('/api/auth/refresh')
          .set('Cookie', refreshCookie!);

        expect(res.status).toBe(401);
      });
    });
  });

  // ==========================================================
  // POST /api/auth/logout
  // ==========================================================
  describe('POST /api/auth/logout', () => {
    it('should logout successfully and return 200', async () => {
      const { refreshCookie } = await getAuthTokens();

      const res = await request
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie!);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should clear the refresh token cookie', async () => {
      const { refreshCookie } = await getAuthTokens();

      const res = await request
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie!);

      const cookie = getRefreshTokenCookie(res);
      // Cookie should be cleared (empty value or expired)
      if (cookie) {
        const isCleared =
          cookie.includes('refreshToken=;') ||
          cookie.includes('Expires=Thu, 01 Jan 1970') ||
          cookie.includes('Max-Age=0');
        expect(isCleared).toBe(true);
      }
    });

    it('should succeed even without a refresh token (idempotent)', async () => {
      const res = await request.post('/api/auth/logout');

      // Per API contract: logout always succeeds
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should invalidate the refresh token in database', async () => {
      const { refreshCookie } = await getAuthTokens();

      await request
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie!);

      // Try to use the invalidated token
      const res = await request
        .post('/api/auth/refresh')
        .set('Cookie', refreshCookie!);

      expect(res.status).toBe(401);
    });
  });

  // ==========================================================
  // GET /api/auth/me
  // ==========================================================
  describe('GET /api/auth/me', () => {
    describe('With valid access token', () => {
      it('should return current user info', async () => {
        const { accessToken } = await getAuthTokens();

        const res = await request
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user.email).toBe(validUser.email);
        expect(res.body.data.user.name).toBe(validUser.name);
      });

      it('should not include passwordHash in response', async () => {
        const { accessToken } = await getAuthTokens();

        const res = await request
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(res.body.data.user).not.toHaveProperty('passwordHash');
        expect(res.body.data.user).not.toHaveProperty('password_hash');
        expect(res.body.data.user).not.toHaveProperty('password');
      });

      it('should return correct UserResponse shape', async () => {
        const { accessToken } = await getAuthTokens();

        const res = await request
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        const user = res.body.data.user;
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('createdAt');
        expect(typeof user.id).toBe('string');
        expect(typeof user.email).toBe('string');
        expect(typeof user.name).toBe('string');
      });
    });

    describe('Without access token (401)', () => {
      it('should reject request without Authorization header', async () => {
        const res = await request.get('/api/auth/me');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject request with empty Bearer token', async () => {
        const res = await request
          .get('/api/auth/me')
          .set('Authorization', 'Bearer ');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject request with invalid token', async () => {
        const res = await request
          .get('/api/auth/me')
          .set('Authorization', 'Bearer invalid-token-string');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });

      it('should reject request with malformed Authorization header', async () => {
        const res = await request
          .get('/api/auth/me')
          .set('Authorization', 'NotBearer sometoken');

        expect(res.status).toBe(401);
        expect(res.body.success).toBe(false);
      });
    });
  });
});
