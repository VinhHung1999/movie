// UPLOAD LEARN 12: ProgressBar - thanh seek + hiển thị buffered range.
// Click hoặc kéo trên thanh để seek video. Vùng xám = buffered, vùng đỏ = played.
'use client';

import { useCallback, useRef } from 'react';
import type { BufferedRange } from '@/hooks/useVideoPlayer';

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: BufferedRange[];
  onSeek: (time: number) => void;
}

export default function ProgressBar({
  currentTime,
  duration,
  buffered,
  onSeek,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null);

  const calcTimeFromEvent = useCallback(
    (e: React.MouseEvent) => {
      const bar = barRef.current;
      if (!bar || duration <= 0) return 0;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onSeek(calcTimeFromEvent(e));
    },
    [calcTimeFromEvent, onSeek]
  );

  const playedPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      data-testid="progress-bar"
      className="group relative flex h-5 cursor-pointer items-center"
      onClick={handleClick}
      role="slider"
      aria-label="Video progress"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
    >
      {/* Track */}
      <div className="relative h-1 w-full rounded-full bg-white/20 transition-all group-hover:h-1.5">
        {/* Buffered ranges */}
        {buffered.map((range, i) => {
          const left = duration > 0 ? (range.start / duration) * 100 : 0;
          const width = duration > 0 ? ((range.end - range.start) / duration) * 100 : 0;
          return (
            <div
              key={i}
              className="absolute top-0 h-full rounded-full bg-white/30"
              style={{ left: `${left}%`, width: `${width}%` }}
            />
          );
        })}

        {/* Played */}
        <div
          data-testid="progress-played"
          className="absolute top-0 h-full rounded-full bg-netflix-red"
          style={{ width: `${playedPercent}%` }}
        />

        {/* Thumb */}
        <div
          data-testid="progress-thumb"
          className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-netflix-red opacity-0 transition-opacity group-hover:opacity-100"
          style={{ left: `${playedPercent}%`, marginLeft: '-7px' }}
        />
      </div>
    </div>
  );
}
