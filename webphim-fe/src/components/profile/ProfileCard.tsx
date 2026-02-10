'use client';

import type { Profile } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

const AVATAR_COLORS = [
  '#E50914', '#B81D24', '#221F1F', '#F5F5F1',
  '#0073E6', '#46D369', '#E87C03', '#6B3FA0',
];

interface ProfileCardProps {
  profile: Profile;
  onClick: () => void;
}

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function isImagePath(url: string | null): boolean {
  return !!url && url.startsWith('/');
}

export default function ProfileCard({ profile, onClick }: ProfileCardProps) {
  const initial = profile.name.charAt(0).toUpperCase();
  // Use avatarUrl as bg color if it's a color string (#hex), otherwise fall back to name-derived color
  const bgColor = profile.avatarUrl && profile.avatarUrl.startsWith('#')
    ? profile.avatarUrl
    : getColorForName(profile.name);

  const hasImage = isImagePath(profile.avatarUrl);

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2"
      aria-label={`Switch to ${profile.name} profile`}
      data-testid={`profile-card-${profile.id}`}
    >
      <div
        className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border-2 border-transparent transition-colors group-hover:border-white"
        style={{ backgroundColor: hasImage ? undefined : bgColor }}
      >
        {hasImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${SERVER_BASE}${profile.avatarUrl}`}
            alt={profile.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-3xl font-bold text-white">{initial}</span>
        )}
      </div>
      <span className="text-sm text-netflix-mid-gray transition-colors group-hover:text-white">
        {profile.name}
      </span>
    </button>
  );
}
