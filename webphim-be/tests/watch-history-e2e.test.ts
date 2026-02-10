import { describe, it, expect, afterAll } from 'vitest';
import supertest from 'supertest';
import path from 'path';
import fs from 'fs/promises';
import app from '../src/app';
import prisma from '../src/config/database';
import { config } from '../src/config';
import { getAuthTokens } from './helpers/auth.helper';
import { createTestContent } from './helpers/content.helper';
import { startTranscodeWorker, closeQueueConnections } from '../src/services/queue.service';
import { closeRedisConnection } from '../src/config/redis';

const request = supertest(app);
const TEST_VIDEO_PATH = path.join(__dirname, 'fixtures', 'test-video.mp4');

// Track video IDs for file cleanup
const createdVideoIds: string[] = [];

/**
 * Helper: register user and get auth token
 */
async function getToken(): Promise<string> {
  const { accessToken } = await getAuthTokens();
  return accessToken;
}

// Cleanup
afterAll(async () => {
  const rawDir = path.join(config.storage.localDir, 'raw');
  try {
    const files = await fs.readdir(rawDir);
    for (const file of files) {
      await fs.unlink(path.join(rawDir, file)).catch(() => {});
    }
  } catch { /* dir may not exist */ }

  for (const videoId of createdVideoIds) {
    await fs.rm(path.join(config.storage.localDir, 'hls', videoId), { recursive: true, force: true }).catch(() => {});
  }

  await closeQueueConnections();
  await closeRedisConnection();
});

// ============================================
// FULL E2E: Upload → Transcode → Stream → Watch Progress → Continue Watching
// 7-step strategy from TL arch doc Section 10
// ============================================

describe('Player E2E Test (Task 7.9)', () => {
  it('should complete 7-step flow: upload → transcode → stream → save progress → get progress → continue watching → finished exclusion', async () => {
    const token = await getToken();
    const content = await createTestContent({ title: 'E2E Pipeline Movie' });

    // === Step 1: Upload test video (reuse fixture) ===
    const uploadRes = await request
      .post('/api/videos/upload')
      .set('Authorization', `Bearer ${token}`)
      .field('title', 'E2E Pipeline Video')
      .field('contentId', content.id)
      .attach('video', TEST_VIDEO_PATH);

    expect(uploadRes.status).toBe(201);
    const videoId = uploadRes.body.data.id;
    createdVideoIds.push(videoId);
    expect(uploadRes.body.data.status).toBe('UPLOADED');
    expect(uploadRes.body.data.contentId).toBe(content.id);

    // === Step 2: Transcode → COMPLETED ===
    const worker = startTranscodeWorker();
    try {
      const transcodeRes = await request
        .post(`/api/videos/${videoId}/transcode`)
        .set('Authorization', `Bearer ${token}`);

      expect(transcodeRes.status).toBe(202);
      expect(transcodeRes.body.data.status).toBe('QUEUED');

      let status = 'QUEUED';
      let pollCount = 0;
      while (!['COMPLETED', 'FAILED'].includes(status) && pollCount < 60) {
        await new Promise((r) => setTimeout(r, 2000));
        pollCount++;
        const statusRes = await request
          .get(`/api/videos/${videoId}/status`)
          .set('Authorization', `Bearer ${token}`);
        status = statusRes.body.data.status;
      }
      expect(status).toBe('COMPLETED');
    } finally {
      await worker.close();
    }

    // === Step 3: Verify stream URL ===
    const streamRes = await request
      .get(`/api/videos/${videoId}/stream`)
      .set('Authorization', `Bearer ${token}`);

    expect(streamRes.status).toBe(200);
    expect(streamRes.body.data.streamUrl).toContain('master.m3u8');
    expect(streamRes.body.data.status).toBe('COMPLETED');
    expect(streamRes.body.data.duration).toBeGreaterThan(0);

    // Verify master.m3u8 file is valid HLS
    const hlsDir = path.join(config.storage.localDir, 'hls', videoId);
    const masterPlaylist = await fs.readFile(path.join(hlsDir, 'master.m3u8'), 'utf-8');
    expect(masterPlaylist).toContain('#EXTM3U');
    expect(masterPlaylist).toContain('#EXT-X-STREAM-INF');

    // === Step 4: Save watch progress (POST) - 50% watched ===
    const saveRes = await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 3600, duration: 7200 });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.success).toBe(true);
    expect(saveRes.body.data).toMatchObject({
      contentId: content.id,
      progress: 3600,
      duration: 7200,
    });

    // === Step 5: Get progress (GET) ===
    const getRes = await request
      .get(`/api/watch-history/${content.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.progress).toBe(3600);
    expect(getRes.body.data.duration).toBe(7200);

    // === Step 6: Continue watching list (5%-90% filter) ===
    const continueRes = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(continueRes.status).toBe(200);
    const found = continueRes.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(found).toBeDefined();
    expect(found.progressPercent).toBe(50);
    expect(found.content).toMatchObject({
      id: content.id,
      title: 'E2E Pipeline Movie',
      type: 'MOVIE',
    });

    // === Step 7: Finish video (95%) → NOT in continue watching ===
    const finishRes = await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 6840, duration: 7200 }); // 95%

    expect(finishRes.status).toBe(200);
    expect(finishRes.body.data.progress).toBe(6840);

    const afterFinish = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(afterFinish.status).toBe(200);
    const stillFound = afterFinish.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(stillFound).toBeUndefined(); // Finished video excluded from continue watching
  }, 120_000); // 2 minute timeout for transcode

  it('should handle boundary: exactly 5% progress NOT in continue watching (strictly > 5%)', async () => {
    const token = await getToken();
    const content = await createTestContent({ title: 'Boundary Test Movie' });

    // Save exactly 5% progress (360/7200 = 0.05)
    await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 360, duration: 7200 });

    const res = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Filter is strictly > 0.05, so exactly 5% should NOT be included
    const found = res.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(found).toBeUndefined();
  });

  it('should handle boundary: 6% progress IS in continue watching', async () => {
    const token = await getToken();
    const content = await createTestContent({ title: 'Above Threshold Movie' });

    // Save 6% progress (432/7200 = 0.06)
    await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 432, duration: 7200 });

    const res = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = res.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(found).toBeDefined();
    expect(found.progressPercent).toBe(6);
  });

  it('should handle boundary: exactly 90% progress NOT in continue watching (strictly < 90%)', async () => {
    const token = await getToken();
    const content = await createTestContent({ title: 'Upper Boundary Movie' });

    // Save exactly 90% progress (6480/7200 = 0.90)
    await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 6480, duration: 7200 });

    const res = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    // Filter is strictly < 0.90, so exactly 90% should NOT be included
    const found = res.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(found).toBeUndefined();
  });

  it('should handle boundary: 89% progress IS in continue watching', async () => {
    const token = await getToken();
    const content = await createTestContent({ title: 'Below Upper Movie' });

    // Save 89% progress (6408/7200 = 0.89)
    await request
      .post('/api/watch-history')
      .set('Authorization', `Bearer ${token}`)
      .send({ contentId: content.id, progress: 6408, duration: 7200 });

    const res = await request
      .get('/api/watch-history/continue')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const found = res.body.data.find(
      (item: { contentId: string }) => item.contentId === content.id,
    );
    expect(found).toBeDefined();
    expect(found.progressPercent).toBe(89);
  });
});
