'use client';

import { useState } from 'react';
import type { Profile } from '@/types';

const AVATAR_COLORS = [
  '#E50914', '#B81D24', '#221F1F', '#F5F5F1',
  '#0073E6', '#46D369', '#E87C03', '#6B3FA0',
];

interface ProfileFormProps {
  profile?: Profile;
  onSubmit: (data: { name: string; avatarUrl: string | null; isKids: boolean }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function ProfileForm({ profile, onSubmit, onCancel, isSubmitting }: ProfileFormProps) {
  const [name, setName] = useState(profile?.name ?? '');
  const [selectedColor, setSelectedColor] = useState(profile?.avatarUrl ?? AVATAR_COLORS[0]);
  const [isKids, setIsKids] = useState(profile?.isKids ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), avatarUrl: selectedColor, isKids });
  };

  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md space-y-6"
      data-testid="profile-form"
    >
      <h2 className="text-2xl font-medium text-white">
        {profile ? 'Edit Profile' : 'Add Profile'}
      </h2>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <div
          className="flex h-24 w-24 items-center justify-center rounded-md"
          style={{ backgroundColor: selectedColor }}
          data-testid="avatar-preview"
        >
          <span className="text-3xl font-bold text-white">{initial}</span>
        </div>
      </div>

      {/* Name input */}
      <div>
        <label htmlFor="profile-name" className="mb-1 block text-sm text-netflix-mid-gray">
          Name
        </label>
        <input
          id="profile-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          required
          className="w-full rounded border border-netflix-border bg-netflix-dark px-3 py-2 text-white placeholder-netflix-mid-gray outline-none focus:border-white"
          placeholder="Profile name"
          data-testid="profile-name-input"
        />
      </div>

      {/* Color picker */}
      <div>
        <span className="mb-2 block text-sm text-netflix-mid-gray">Avatar Color</span>
        <div className="flex flex-wrap gap-2" data-testid="color-picker">
          {AVATAR_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`h-10 w-10 rounded-md border-2 transition-colors ${
                selectedColor === color ? 'border-white' : 'border-transparent'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
              aria-pressed={selectedColor === color}
              data-testid={`color-${color}`}
            />
          ))}
        </div>
      </div>

      {/* Kids toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="is-kids"
          checked={isKids}
          onChange={(e) => setIsKids(e.target.checked)}
          className="h-5 w-5 accent-netflix-red"
          data-testid="kids-toggle"
        />
        <label htmlFor="is-kids" className="text-sm text-netflix-mid-gray">
          Kids profile (restricts to G and PG content)
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!name.trim() || isSubmitting}
          className="rounded bg-white px-6 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/80 disabled:opacity-50"
          data-testid="profile-save-button"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-netflix-mid-gray px-6 py-2 text-sm text-netflix-mid-gray transition-colors hover:border-white hover:text-white"
          data-testid="profile-cancel-button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
