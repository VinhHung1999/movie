// UPLOAD LEARN 9: Quay lại FE - SWR poll GET /api/videos/:id/status mỗi 3s. Hiển thị QUEUED→PROCESSING(%)→COMPLETED. Khi COMPLETED → video sẵn sàng xem (Sprint 7).
'use client';

import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import { VideoStatusResponse } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

interface TranscodeStatusProps {
  videoId: string;
}

const STATUS_CONFIG = {
  UPLOADING: { label: 'Uploading', color: 'bg-blue-500', icon: Loader2, spin: true },
  UPLOADED: { label: 'Uploaded', color: 'bg-blue-500', icon: Clock, spin: false },
  QUEUED: { label: 'Queued', color: 'bg-yellow-500', icon: Clock, spin: false },
  PROCESSING: { label: 'Processing', color: 'bg-netflix-red', icon: Loader2, spin: true },
  COMPLETED: { label: 'Completed', color: 'bg-green-500', icon: CheckCircle, spin: false },
  FAILED: { label: 'Failed', color: 'bg-red-600', icon: XCircle, spin: false },
} as const;

function isPollingStatus(status: string): boolean {
  return status === 'QUEUED' || status === 'PROCESSING' || status === 'UPLOADING' || status === 'UPLOADED';
}

export default function TranscodeStatus({ videoId }: TranscodeStatusProps) {
  const { data, error, isLoading } = useSWR<{ success: true; data: VideoStatusResponse }>(
    `/videos/${videoId}/status`,
    {
      refreshInterval: (latestData) => {
        if (!latestData?.data) return 3000;
        return isPollingStatus(latestData.data.status) ? 3000 : 0;
      },
    }
  );

  if (isLoading) {
    return (
      <div data-testid="transcode-loading" className="rounded-lg border border-netflix-border bg-netflix-dark p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-netflix-light-gray" />
          <p className="text-sm text-netflix-light-gray">Loading transcode status...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div data-testid="transcode-error" className="rounded-lg border border-red-900/50 bg-netflix-dark p-6">
        <p className="text-sm text-red-500">Failed to load transcode status</p>
      </div>
    );
  }

  const video = data.data;
  const config = STATUS_CONFIG[video.status];
  const StatusIcon = config.icon;
  const progress = video.progress ?? 0;

  return (
    <div data-testid="transcode-status" className="rounded-lg border border-netflix-border bg-netflix-dark p-6">
      {/* Status Badge */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-netflix-white">Transcode Status</h3>
        <span
          data-testid="status-badge"
          className={clsx(
            'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-white',
            config.color
          )}
        >
          <StatusIcon className={clsx('h-3.5 w-3.5', config.spin && 'animate-spin')} />
          {config.label}
        </span>
      </div>

      {/* Progress Bar (for PROCESSING) */}
      {video.status === 'PROCESSING' && (
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-netflix-light-gray">Progress</span>
            <span data-testid="transcode-progress" className="text-xs font-semibold text-netflix-white">
              {progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-netflix-gray">
            <motion.div
              data-testid="transcode-progress-bar"
              className="h-full rounded-full bg-netflix-red"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {video.status === 'FAILED' && video.errorMessage && (
        <p data-testid="transcode-error-message" className="mb-4 text-sm text-red-400">
          {video.errorMessage}
        </p>
      )}

      {/* Thumbnails (when complete) */}
      {video.status === 'COMPLETED' && video.thumbnailPaths.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs text-netflix-light-gray">Generated Thumbnails</p>
          <div data-testid="thumbnails" className="flex gap-2">
            {video.thumbnailPaths.map((path, i) => (
              <div
                key={path}
                className="h-16 w-28 overflow-hidden rounded bg-netflix-gray"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${SERVER_BASE}${path}`}
                  alt={`Thumbnail ${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duration (when available) */}
      {video.duration && (
        <p className="mt-3 text-xs text-netflix-mid-gray">
          Duration: {Math.floor(video.duration / 60)}m {Math.round(video.duration % 60)}s
        </p>
      )}
    </div>
  );
}
