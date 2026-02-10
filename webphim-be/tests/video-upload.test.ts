import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { request, getAuthTokens } from './helpers/auth.helper';

const TEST_VIDEO_PATH = path.resolve('tests/fixtures/test-video.mp4');

let accessToken: string;

beforeEach(async () => {
  const tokens = await getAuthTokens();
  accessToken = tokens.accessToken;
});

// ============================================
// POST /api/videos/upload
// ============================================

describe('POST /api/videos/upload', () => {
  it('should upload a video file and return 201', async () => {
    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Test Upload Video')
      .attach('video', TEST_VIDEO_PATH);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.originalName).toBe('test-video.mp4');
    expect(res.body.data.mimeType).toBe('video/mp4');
    expect(typeof res.body.data.fileSize).toBe('number');
    expect(res.body.data.status).toBe('UPLOADED');
    expect(res.body.data).toHaveProperty('createdAt');
  });

  it('should upload with optional description', async () => {
    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Video with description')
      .field('description', 'A test video description')
      .attach('video', TEST_VIDEO_PATH);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('should return 400 when no file is provided', async () => {
    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'No file');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 when title is missing', async () => {
    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('video', TEST_VIDEO_PATH);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without auth token', async () => {
    // Don't attach file - auth middleware rejects before multer processes,
    // which can cause EPIPE when supertest streams the file
    const res = await request
      .post('/api/videos/upload')
      .field('title', 'Unauthenticated');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 400 for invalid contentId', async () => {
    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Bad content ref')
      .field('contentId', 'not-a-uuid')
      .attach('video', TEST_VIDEO_PATH);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// GET /api/videos/:id/status
// ============================================

describe('GET /api/videos/:id/status', () => {
  it('should return video status after upload', async () => {
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Status check video')
      .attach('video', TEST_VIDEO_PATH);

    const videoId = uploadRes.body.data.id;

    const res = await request
      .get(`/api/videos/${videoId}/status`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(videoId);
    expect(res.body.data.status).toBe('UPLOADED');
    expect(res.body.data.originalName).toBe('test-video.mp4');
    expect(typeof res.body.data.fileSize).toBe('number');
  });

  it('should return 404 for non-existent video', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request
      .get(`/api/videos/${fakeId}/status`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// GET /api/videos (list)
// ============================================

describe('GET /api/videos', () => {
  it('should list videos with pagination', async () => {
    // Upload 2 videos
    await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Video 1')
      .attach('video', TEST_VIDEO_PATH);
    await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Video 2')
      .attach('video', TEST_VIDEO_PATH);

    const res = await request
      .get('/api/videos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.videos.length).toBe(2);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('should return empty list when no videos', async () => {
    const res = await request
      .get('/api/videos')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.videos).toEqual([]);
    expect(res.body.data.pagination.total).toBe(0);
  });
});

// ============================================
// POST /api/videos/:id/transcode
// ============================================

describe('POST /api/videos/:id/transcode', () => {
  it('should queue a video for transcode', async () => {
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Transcode me')
      .attach('video', TEST_VIDEO_PATH);

    const videoId = uploadRes.body.data.id;

    const res = await request
      .post(`/api/videos/${videoId}/transcode`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(202);
    expect(res.body.success).toBe(true);
    expect(res.body.data.videoId).toBe(videoId);
    expect(res.body.data.status).toBe('QUEUED');
  });

  it('should return 409 if already queued', async () => {
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Already queued')
      .attach('video', TEST_VIDEO_PATH);

    const videoId = uploadRes.body.data.id;

    // First transcode
    await request
      .post(`/api/videos/${videoId}/transcode`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Second attempt should conflict
    const res = await request
      .post(`/api/videos/${videoId}/transcode`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should return 404 for non-existent video', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await request
      .post(`/api/videos/${fakeId}/transcode`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
