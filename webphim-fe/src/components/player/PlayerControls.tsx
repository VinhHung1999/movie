// UPLOAD LEARN 14: PlayerControls - auto-hide overlay trên video.
// TopBar: nút Back + title. BottomBar: ProgressBar, play/pause, volume, time, fullscreen.
// Ẩn sau 3s không di chuột. Luôn hiện khi paused. Cursor ẩn khi controls ẩn (cinema mode).
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Maximize, Minimize, ArrowLeft } from 'lucide-react';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import QualitySelector from './QualitySelector';
import type { UseVideoPlayerReturn } from '@/hooks/useVideoPlayer';

interface PlayerControlsProps {
  player: UseVideoPlayerReturn;
  title: string;
  onBack?: () => void;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

const HIDE_DELAY = 3000;

export default function PlayerControls({ player, title, onBack }: PlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    buffered,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    qualities,
    currentQuality,
    setQuality,
  } = player;

  // visible tracks user interaction (mouse move). Controls show if visible OR paused.
  const [interacted, setInteracted] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Brief play/pause icon feedback
  const [tapIcon, setTapIcon] = useState<'play' | 'pause' | null>(null);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showControls = useCallback(() => {
    setInteracted(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setInteracted(false), HIDE_DELAY);
  }, []);

  // Reset hide timer when playback state changes
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setTimeout(() => setInteracted(false), HIDE_DELAY);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isPlaying]);

  // Show controls when paused OR when user recently interacted
  const visible = !isPlaying || interacted;

  const handleTapToggle = useCallback(() => {
    // Show the icon for the action being taken (play if currently paused, pause if currently playing)
    const icon = isPlaying ? 'pause' : 'play';
    setTapIcon(icon);
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => setTapIcon(null), 700);
    togglePlay();
    showControls();
  }, [isPlaying, togglePlay, showControls]);

  useEffect(() => {
    return () => {
      if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    };
  }, []);

  return (
    <div
      data-testid="player-controls"
      className="absolute inset-0"
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (isPlaying) setInteracted(false);
      }}
      style={{ cursor: visible ? 'default' : 'none' }}
    >
      {/* Full-screen tap target for play/pause toggle */}
      <div
        data-testid="tap-area"
        className="absolute inset-0 z-0"
        onClick={handleTapToggle}
      />

      {/* Tap icon feedback — large icon in center */}
      <AnimatePresence>
        {tapIcon && (
          <motion.div
            key={tapIcon}
            data-testid="tap-icon"
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black/50">
              {tapIcon === 'pause' ? (
                <Pause className="h-10 w-10 text-white" />
              ) : (
                <Play className="h-10 w-10 text-white" />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {visible && (
          <motion.div
            data-testid="controls-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between"
          >
            {/* Top Bar - gradient overlay */}
            <div
              className="pointer-events-auto bg-gradient-to-b from-black/70 to-transparent px-4 pb-8 pt-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3">
                {onBack && (
                  <button
                    type="button"
                    onClick={onBack}
                    data-testid="back-button"
                    className="rounded-full p-1 text-white transition-colors hover:bg-white/20"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="h-6 w-6" />
                  </button>
                )}
                <h2
                  data-testid="player-title"
                  className="text-lg font-medium text-white drop-shadow-lg"
                >
                  {title}
                </h2>
              </div>
            </div>

            {/* Bottom Bar - gradient overlay */}
            <div
              className="pointer-events-auto bg-gradient-to-t from-black/70 to-transparent px-4 pb-4 pt-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Progress Bar */}
              <ProgressBar
                currentTime={currentTime}
                duration={duration}
                buffered={buffered}
                onSeek={seek}
              />

              {/* Controls Row */}
              <div className="mt-1 flex items-center gap-3">
                {/* Play/Pause */}
                <button
                  type="button"
                  onClick={togglePlay}
                  data-testid="play-pause-button"
                  className="rounded p-1 text-white transition-colors hover:text-netflix-red"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </button>

                {/* Volume */}
                <VolumeControl
                  volume={volume}
                  isMuted={isMuted}
                  onVolumeChange={setVolume}
                  onToggleMute={toggleMute}
                />

                {/* Time Display */}
                <span data-testid="time-display" className="text-xs text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Quality Selector */}
                <QualitySelector
                  qualities={qualities}
                  currentQuality={currentQuality}
                  onSelect={setQuality}
                />

                {/* Fullscreen */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  data-testid="fullscreen-button"
                  className="rounded p-1 text-white transition-colors hover:text-netflix-red"
                  aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="h-5 w-5" />
                  ) : (
                    <Maximize className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { formatTime };
