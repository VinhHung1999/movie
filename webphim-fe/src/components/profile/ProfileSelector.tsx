'use client';

import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Plus } from 'lucide-react';
import type { Profile } from '@/types';
import { useProfileStore } from '@/store/profile.store';
import ProfileCard from './ProfileCard';

export default function ProfileSelector() {
  const router = useRouter();
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile);

  const { data } = useSWR<{ success: true; data: Profile[] }>('/profiles');
  const profiles = data?.data ?? [];

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfile(profile);
    router.push('/home');
  };

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-netflix-black px-4"
      data-testid="profile-selector"
    >
      <h1 className="mb-8 text-3xl font-medium text-white md:text-4xl">
        Who&apos;s watching?
      </h1>

      <div className="flex flex-wrap justify-center gap-6" data-testid="profile-grid">
        {profiles.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            onClick={() => handleSelectProfile(profile)}
          />
        ))}

        {profiles.length < 5 && (
          <button
            onClick={() => router.push('/profiles/manage')}
            className="group flex flex-col items-center gap-2"
            aria-label="Add new profile"
            data-testid="add-profile-button"
          >
            <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-netflix-mid-gray transition-colors group-hover:border-white">
              <Plus size={40} className="text-netflix-mid-gray transition-colors group-hover:text-white" />
            </div>
            <span className="text-sm text-netflix-mid-gray transition-colors group-hover:text-white">
              Add Profile
            </span>
          </button>
        )}
      </div>

      <button
        onClick={() => router.push('/profiles/manage')}
        className="mt-10 rounded border border-netflix-mid-gray px-6 py-2 text-sm text-netflix-mid-gray transition-colors hover:border-white hover:text-white"
        aria-label="Manage profiles"
        data-testid="manage-profiles-button"
      >
        Manage Profiles
      </button>
    </div>
  );
}
