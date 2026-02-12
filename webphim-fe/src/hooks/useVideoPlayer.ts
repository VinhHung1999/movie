// UPLOAD LEARN 10: useVideoPlayer hook - trung tâm điều khiển video player.
// Quản lý hls.js instance, play/pause, seek, volume, fullscreen, quality levels.
// Dynamic import hls.js để tránh SSR crash (hls.js dùng window/document).
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type HlsType from 'hls.js';

export interface QualityLevel {
  height: number;
  bitrate: number;
  label: string;
}

export interface BufferedRange {
  start: number;
  end: number;
}

export interface UseVideoPlayerReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;

  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  isBuffering: boolean;
  error: string | null;
  buffered: BufferedRange[];

  qualities: QualityLevel[];
  currentQuality: number;
  setQuality: (index: number) => void;

  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  retry: () => void;
}

export function useVideoPlayer(streamUrl: string): UseVideoPlayerReturn {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<HlsType | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buffered, setBuffered] = useState<BufferedRange[]>([]);
  const [qualities, setQualities] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = auto

  // Setup hls.js with dynamic import (SSR-safe)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamUrl) return;

    let hls: HlsType | null = null;
    let destroyed = false;

    const initHls = async () => {
      const { default: Hls } = await import('hls.js');

      if (destroyed) return;

      if (Hls.isSupported()) {
        hls = new Hls({
          startLevel: -1,
          capLevelToPlayerSize: true,
          maxBufferLength: 30,
          maxMaxBufferLength: 60,
        });
        hlsRef.current = hls;

        hls.loadSource(streamUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
          if (destroyed) return;
          setQualities(
            data.levels.map((l) => ({
              height: l.height,
              bitrate: l.bitrate,
              label: `${l.height}p`,
            }))
          );
          // Auto-play: wait for canplay to avoid "play() interrupted" error
          const attemptPlay = () => {
            if (destroyed) return;
            video.play().catch(() => {
              video.muted = true;
              video.play().catch(() => {});
            });
          };
          if (video.readyState >= 3) {
            attemptPlay();
          } else {
            video.addEventListener('canplay', attemptPlay, { once: true });
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (destroyed) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls?.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls?.recoverMediaError();
                break;
              default:
                setError('Playback error. Please try again.');
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS
        video.src = streamUrl;
        video.addEventListener('canplay', () => {
          if (destroyed) return;
          video.play().catch(() => {
            video.muted = true;
            video.play().catch(() => {});
          });
        }, { once: true });
      } else {
        setError('HLS is not supported in this browser.');
      }
    };

    initHls();

    // React 19 StrictMode: cleanup destroys hls instance on double-mount
    return () => {
      destroyed = true;
      if (hls) {
        hls.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onWaiting = () => setIsBuffering(true);
    const onCanPlay = () => setIsBuffering(false);
    const onProgress = () => {
      const ranges: BufferedRange[] = [];
      for (let i = 0; i < video.buffered.length; i++) {
        ranges.push({ start: video.buffered.start(i), end: video.buffered.end(i) });
      }
      setBuffered(ranges);
    };
    const onVolumeChange = () => {
      setVolumeState(video.volume);
      setIsMuted(video.muted);
    };
    const onError = () => {
      if (!hlsRef.current) {
        setError('Video playback error.');
      }
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('progress', onProgress);
    video.addEventListener('volumechange', onVolumeChange);
    video.addEventListener('error', onError);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('volumechange', onVolumeChange);
      video.removeEventListener('error', onError);
    };
  }, []);

  // Fullscreen change listener
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const play = useCallback(() => {
    videoRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    videoRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, video.duration || 0));
  }, []);

  const setVolume = useCallback((vol: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, vol));
    if (vol > 0 && video.muted) {
      video.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      container.requestFullscreen();
    }
  }, []);

  const setQuality = useCallback((index: number) => {
    const hls = hlsRef.current;
    if (hls) {
      hls.currentLevel = index; // -1 = auto
      setCurrentQuality(index);
    }
  }, []);

  const retry = useCallback(() => {
    setError(null);
    const hls = hlsRef.current;
    if (hls) {
      hls.startLoad();
    } else {
      const video = videoRef.current;
      if (video) {
        video.load();
      }
    }
  }, []);

  return {
    videoRef,
    containerRef,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isFullscreen,
    isBuffering,
    error,
    buffered,
    qualities,
    currentQuality,
    setQuality,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
    retry,
  };
}
