import { describe, it, expect, beforeEach } from 'vitest';
import path from 'path';
import { request, getAuthTokens } from './helpers/auth.helper';
import prisma from '../src/config/database';

const TEST_VIDEO_PATH = path.resolve('tests/fixtures/test-video.mp4');

let accessToken: string;

beforeEach(async () => {
  const tokens = await getAuthTokens();
  accessToken = tokens.accessToken;
});

// ============================================
// GET /api/videos/:id/stream
// ============================================

describe('GET /api/videos/:id/stream', () => {
  it('should return 409 when video transcoding not complete', async () => {
    // Upload a video (status will be UPLOADED)
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Not transcoded')
      .attach('video', TEST_VIDEO_PATH);

    const videoId = uploadRes.body.data.id;

    const res = await request
      .get(`/api/videos/${videoId}/stream`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Video transcoding not yet complete');
  });

  it('should return stream URL when video is COMPLETED', async () => {
    // Upload and manually set to COMPLETED for testing
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .field('title', 'Completed video')
      .attach('video', TEST_VIDEO_PATH);

    const videoId = uploadRes.body.data.id;

    // Manually update to COMPLETED with HLS path
    await prisma.video.update({
      where: { id: videoId },
      data: {
        status: 'COMPLETED',
        hlsPath: `hls/${videoId}/master.m3u8`,
        thumbnailPaths: [
          `hls/${videoId}/thumb_001.jpg`,
          `hls/${videoId}/thumb_002.jpg`,
        ],
        duration: 120.5,
      },
    });

    const res = await request
      .get(`/api/videos/${videoId}/stream`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.videoId).toBe(videoId);
    expect(res.body.data.streamUrl).toBe(`/uploads/hls/${videoId}/master.m3u8`);
    expect(res.body.data.thumbnails).toHaveLength(2);
    expect(res.body.data.thumbnails[0]).toContain('/uploads/');
    expect(res.body.data.duration).toBe(120.5);
    expect(res.body.data.status).toBe('COMPLETED');
  });

  it('should return 404 for non-existent video', async () => {
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request
      .get(`/api/videos/${fakeId}/stream`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without auth token', async () => {
    const res = await request.get('/api/videos/some-id/stream');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// HLS Static Files
// ============================================

describe('HLS Static File Serving', () => {
  it('should return 404 for non-existent HLS file', async () => {
    const res = await request.get('/uploads/hls/nonexistent/master.m3u8');

    expect(res.status).toBe(404);
  });
});
