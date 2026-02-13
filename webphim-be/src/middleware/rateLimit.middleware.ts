import rateLimit from 'express-rate-limit';

const isTest = process.env.NODE_ENV === 'test';

// Strict limiter for auth endpoints (login, register) — prevent brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => isTest,
});

// General API limiter — prevent abuse
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
  skip: () => isTest,
});
