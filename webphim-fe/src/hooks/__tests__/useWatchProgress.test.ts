import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWatchProgress } from '../useWatchProgress';

const mockPost = vi.fn().mockResolvedValue({ data: { success: true } });

vi.mock('@/lib/api', () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

beforeEach(() => {
  vi.useFakeTimers();
  mockPost.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useWatchProgress', () => {
  it('does not save progress when duration is 0', () => {
    renderHook(() =>
      useWatchProgress({
        contentId: 'c1',
        currentTime: 10,
        duration: 0,
        isPlaying: true,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('does not save progress when currentTime is 0', () => {
    renderHook(() =>
      useWatchProgress({
        contentId: 'c1',
        currentTime: 0,
        duration: 120,
        isPlaying: true,
      }),
    );

    act(() => {
      vi.advanceTimersByTime(20_000);
    });

    expect(mockPost).not.toHaveBeenCalled();
  });

  it('saves progress every 15 seconds while playing', async () => {
    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          currentTime: 30,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    // Update ref via rerender so useEffect fires
    rerender({ contentId: 'c1', currentTime: 30, duration: 120, isPlaying: true });

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockPost).toHaveBeenCalledWith('/watch-history', {
      contentId: 'c1',
      episodeId: null,
      progress: 30,
      duration: 120,
    });
  });

  it('saves progress on pause', async () => {
    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          currentTime: 45,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    // Simulate pause
    await act(async () => {
      rerender({ contentId: 'c1', currentTime: 45, duration: 120, isPlaying: false });
    });

    expect(mockPost).toHaveBeenCalledWith('/watch-history', {
      contentId: 'c1',
      episodeId: null,
      progress: 45,
      duration: 120,
    });
  });

  it('does not save duplicate progress', async () => {
    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          currentTime: 30,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    // First save at 15s
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    const callCount = mockPost.mock.calls.length;

    // Pause without changing time — should not re-save
    await act(async () => {
      rerender({ contentId: 'c1', currentTime: 30, duration: 120, isPlaying: false });
    });

    expect(mockPost.mock.calls.length).toBe(callCount);
  });

  it('includes episodeId when provided', async () => {
    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          episodeId: 'ep1',
          currentTime: 60,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    rerender({ contentId: 'c1', episodeId: 'ep1', currentTime: 60, duration: 120, isPlaying: true });

    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockPost).toHaveBeenCalledWith('/watch-history', {
      contentId: 'c1',
      episodeId: 'ep1',
      progress: 60,
      duration: 120,
    });
  });

  it('stops periodic saving when paused', async () => {
    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          currentTime: 30,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    // First interval fires
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    const callCountAfterFirst = mockPost.mock.calls.length;

    // Pause and wait another interval — should NOT trigger periodic save
    await act(async () => {
      rerender({ contentId: 'c1', currentTime: 31, duration: 120, isPlaying: false });
    });

    // The pause save itself
    const callCountAfterPause = mockPost.mock.calls.length;

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // No additional calls beyond the pause save
    expect(mockPost.mock.calls.length).toBe(callCountAfterPause);
    expect(callCountAfterPause).toBeGreaterThan(callCountAfterFirst);
  });

  it('silently handles API errors', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network error'));

    const { rerender } = renderHook(
      (props) => useWatchProgress(props),
      {
        initialProps: {
          contentId: 'c1',
          currentTime: 50,
          duration: 120,
          isPlaying: true,
        },
      },
    );

    rerender({ contentId: 'c1', currentTime: 50, duration: 120, isPlaying: true });

    // Should not throw
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });

    expect(mockPost).toHaveBeenCalled();
  });
});
