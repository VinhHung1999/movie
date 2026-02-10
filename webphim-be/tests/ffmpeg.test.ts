import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { transcodeToHLS, generateThumbnails, getVideoDuration, HLS_PROFILES } from '../src/services/ffmpeg.service';

const TEST_VIDEO_PATH = path.resolve('tests/fixtures/test-video.mp4');
const TEST_OUTPUT_DIR = path.resolve('uploads_test/hls/ffmpeg-test');

beforeAll(async () => {
  await fs.mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

afterAll(async () => {
  await fs.rm(path.resolve('uploads_test'), { recursive: true, force: true });
});

describe('FFmpeg Service', () => {
  describe('getVideoDuration', () => {
    it('should return duration in seconds', async () => {
      const duration = await getVideoDuration(TEST_VIDEO_PATH);

      expect(typeof duration).toBe('number');
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10); // test video is ~2s
    });
  });

  describe('generateThumbnails', () => {
    it('should generate the specified number of thumbnails', async () => {
      const thumbDir = path.join(TEST_OUTPUT_DIR, 'thumbs');
      await fs.mkdir(thumbDir, { recursive: true });

      const paths = await generateThumbnails(TEST_VIDEO_PATH, thumbDir, 3);

      expect(paths.length).toBe(3);
      for (const p of paths) {
        const stat = await fs.stat(p);
        expect(stat.size).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('transcodeToHLS', () => {
    it('should transcode to HLS with all quality variants', async () => {
      const hlsDir = path.join(TEST_OUTPUT_DIR, 'transcode');

      const progressValues: number[] = [];
      const result = await transcodeToHLS(TEST_VIDEO_PATH, hlsDir, (percent) => {
        progressValues.push(percent);
      });

      // Check master playlist exists
      expect(result.hlsPath).toContain('master.m3u8');
      const masterPath = path.join(hlsDir, 'master.m3u8');
      const masterContent = await fs.readFile(masterPath, 'utf8');
      expect(masterContent).toContain('#EXTM3U');
      expect(masterContent).toContain('#EXT-X-STREAM-INF');

      // Check all quality variants exist
      for (const profile of HLS_PROFILES) {
        expect(masterContent).toContain(`${profile.name}/playlist.m3u8`);
        expect(masterContent).toContain(`RESOLUTION=${profile.width}x${profile.height}`);

        const variantPlaylist = path.join(hlsDir, profile.name, 'playlist.m3u8');
        const stat = await fs.stat(variantPlaylist);
        expect(stat.size).toBeGreaterThan(0);
      }

      // Check duration
      expect(result.duration).toBeGreaterThan(0);

      // Check thumbnails
      expect(result.thumbnailPaths.length).toBe(3);

      // Check progress was reported
      expect(progressValues.length).toBeGreaterThan(0);
      expect(progressValues[progressValues.length - 1]).toBe(100);
    }, 120000); // 2 minutes for transcoding
  });
});
