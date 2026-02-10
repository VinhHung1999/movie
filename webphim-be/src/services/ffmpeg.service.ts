// UPLOAD LEARN 8: FFmpeg nhận 1 video gốc → tạo 4 chất lượng HLS (1080p/720p/480p/360p).
// Mỗi chất lượng cắt thành segments 6s (.ts). Tạo master.m3u8 (menu cho player chọn chất lượng).
// Tạo 3 thumbnails. Worker báo progress % → FE poll hiển thị (xem LEARN 9).

import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs/promises';
import { config } from '../config';

ffmpeg.setFfmpegPath(config.ffmpeg.path);

export interface TranscodeResult {
  hlsPath: string;       // relative path to master.m3u8
  duration: number;      // seconds
  thumbnailPaths: string[]; // relative paths to generated thumbnails
}

interface HLSProfile {
  name: string;
  width: number;
  height: number;
  videoBitrate: string;
  maxrate: string;
  bufsize: string;
  audioBitrate: string;
  preset: string;
  bandwidth: number;     // for master playlist
}

const HLS_PROFILES: HLSProfile[] = [
  {
    name: '1080p',
    width: 1920, height: 1080,
    videoBitrate: '5000k', maxrate: '5500k', bufsize: '10000k',
    audioBitrate: '192k', preset: 'medium',
    bandwidth: 5192000,
  },
  {
    name: '720p',
    width: 1280, height: 720,
    videoBitrate: '2500k', maxrate: '2750k', bufsize: '5000k',
    audioBitrate: '128k', preset: 'medium',
    bandwidth: 2628000,
  },
  {
    name: '480p',
    width: 854, height: 480,
    videoBitrate: '1000k', maxrate: '1100k', bufsize: '2000k',
    audioBitrate: '96k', preset: 'medium',
    bandwidth: 1096000,
  },
  {
    name: '360p',
    width: 640, height: 360,
    videoBitrate: '600k', maxrate: '660k', bufsize: '1200k',
    audioBitrate: '64k', preset: 'fast',
    bandwidth: 664000,
  },
];

/**
 * Get video duration in seconds using ffprobe
 */
function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
}

/**
 * Transcode a single quality variant to HLS
 */
function transcodeVariant(
  inputPath: string,
  outputDir: string,
  profile: HLSProfile,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const variantDir = path.join(outputDir, profile.name);
    const playlistPath = path.join(variantDir, 'playlist.m3u8');
    const segmentPattern = path.join(variantDir, 'segment_%03d.ts');

    const cmd = ffmpeg(inputPath)
      .outputOptions([
        `-vf`, `scale=${profile.width}:${profile.height}:force_original_aspect_ratio=decrease,pad=${profile.width}:${profile.height}:(ow-iw)/2:(oh-ih)/2`,
        `-c:v`, `libx264`,
        `-preset`, profile.preset,
        `-b:v`, profile.videoBitrate,
        `-maxrate`, profile.maxrate,
        `-bufsize`, profile.bufsize,
        `-c:a`, `aac`,
        `-b:a`, profile.audioBitrate,
        `-hls_time`, `6`,
        `-hls_playlist_type`, `vod`,
        `-hls_segment_filename`, segmentPattern,
      ])
      .output(playlistPath);

    if (onProgress) {
      cmd.on('progress', (progress) => {
        if (progress.percent !== undefined) {
          onProgress(progress.percent);
        }
      });
    }

    cmd
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Generate master.m3u8 playlist that references all quality variants
 */
async function generateMasterPlaylist(outputDir: string, profiles: HLSProfile[]): Promise<void> {
  let content = '#EXTM3U\n';

  for (const profile of profiles) {
    content += `#EXT-X-STREAM-INF:BANDWIDTH=${profile.bandwidth},RESOLUTION=${profile.width}x${profile.height}\n`;
    content += `${profile.name}/playlist.m3u8\n`;
  }

  await fs.writeFile(path.join(outputDir, 'master.m3u8'), content);
}

/**
 * Transcode video to HLS multi-bitrate
 */
export async function transcodeToHLS(
  inputPath: string,
  outputDir: string,
  onProgress?: (percent: number) => void,
): Promise<TranscodeResult> {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Get duration
  const duration = await getVideoDuration(inputPath);

  // Create variant directories
  for (const profile of HLS_PROFILES) {
    await fs.mkdir(path.join(outputDir, profile.name), { recursive: true });
  }

  // Transcode each variant sequentially (to avoid CPU overload on dev)
  const totalProfiles = HLS_PROFILES.length;
  for (let i = 0; i < totalProfiles; i++) {
    const profile = HLS_PROFILES[i];
    const basePercent = (i / totalProfiles) * 100;
    const stepSize = 100 / totalProfiles;

    await transcodeVariant(inputPath, outputDir, profile, (variantPercent) => {
      if (onProgress) {
        const overallPercent = basePercent + (variantPercent / 100) * stepSize;
        onProgress(Math.min(Math.round(overallPercent), 99));
      }
    });
  }

  // Generate master playlist
  await generateMasterPlaylist(outputDir, HLS_PROFILES);

  // Generate thumbnails
  const thumbnailPaths = await generateThumbnails(inputPath, outputDir, 3);

  if (onProgress) {
    onProgress(100);
  }

  // Return relative path from uploads dir
  const uploadsDir = config.storage.localDir;
  const relativeHlsPath = path.relative(uploadsDir, path.join(outputDir, 'master.m3u8'));
  const relativeThumbnails = thumbnailPaths.map((p) => path.relative(uploadsDir, p));

  return {
    hlsPath: relativeHlsPath,
    duration,
    thumbnailPaths: relativeThumbnails,
  };
}

/**
 * Generate thumbnails at evenly spaced intervals
 */
export function generateThumbnails(
  inputPath: string,
  outputDir: string,
  count = 3,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const thumbnailPaths: string[] = [];

    ffmpeg(inputPath)
      .screenshots({
        count,
        folder: outputDir,
        filename: 'thumb_%00i.jpg',
        size: '320x180',
      })
      .on('filenames', (filenames: string[]) => {
        for (const f of filenames) {
          thumbnailPaths.push(path.join(outputDir, f));
        }
      })
      .on('end', () => resolve(thumbnailPaths))
      .on('error', (err) => reject(err));
  });
}

export { getVideoDuration, HLS_PROFILES };
