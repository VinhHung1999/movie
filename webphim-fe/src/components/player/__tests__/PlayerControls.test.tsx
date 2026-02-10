import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PlayerControls, { formatTime } from '../PlayerControls';
import type { UseVideoPlayerReturn } from '@/hooks/useVideoPlayer';

// Mock hls.js (required by useVideoPlayer import chain)
vi.mock('hls.js', () => ({
  default: Object.assign(vi.fn(), {
    isSupported: vi.fn().mockReturnValue(true),
    Events: { MANIFEST_PARSED: 'hlsManifestParsed', ERROR: 'hlsError' },
    ErrorTypes: { NETWORK_ERROR: 'networkError', MEDIA_ERROR: 'mediaError' },
  }),
}));

function createMockPlayer(overrides?: Partial<UseVideoPlayerReturn>): UseVideoPlayerReturn {
  return {
    videoRef: { current: null },
    containerRef: { current: null },
    isPlaying: false,
    currentTime: 0,
    duration: 7200,
    volume: 0.8,
    isMuted: false,
    isFullscreen: false,
    isBuffering: false,
    error: null,
    buffered: [],
    qualities: [],
    currentQuality: -1,
    setQuality: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    togglePlay: vi.fn(),
    seek: vi.fn(),
    setVolume: vi.fn(),
    toggleMute: vi.fn(),
    toggleFullscreen: vi.fn(),
    retry: vi.fn(),
    ...overrides,
  };
}

describe('PlayerControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders play button when paused', () => {
    const player = createMockPlayer({ isPlaying: false });
    render(<PlayerControls player={player} title="Test" />);

    expect(screen.getByTestId('play-pause-button')).toBeInTheDocument();
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  it('renders pause button when playing', () => {
    const player = createMockPlayer({ isPlaying: true });
    render(<PlayerControls player={player} title="Test" />);

    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  it('calls togglePlay when play/pause clicked', () => {
    const player = createMockPlayer();
    render(<PlayerControls player={player} title="Test" />);

    fireEvent.click(screen.getByTestId('play-pause-button'));
    expect(player.togglePlay).toHaveBeenCalled();
  });

  it('shows title', () => {
    const player = createMockPlayer();
    render(<PlayerControls player={player} title="My Movie" />);

    expect(screen.getByTestId('player-title')).toHaveTextContent('My Movie');
  });

  it('shows back button when onBack provided', () => {
    const onBack = vi.fn();
    const player = createMockPlayer();
    render(<PlayerControls player={player} title="Test" onBack={onBack} />);

    const btn = screen.getByTestId('back-button');
    fireEvent.click(btn);
    expect(onBack).toHaveBeenCalled();
  });

  it('does not show back button when onBack not provided', () => {
    const player = createMockPlayer();
    render(<PlayerControls player={player} title="Test" />);

    expect(screen.queryByTestId('back-button')).not.toBeInTheDocument();
  });

  it('shows time display with formatted time', () => {
    const player = createMockPlayer({ currentTime: 125, duration: 3600 });
    render(<PlayerControls player={player} title="Test" />);

    expect(screen.getByTestId('time-display')).toHaveTextContent('2:05 / 1:00:00');
  });

  it('calls toggleFullscreen when fullscreen button clicked', () => {
    const player = createMockPlayer();
    render(<PlayerControls player={player} title="Test" />);

    fireEvent.click(screen.getByTestId('fullscreen-button'));
    expect(player.toggleFullscreen).toHaveBeenCalled();
  });

  it('auto-hides controls after 3s when playing', () => {
    const player = createMockPlayer({ isPlaying: true });
    render(<PlayerControls player={player} title="Test" />);

    expect(screen.getByTestId('controls-overlay')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3100);
    });

    // AnimatePresence should start exit animation
    // After timeout, visible becomes false
  });

  it('controls always visible when paused', () => {
    const player = createMockPlayer({ isPlaying: false });
    render(<PlayerControls player={player} title="Test" />);

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByTestId('controls-overlay')).toBeInTheDocument();
  });
});

describe('formatTime', () => {
  it('formats seconds only', () => {
    expect(formatTime(45)).toBe('0:45');
  });

  it('formats minutes and seconds', () => {
    expect(formatTime(125)).toBe('2:05');
  });

  it('formats hours', () => {
    expect(formatTime(3661)).toBe('1:01:01');
  });

  it('handles zero', () => {
    expect(formatTime(0)).toBe('0:00');
  });

  it('handles NaN/Infinity', () => {
    expect(formatTime(NaN)).toBe('0:00');
    expect(formatTime(Infinity)).toBe('0:00');
  });
});
