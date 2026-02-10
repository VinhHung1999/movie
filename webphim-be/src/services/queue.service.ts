// UPLOAD LEARN 7: Redis Queue.
// Job nằm trong Redis chờ Worker xử lý. Worker lấy job → cập nhật status PROCESSING
// → gọi FFmpeg transcode (LEARN 8) → xong thì COMPLETED.
// Concurrency=1 vì transcode rất nặng CPU.

import { Queue, Worker, Job } from 'bullmq';
import path from 'path';
import { createRedisConnection } from '../config/redis';
import { config } from '../config';
import { videoService } from './video.service';
import { transcodeToHLS } from './ffmpeg.service';

const QUEUE_NAME = 'video-transcode';

export interface TranscodeJobData {
  videoId: string;
  inputPath: string;
  outputDir: string;
}

// Queue for enqueuing transcode jobs
let transcodeQueue: Queue<TranscodeJobData> | null = null;

export function getTranscodeQueue(): Queue<TranscodeJobData> {
  if (!transcodeQueue) {
    transcodeQueue = new Queue<TranscodeJobData>(QUEUE_NAME, {
      connection: createRedisConnection(),
    });
  }
  return transcodeQueue;
}

/**
 * Enqueue a video for transcoding
 */
export async function enqueueTranscode(videoId: string, inputPath: string): Promise<string> {
  const outputDir = path.join(config.storage.localDir, 'hls', videoId);

  const queue = getTranscodeQueue();
  const job = await queue.add('transcode', {
    videoId,
    inputPath,
    outputDir,
  }, {
    attempts: 1,
    removeOnComplete: false,
    removeOnFail: false,
  });

  // Update video status to QUEUED with job ID
  await videoService.updateStatus(videoId, 'QUEUED', {
    transcodeJobId: job.id,
  });

  return job.id!;
}

/**
 * Get job progress (0-100)
 */
export async function getJobProgress(jobId: string): Promise<number | null> {
  const queue = getTranscodeQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const progress = job.progress;
  return typeof progress === 'number' ? progress : null;
}

/**
 * Start the transcode worker
 */
export function startTranscodeWorker(): Worker<TranscodeJobData> {
  const worker = new Worker<TranscodeJobData>(
    QUEUE_NAME,
    async (job: Job<TranscodeJobData>) => {
      const { videoId, inputPath, outputDir } = job.data;

      // Update status to PROCESSING
      await videoService.updateStatus(videoId, 'PROCESSING');

      try {
        // Run transcode with progress updates
        const result = await transcodeToHLS(inputPath, outputDir, async (percent) => {
          await job.updateProgress(percent);
        });

        // Update video record with results
        await videoService.updateStatus(videoId, 'COMPLETED', {
          hlsPath: result.hlsPath,
          thumbnailPaths: result.thumbnailPaths,
          duration: result.duration,
        });

        return result;
      } catch (error) {
        // Update video status to FAILED
        const errorMessage = error instanceof Error ? error.message : 'Unknown transcode error';
        await videoService.updateStatus(videoId, 'FAILED', {
          errorMessage,
        });
        throw error;
      }
    },
    {
      connection: createRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    console.log(`[Transcode] Job ${job.id} completed for video ${job.data.videoId}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Transcode] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

/**
 * Close queue and worker connections
 */
export async function closeQueueConnections(): Promise<void> {
  if (transcodeQueue) {
    await transcodeQueue.close();
    transcodeQueue = null;
  }
}
