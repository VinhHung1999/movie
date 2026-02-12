'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, X } from 'lucide-react';
import { motion } from 'framer-motion';

export interface NextEpisodeInfo {
  episodeId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
}

interface NextEpisodeOverlayProps {
  nextEpisode: NextEpisodeInfo;
  onPlay: () => void;
  onCancel: () => void;
}

export default function NextEpisodeOverlay({
  nextEpisode,
  onPlay,
  onCancel,
}: NextEpisodeOverlayProps) {
  const [countdown, setCountdown] = useState(10);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          onPlay();
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [onPlay]);

  const handleCancel = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    onCancel();
  };

  return (
    <motion.div
      data-testid="next-episode-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto absolute bottom-20 right-4 z-40 w-80 rounded-lg bg-netflix-dark/95 p-4 shadow-2xl backdrop-blur-sm md:right-8"
      role="dialog"
      aria-label="Next episode"
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-neutral-400" aria-live="polite">
          Next episode in <span className="font-bold text-white">{countdown}s</span>
        </p>
        <button
          type="button"
          onClick={handleCancel}
          data-testid="next-episode-cancel"
          className="rounded p-1 text-neutral-400 transition-colors hover:text-white"
          aria-label="Cancel auto-play"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Episode Info */}
      <div className="mb-3">
        <p className="text-xs text-neutral-500">
          S{nextEpisode.seasonNumber} E{nextEpisode.episodeNumber}
        </p>
        <p className="truncate text-sm font-medium text-white" data-testid="next-episode-title">
          {nextEpisode.title}
        </p>
      </div>

      {/* Play Now Button */}
      <button
        type="button"
        onClick={onPlay}
        data-testid="next-episode-play"
        className="flex w-full items-center justify-center gap-2 rounded-md bg-white py-2 text-sm font-semibold text-black transition-colors hover:bg-neutral-200"
      >
        <Play className="h-4 w-4" fill="currentColor" />
        Play Now
      </button>
    </motion.div>
  );
}
