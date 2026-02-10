// UPLOAD LEARN 3: Đang upload file lên server. Axios onUploadProgress track % real-time. Khi xong 100% → file đã tới BE (xem LEARN 4).
'use client';

import { motion } from 'framer-motion';
import { Film, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface UploadProgressProps {
  fileName: string;
  fileSize: number;
  progress: number;
  isComplete: boolean;
}

export default function UploadProgress({
  fileName,
  fileSize,
  progress,
  isComplete,
}: UploadProgressProps) {
  return (
    <div
      data-testid="upload-progress"
      className="rounded-lg border border-netflix-border bg-netflix-dark p-6"
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={clsx(
            'flex h-10 w-10 items-center justify-center rounded-lg',
            isComplete ? 'bg-green-900/30' : 'bg-netflix-gray'
          )}
        >
          {isComplete ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <Film className="h-5 w-5 text-netflix-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-netflix-white">
            {fileName}
          </p>
          <p className="text-xs text-netflix-light-gray">
            {formatFileSize(fileSize)}
          </p>
        </div>
        <span
          data-testid="progress-percent"
          className={clsx(
            'text-sm font-semibold',
            isComplete ? 'text-green-500' : 'text-netflix-white'
          )}
        >
          {progress}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-netflix-gray">
        <motion.div
          data-testid="progress-bar"
          className={clsx(
            'h-full rounded-full',
            isComplete ? 'bg-green-500' : 'bg-netflix-red'
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      <p className="mt-2 text-xs text-netflix-mid-gray">
        {isComplete ? 'Upload complete' : 'Uploading...'}
      </p>
    </div>
  );
}
