import supertest from 'supertest';
import app from '../../src/app';

export const request = supertest(app);

// Test user data
export const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'Password123',
};

export const secondUser = {
  name: 'Second User',
  email: 'second@example.com',
  password: 'Password456',
};

/**
 * Register a user and return the response
 */
export async function registerUser(userData = validUser) {
  return request.post('/api/auth/register').send(userData);
}

/**
 * Login a user and return the response
 */
export async function loginUser(credentials?: { email: string; password: string }) {
  const { email, password } = credentials || validUser;
  return request.post('/api/auth/login').send({ email, password });
}

/**
 * Extract refresh token cookie from response
 */
export function getRefreshTokenCookie(res: supertest.Response): string | undefined {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return undefined;
  const cookieArray = Array.isArray(cookies) ? cookies : [cookies];
  const refreshCookie = cookieArray.find((c: string) => c.startsWith('refreshToken='));
  if (!refreshCookie) return undefined;
  return refreshCookie;
}

/**
 * Register + login and return accessToken + refreshToken cookie
 */
export async function getAuthTokens(userData = validUser) {
  const res = await registerUser(userData);
  const accessToken = res.body.data?.accessToken;
  const refreshCookie = getRefreshTokenCookie(res);
  return { accessToken, refreshCookie, response: res };
}
