import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Profile } from '@/types';

interface ProfileState {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile) => void;
  clearProfile: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      activeProfile: null,
      setActiveProfile: (profile) => set({ activeProfile: profile }),
      clearProfile: () => set({ activeProfile: null }),
    }),
    {
      name: 'webphim-profile',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
