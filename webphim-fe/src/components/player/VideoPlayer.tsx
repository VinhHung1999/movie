// UPLOAD LEARN 11: VideoPlayer - component chính render <video> + HLS.
// Dùng useVideoPlayer hook để quản lý state. containerRef cho fullscreen (bao gồm controls overlay).
// poster attribute hiển thị thumbnail khi chưa play.
'use client';

import { useEffect, useRef } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import type { UseVideoPlayerReturn } from '@/hooks/useVideoPlayer';
import { Loader2 } from 'lucide-react';

export type { UseVideoPlayerReturn };

export interface VideoPlayerProps {
  streamUrl: string;
  title: string;
  contentId: string;
  episodeId?: string;
  initialProgress?: number;
  thumbnailUrl?: string;
  onBack?: () => void;
  children?: (player: UseVideoPlayerReturn) => React.ReactNode;
}

export default function VideoPlayer({
  streamUrl,
  title,
  thumbnailUrl,
  initialProgress,
  children,
}: VideoPlayerProps) {
  const player = useVideoPlayer(streamUrl);
  const {
    videoRef,
    containerRef,
    isBuffering,
    error,
    duration,
    seek,
    retry,
  } = player;

  // Seek to initial progress once duration is loaded
  const seekedRef = useRef(false);
  useEffect(() => {
    if (initialProgress && duration > 0 && !seekedRef.current) {
      seekedRef.current = true;
      seek(initialProgress);
    }
  }, [initialProgress, duration, seek]);

  return (
    <div
      ref={containerRef}
      data-testid="video-player-container"
      className="relative h-full w-full bg-black"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        data-testid="video-element"
        className="h-full w-full"
        playsInline
        poster={thumbnailUrl}
        title={title}
      />

      {/* Buffering Spinner */}
      {isBuffering && !error && (
        <div
          data-testid="buffering-spinner"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <Loader2 className="h-12 w-12 animate-spin text-white" />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div
          data-testid="error-overlay"
          className="absolute inset-0 flex flex-col items-center justify-center bg-black/80"
        >
          <p className="mb-4 text-lg text-white">{error}</p>
          <button
            type="button"
            onClick={retry}
            data-testid="retry-button"
            className="rounded-md bg-netflix-red px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls rendered via render prop */}
      {children?.(player)}
    </div>
  );
}
