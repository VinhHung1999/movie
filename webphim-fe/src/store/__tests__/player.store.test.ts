import { describe, it, expect, beforeEach } from 'vitest';
import { usePlayerStore } from '../player.store';

describe('usePlayerStore', () => {
  beforeEach(() => {
    // Reset to defaults
    usePlayerStore.setState({
      volume: 1,
      isMuted: false,
      playbackSpeed: 1,
      autoPlayNextEpisode: true,
    });
  });

  it('has correct default values', () => {
    const state = usePlayerStore.getState();
    expect(state.volume).toBe(1);
    expect(state.isMuted).toBe(false);
    expect(state.playbackSpeed).toBe(1);
    expect(state.autoPlayNextEpisode).toBe(true);
  });

  it('setVolume updates volume', () => {
    usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);
  });

  it('setMuted updates isMuted', () => {
    usePlayerStore.getState().setMuted(true);
    expect(usePlayerStore.getState().isMuted).toBe(true);
  });

  it('setPlaybackSpeed updates speed', () => {
    usePlayerStore.getState().setPlaybackSpeed(1.5);
    expect(usePlayerStore.getState().playbackSpeed).toBe(1.5);
  });

  it('setAutoPlayNextEpisode updates autoplay', () => {
    usePlayerStore.getState().setAutoPlayNextEpisode(false);
    expect(usePlayerStore.getState().autoPlayNextEpisode).toBe(false);
  });
});
