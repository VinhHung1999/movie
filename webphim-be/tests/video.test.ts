import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../src/app';
import prisma from '../src/config/database';
import { config } from '../src/config';
import { getAuthTokens } from './helpers/auth.helper';
import { startTranscodeWorker, closeQueueConnections, getTranscodeQueue } from '../src/services/queue.service';
import { closeRedisConnection } from '../src/config/redis';

const request = supertest(app);
const TEST_VIDEO_PATH = path.join(__dirname, 'fixtures', 'test-video.mp4');

// Track video IDs for file cleanup
const createdVideoIds: string[] = [];

/**
 * Helper: register user and get auth token (needed because afterEach cleans DB)
 */
async function getToken(): Promise<string> {
  const { accessToken } = await getAuthTokens();
  return accessToken;
}

/**
 * Helper: upload a test video and return the response
 */
async function uploadTestVideo(token: string, overrides?: { title?: string; description?: string }) {
  const req = request
    .post('/api/videos/upload')
    .set('Authorization', `Bearer ${token}`)
    .field('title', overrides?.title || 'Test Video');

  if (overrides?.description) {
    req.field('description', overrides.description);
  }

  const res = await req.attach('video', TEST_VIDEO_PATH);

  if (res.body.data?.id) {
    createdVideoIds.push(res.body.data.id);
  }

  return res;
}

// Clean up files created during tests
afterAll(async () => {
  // Clean up raw upload files
  const rawDir = path.join(config.storage.localDir, 'raw');
  try {
    const files = await fs.readdir(rawDir);
    for (const file of files) {
      await fs.unlink(path.join(rawDir, file)).catch(() => {});
    }
  } catch {
    // rawDir may not exist
  }

  // Clean up HLS output directories for tracked videos
  for (const videoId of createdVideoIds) {
    const hlsDir = path.join(config.storage.localDir, 'hls', videoId);
    await fs.rm(hlsDir, { recursive: true, force: true }).catch(() => {});
  }

  // Close BullMQ queue connections
  await closeQueueConnections();

  // Close Redis
  await closeRedisConnection();
});

// ============================================
// UPLOAD TESTS - POST /api/videos/upload
// ============================================

describe('POST /api/videos/upload', () => {
  it('should upload valid MP4 and return 201 with DB record', async () => {
    const token = await getToken();
    const res = await uploadTestVideo(token);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      originalName: 'test-video.mp4',
      mimeType: 'video/mp4',
      status: 'UPLOADED',
    });
    expect(res.body.data.id).toBeDefined();
    expect(typeof res.body.data.id).toBe('string');
    expect(res.body.data.fileSize).toBeGreaterThan(0);
    expect(res.body.data.createdAt).toBeDefined();

    // Verify DB record
    const dbVideo = await prisma.video.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbVideo).not.toBeNull();
    expect(dbVideo!.status).toBe('UPLOADED');
    expect(dbVideo!.originalName).toBe('test-video.mp4');
    expect(dbVideo!.mimeType).toBe('video/mp4');
    expect(Number(dbVideo!.fileSize)).toBeGreaterThan(0);
  });

  it('should upload with optional description', async () => {
    const token = await getToken();
    const res = await uploadTestVideo(token, {
      title: 'Video with Description',
      description: 'A test video with a description',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.originalName).toBe('test-video.mp4');
  });

  it('should verify uploaded file exists on disk', async () => {
    const token = await getToken();
    const res = await uploadTestVideo(token);

    expect(res.status).toBe(201);

    // Verify the file exists in uploads/raw/
    const dbVideo = await prisma.video.findUnique({
      where: { id: res.body.data.id },
    });
    expect(dbVideo).not.toBeNull();

    try {
      await fs.access(dbVideo!.originalPath);
    } catch {
      throw new Error(`Uploaded file not found at ${dbVideo!.originalPath}`);
    }
  });

  it('should return 400 when file type is not allowed', async () => {
    const token = await getToken();

    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Bad File Type')
      .attach('video', Buffer.from('this is not a video'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].field).toBe('video');
    expect(res.body.errors[0].message).toContain('File type not allowed');
  });

  it('should return 400 when no video file provided', async () => {
    const token = await getToken();

    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'Missing File');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].field).toBe('video');
  });

  it('should return 400 when title is missing', async () => {
    const token = await getToken();

    const res = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('video', TEST_VIDEO_PATH);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 without authentication', async () => {
    // Auth middleware runs before multer, so no need to attach file
    const res = await request
      .post('/api/videos/upload')
      .field('title', 'No Auth');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// TRANSCODE ERROR TESTS - POST /api/videos/:id/transcode
// ============================================

describe('POST /api/videos/:id/transcode - error cases', () => {
  it('should return 404 for non-existent video', async () => {
    const token = await getToken();
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request
      .post(`/api/videos/${fakeId}/transcode`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Video not found');
  });

  it('should return 409 for already-transcoding video', async () => {
    const token = await getToken();

    // Create video record directly with QUEUED status
    const video = await prisma.video.create({
      data: {
        originalName: 'test.mp4',
        originalPath: '/tmp/fake.mp4',
        mimeType: 'video/mp4',
        fileSize: BigInt(1000),
        status: 'QUEUED',
      },
    });

    const res = await request
      .post(`/api/videos/${video.id}/transcode`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Video is already being transcoded');
  });
});

// ============================================
// STREAM ERROR TESTS - GET /api/videos/:id/stream
// ============================================

describe('GET /api/videos/:id/stream - error cases', () => {
  it('should return 404 for non-existent video', async () => {
    const token = await getToken();
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request
      .get(`/api/videos/${fakeId}/stream`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('should return 409 for video not yet transcoded', async () => {
    const token = await getToken();

    // Create video with UPLOADED status (not transcoded yet)
    const video = await prisma.video.create({
      data: {
        originalName: 'test.mp4',
        originalPath: '/tmp/fake.mp4',
        mimeType: 'video/mp4',
        fileSize: BigInt(1000),
        status: 'UPLOADED',
      },
    });

    const res = await request
      .get(`/api/videos/${video.id}/stream`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Video transcoding not yet complete');
  });
});

// ============================================
// FULL INTEGRATION: Upload → Transcode → Stream
// ============================================

describe('Full Integration: Upload → Transcode → Stream', () => {
  it('should complete full flow: upload → transcode → event-driven wait → stream', async () => {
    const token = await getToken();

    // --- Step 1: Upload ---
    const uploadRes = await uploadTestVideo(token, { title: 'Integration Test Video' });
    expect(uploadRes.status).toBe(201);
    const videoId = uploadRes.body.data.id;
    expect(videoId).toBeDefined();

    // --- Step 2: Start worker ---
    const worker = startTranscodeWorker();

    try {
      // --- Step 3: Set up event-driven wait BEFORE triggering transcode ---
      const jobCompleted = new Promise<void>((resolve, reject) => {
        worker.on('completed', (job) => {
          if (job.data.videoId === videoId) resolve();
        });
        worker.on('failed', (job, err) => {
          if (job?.data.videoId === videoId) reject(err);
        });
        setTimeout(() => reject(new Error('Transcode timeout after 120s')), 120_000);
      });

      // --- Step 4: Trigger transcode ---
      const transcodeRes = await request
        .post(`/api/videos/${videoId}/transcode`)
        .set('Authorization', `Bearer ${token}`);

      expect(transcodeRes.status).toBe(202);
      expect(transcodeRes.body.success).toBe(true);
      expect(transcodeRes.body.data).toMatchObject({
        videoId,
        status: 'QUEUED',
      });
      expect(transcodeRes.body.data.jobId).toBeDefined();

      // --- Step 5: Wait for completion via event (no polling) ---
      await jobCompleted;

      // --- Step 6: Verify final state via API ---
      const statusRes = await request
        .get(`/api/videos/${videoId}/status`)
        .set('Authorization', `Bearer ${token}`);

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.success).toBe(true);
      expect(statusRes.body.data.status).toBe('COMPLETED');
      expect(statusRes.body.data.duration).toBeGreaterThan(0);
      expect(statusRes.body.data.hlsPath).toBeDefined();
      expect(statusRes.body.data.hlsPath).toContain('master.m3u8');
      expect(statusRes.body.data.progress).toBe(100);

      // --- Step 7: Verify DB record ---
      const dbVideo = await prisma.video.findUnique({
        where: { id: videoId },
      });
      expect(dbVideo).not.toBeNull();
      expect(dbVideo!.status).toBe('COMPLETED');
      expect(dbVideo!.duration).toBeGreaterThan(0);
      expect(dbVideo!.hlsPath).toContain('master.m3u8');
      expect(dbVideo!.thumbnailPaths.length).toBeGreaterThan(0);

      // --- Step 8: Get stream URL ---
      const streamRes = await request
        .get(`/api/videos/${videoId}/stream`)
        .set('Authorization', `Bearer ${token}`);

      expect(streamRes.status).toBe(200);
      expect(streamRes.body.success).toBe(true);
      expect(streamRes.body.data.videoId).toBe(videoId);
      expect(streamRes.body.data.streamUrl).toContain('master.m3u8');
      expect(streamRes.body.data.duration).toBeGreaterThan(0);
      expect(streamRes.body.data.status).toBe('COMPLETED');
      expect(Array.isArray(streamRes.body.data.thumbnails)).toBe(true);

      // --- Step 9: Verify master.m3u8 is valid HLS ---
      const hlsDir = path.join(config.storage.localDir, 'hls', videoId);
      const masterPlaylist = await fs.readFile(path.join(hlsDir, 'master.m3u8'), 'utf-8');

      expect(masterPlaylist).toContain('#EXTM3U');
      expect(masterPlaylist).toContain('#EXT-X-STREAM-INF');
      expect(masterPlaylist).toContain('1080p/playlist.m3u8');
      expect(masterPlaylist).toContain('720p/playlist.m3u8');
      expect(masterPlaylist).toContain('480p/playlist.m3u8');
      expect(masterPlaylist).toContain('360p/playlist.m3u8');

    } finally {
      // Always close worker
      await worker.close();
    }
  }, 180_000); // 3 minute timeout for integration describe block
});

// ============================================
// STATUS POLLING - GET /api/videos/:id/status
// ============================================

describe('GET /api/videos/:id/status', () => {
  it('should return status for uploaded video', async () => {
    const token = await getToken();
    const uploadRes = await uploadTestVideo(token);
    const videoId = uploadRes.body.data.id;

    const res = await request
      .get(`/api/videos/${videoId}/status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      id: videoId,
      status: 'UPLOADED',
      originalName: 'test-video.mp4',
    });
    expect(res.body.data.fileSize).toBeGreaterThan(0);
    expect(res.body.data.progress).toBeNull();
  });

  it('should return 404 for non-existent video', async () => {
    const token = await getToken();
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const res = await request
      .get(`/api/videos/${fakeId}/status`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

// ============================================
// LIST VIDEOS - GET /api/videos
// ============================================

describe('GET /api/videos', () => {
  it('should list videos with pagination', async () => {
    const token = await getToken();

    // Upload 2 videos
    await uploadTestVideo(token, { title: 'Video 1' });
    await uploadTestVideo(token, { title: 'Video 2' });

    const res = await request
      .get('/api/videos')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.videos.length).toBe(2);
    expect(res.body.data.pagination).toMatchObject({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    // Verify video shape
    const video = res.body.data.videos[0];
    expect(video.id).toBeDefined();
    expect(video.originalName).toBeDefined();
    expect(typeof video.fileSize).toBe('number');
    expect(video.status).toBe('UPLOADED');
    expect(video.createdAt).toBeDefined();
  });

  it('should filter by status', async () => {
    const token = await getToken();

    // Upload a video (status UPLOADED)
    await uploadTestVideo(token, { title: 'Uploaded Video' });

    // Create a QUEUED video directly
    await prisma.video.create({
      data: {
        originalName: 'queued.mp4',
        originalPath: '/tmp/fake.mp4',
        mimeType: 'video/mp4',
        fileSize: BigInt(1000),
        status: 'QUEUED',
      },
    });

    const res = await request
      .get('/api/videos?status=UPLOADED')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.videos.length).toBe(1);
    expect(res.body.data.videos[0].status).toBe('UPLOADED');
  });
});
