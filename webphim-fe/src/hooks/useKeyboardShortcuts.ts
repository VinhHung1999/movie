// UPLOAD LEARN 16: useKeyboardShortcuts - phím tắt điều khiển video player.
// Space=play/pause, F=fullscreen, Esc=exit fullscreen, arrows=seek/volume, M=mute.
// preventDefault trên tất cả phím bound để tránh scroll trang.
'use client';

import { useEffect } from 'react';

interface KeyboardShortcutActions {
  togglePlay: () => void;
  toggleFullscreen: () => void;
  toggleMute: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  currentTime: number;
  volume: number;
  isFullscreen: boolean;
}

export function useKeyboardShortcuts({
  togglePlay,
  toggleFullscreen,
  toggleMute,
  seek,
  setVolume,
  currentTime,
  volume,
  isFullscreen,
}: KeyboardShortcutActions): void {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            // document.exitFullscreen() is handled by browser default for Esc,
            // but we call toggleFullscreen for consistency
            toggleFullscreen();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, toggleFullscreen, toggleMute, seek, setVolume, currentTime, volume, isFullscreen]);
}
