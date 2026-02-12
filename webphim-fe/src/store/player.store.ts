import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PlayerPreferences {
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  autoPlayNextEpisode: boolean;
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  setPlaybackSpeed: (s: number) => void;
  setAutoPlayNextEpisode: (a: boolean) => void;
}

export const usePlayerStore = create<PlayerPreferences>()(
  persist(
    (set) => ({
      volume: 1,
      isMuted: false,
      playbackSpeed: 1,
      autoPlayNextEpisode: true,
      setVolume: (volume) => set({ volume }),
      setMuted: (isMuted) => set({ isMuted }),
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
      setAutoPlayNextEpisode: (autoPlayNextEpisode) => set({ autoPlayNextEpisode }),
    }),
    {
      name: 'webphim-player',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
