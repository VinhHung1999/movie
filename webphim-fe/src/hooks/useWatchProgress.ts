'use client';

import { useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';

const SAVE_INTERVAL_MS = 15_000; // Save every 15 seconds

interface UseWatchProgressOptions {
  contentId: string;
  episodeId?: string;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
}

/**
 * Periodically saves watch progress to the API while the video is playing.
 * Also saves on pause and before page unload.
 */
export function useWatchProgress({
  contentId,
  episodeId,
  currentTime,
  duration,
  isPlaying,
}: UseWatchProgressOptions) {
  // Use refs so the save function always reads the latest values
  const currentTimeRef = useRef(currentTime);
  const durationRef = useRef(duration);
  const lastSavedRef = useRef(0);

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  const saveProgress = useCallback(async () => {
    const progress = Math.floor(currentTimeRef.current);
    const dur = Math.floor(durationRef.current);

    // Don't save if no meaningful playback yet
    if (dur < 1 || progress < 1) return;
    // Don't save if we just saved the same position
    if (progress === lastSavedRef.current) return;

    lastSavedRef.current = progress;

    try {
      await api.post('/watch-history', {
        contentId,
        episodeId: episodeId || null,
        progress,
        duration: dur,
      });
    } catch {
      // Silently fail — progress saving is best-effort
    }
  }, [contentId, episodeId]);

  // Periodic save while playing
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(saveProgress, SAVE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isPlaying, saveProgress]);

  // Save on pause
  useEffect(() => {
    if (!isPlaying && currentTimeRef.current > 0 && durationRef.current > 0) {
      saveProgress();
    }
  }, [isPlaying, saveProgress]);

  // Save before page unload (use fetch with keepalive since sendBeacon can't set auth headers)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const progress = Math.floor(currentTimeRef.current);
      const dur = Math.floor(durationRef.current);
      if (dur < 1 || progress < 1) return;

      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
      let token: string | null = null;
      try {
        token = JSON.parse(localStorage.getItem('webphim-auth') || '{}')?.state?.accessToken;
      } catch { /* ignore */ }

      if (!token) return;

      fetch(`${apiBase}/watch-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentId, episodeId: episodeId || null, progress, duration: dur }),
        keepalive: true,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [contentId, episodeId]);
}
