import { describe, it, expect } from 'vitest';
import supertest from 'supertest';
import app from '../src/app';

const request = supertest(app);

describe('GET /api/health', () => {
  it('should return 200 with health status', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.uptime).toBe('number');
    expect(res.body.uptime).toBeGreaterThan(0);
  });
});
