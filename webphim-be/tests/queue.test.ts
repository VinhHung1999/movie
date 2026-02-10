import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs/promises';
import { enqueueTranscode, getJobProgress, getTranscodeQueue, startTranscodeWorker, closeQueueConnections } from '../src/services/queue.service';
import { videoService } from '../src/services/video.service';
import prisma from '../src/config/database';
import { Worker } from 'bullmq';

const TEST_VIDEO_PATH = path.resolve('tests/fixtures/test-video.mp4');

let worker: Worker;

beforeAll(async () => {
  // Start worker for processing
  worker = startTranscodeWorker();
  await fs.mkdir(path.resolve('uploads/raw'), { recursive: true });
});

afterEach(async () => {
  // Clean up queue jobs
  const queue = getTranscodeQueue();
  await queue.drain();
  // Clean videos from DB
  await prisma.video.deleteMany();
});

afterAll(async () => {
  await worker.close();
  await closeQueueConnections();
});

describe('Queue Service', () => {
  it('should enqueue a transcode job and return job ID', async () => {
    // Create a video record first
    const video = await videoService.create({
      originalName: 'test.mp4',
      originalPath: TEST_VIDEO_PATH,
      mimeType: 'video/mp4',
      fileSize: BigInt(50000),
      title: 'Queue test',
    });

    const jobId = await enqueueTranscode(video.id, TEST_VIDEO_PATH);

    expect(typeof jobId).toBe('string');
    expect(jobId.length).toBeGreaterThan(0);

    // Verify video status was updated to QUEUED
    const updated = await videoService.getById(video.id);
    expect(updated.status).toBe('QUEUED');
    expect(updated.transcodeJobId).toBe(jobId);
  });

  it('should process the transcode job and update video to COMPLETED', async () => {
    const video = await videoService.create({
      originalName: 'test.mp4',
      originalPath: TEST_VIDEO_PATH,
      mimeType: 'video/mp4',
      fileSize: BigInt(50000),
      title: 'Process test',
    });

    await enqueueTranscode(video.id, TEST_VIDEO_PATH);

    // Wait for worker to process (test video is ~2s, transcode should be fast)
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(async () => {
        const v = await videoService.getById(video.id);
        if (v.status === 'COMPLETED' || v.status === 'FAILED') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });

    const completed = await videoService.getById(video.id);
    expect(completed.status).toBe('COMPLETED');
    expect(completed.hlsPath).toBeTruthy();
    expect(completed.duration).toBeGreaterThan(0);
    expect(completed.thumbnailPaths.length).toBe(3);

    // Clean up HLS output
    const hlsDir = path.resolve('uploads/hls', video.id);
    await fs.rm(hlsDir, { recursive: true, force: true });
  }, 60000);

  it('should report job progress', async () => {
    const video = await videoService.create({
      originalName: 'test.mp4',
      originalPath: TEST_VIDEO_PATH,
      mimeType: 'video/mp4',
      fileSize: BigInt(50000),
      title: 'Progress test',
    });

    const jobId = await enqueueTranscode(video.id, TEST_VIDEO_PATH);

    // Check initial progress
    const initialProgress = await getJobProgress(jobId);
    // Progress could be 0 or null depending on timing
    expect(initialProgress === null || initialProgress === 0 || typeof initialProgress === 'number').toBe(true);

    // Wait for completion
    await new Promise<void>((resolve) => {
      const checkInterval = setInterval(async () => {
        const v = await videoService.getById(video.id);
        if (v.status === 'COMPLETED' || v.status === 'FAILED') {
          clearInterval(checkInterval);
          resolve();
        }
      }, 500);
    });

    // After completion, progress should be 100
    const finalProgress = await getJobProgress(jobId);
    expect(finalProgress).toBe(100);

    // Clean up
    const hlsDir = path.resolve('uploads/hls', video.id);
    await fs.rm(hlsDir, { recursive: true, force: true });
  }, 60000);

  it('should return null for non-existent job progress', async () => {
    const progress = await getJobProgress('non-existent-job-id');
    expect(progress).toBeNull();
  });
});
