// UPLOAD LEARN 1: User chọn/kéo thả file video vào đây. Client validate type+size trước khi gửi server.
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Film, X } from 'lucide-react';
import { clsx } from 'clsx';

const ACCEPTED_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-matroska',
];

const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}

interface UploadDropzoneProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  disabled?: boolean;
}

export default function UploadDropzone({
  onFileSelect,
  selectedFile,
  onClear,
  disabled = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'File type not allowed. Accepted: mp4, mov, avi, webm, mkv';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size: 2GB (selected: ${formatFileSize(file.size)})`;
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(file);
    },
    [validateFile, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (disabled) return;

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  const handleClick = useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  if (selectedFile) {
    return (
      <div
        data-testid="dropzone-selected"
        className="rounded-lg border border-netflix-border bg-netflix-dark p-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-netflix-gray">
            <Film className="h-6 w-6 text-netflix-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-netflix-white">
              {selectedFile.name}
            </p>
            <p className="text-xs text-netflix-light-gray">
              {formatFileSize(selectedFile.size)}
            </p>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={onClear}
              className="rounded-full p-1 text-netflix-light-gray transition-colors hover:bg-netflix-gray hover:text-white"
              aria-label="Remove selected file"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <motion.div
        data-testid="dropzone"
        role="button"
        tabIndex={0}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        animate={{
          borderColor: isDragOver ? '#E50914' : '#333',
          scale: isDragOver ? 1.01 : 1,
        }}
        transition={{ duration: 0.15 }}
        className={clsx(
          'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors',
          isDragOver
            ? 'border-netflix-red bg-netflix-red/5'
            : 'border-netflix-border bg-netflix-dark hover:border-netflix-light-gray',
          disabled && 'pointer-events-none opacity-50'
        )}
      >
        <Upload
          className={clsx(
            'mb-4 h-10 w-10',
            isDragOver ? 'text-netflix-red' : 'text-netflix-light-gray'
          )}
        />
        <p className="mb-1 text-sm font-medium text-netflix-white">
          Drag & drop your video here, or click to select
        </p>
        <p className="text-xs text-netflix-mid-gray">
          MP4, MOV, AVI, WebM, MKV — Max 2GB
        </p>
      </motion.div>

      {error && (
        <p data-testid="dropzone-error" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
        onChange={handleInputChange}
        className="hidden"
        data-testid="file-input"
      />
    </div>
  );
}
