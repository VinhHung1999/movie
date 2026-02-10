import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

function createActions(overrides?: Partial<Parameters<typeof useKeyboardShortcuts>[0]>) {
  return {
    togglePlay: vi.fn(),
    toggleFullscreen: vi.fn(),
    toggleMute: vi.fn(),
    seek: vi.fn<(time: number) => void>(),
    setVolume: vi.fn<(vol: number) => void>(),
    currentTime: 60,
    volume: 0.5,
    isFullscreen: false,
    ...overrides,
  };
}

function fireKey(key: string, options?: Partial<KeyboardEventInit>) {
  document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options }));
}

describe('useKeyboardShortcuts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Space toggles play/pause', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey(' ');
    expect(actions.togglePlay).toHaveBeenCalledOnce();
  });

  it('F toggles fullscreen', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('f');
    expect(actions.toggleFullscreen).toHaveBeenCalledOnce();
  });

  it('Escape exits fullscreen when in fullscreen', () => {
    const actions = createActions({ isFullscreen: true });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('Escape');
    expect(actions.toggleFullscreen).toHaveBeenCalledOnce();
  });

  it('Escape does nothing when not in fullscreen', () => {
    const actions = createActions({ isFullscreen: false });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('Escape');
    expect(actions.toggleFullscreen).not.toHaveBeenCalled();
  });

  it('ArrowLeft seeks -10s', () => {
    const actions = createActions({ currentTime: 60 });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('ArrowLeft');
    expect(actions.seek).toHaveBeenCalledWith(50);
  });

  it('ArrowRight seeks +10s', () => {
    const actions = createActions({ currentTime: 60 });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('ArrowRight');
    expect(actions.seek).toHaveBeenCalledWith(70);
  });

  it('ArrowUp increases volume by 10%', () => {
    const actions = createActions({ volume: 0.5 });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('ArrowUp');
    expect(actions.setVolume).toHaveBeenCalledWith(0.6);
  });

  it('ArrowDown decreases volume by 10%', () => {
    const actions = createActions({ volume: 0.5 });
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('ArrowDown');
    expect(actions.setVolume).toHaveBeenCalledWith(0.4);
  });

  it('M toggles mute', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    fireKey('m');
    expect(actions.toggleMute).toHaveBeenCalledOnce();
  });

  it('does not respond when typing in input', () => {
    const actions = createActions();
    renderHook(() => useKeyboardShortcuts(actions));

    const input = document.createElement('input');
    document.body.appendChild(input);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    document.body.removeChild(input);

    expect(actions.togglePlay).not.toHaveBeenCalled();
  });
});
