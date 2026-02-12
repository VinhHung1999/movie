'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useProfileStore } from '@/store/profile.store';
import { usePlayerStore } from '@/store/player.store';
import api from '@/lib/api';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AccountPage() {
  const user = useAuthStore((s) => s.user);
  const profiles = useProfileStore((s) => s.profiles);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Player preferences
  const volume = usePlayerStore((s) => s.volume);
  const autoPlay = usePlayerStore((s) => s.autoPlayNextEpisode);
  const playbackSpeed = usePlayerStore((s) => s.playbackSpeed);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setAutoPlay = usePlayerStore((s) => s.setAutoPlayNextEpisode);
  const setSpeed = usePlayerStore((s) => s.setPlaybackSpeed);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully');
      setShowPasswordForm(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8" data-testid="account-page">
      <h1 className="mb-8 text-3xl font-bold text-white">Account</h1>

      {/* Membership Section */}
      <section className="mb-8 rounded-lg border border-netflix-border bg-netflix-dark/50 p-6" data-testid="membership-section">
        <h2 className="mb-4 text-lg font-semibold text-netflix-light-gray uppercase tracking-wider">
          Membership
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Email</p>
              <p className="text-white">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-neutral-400">Password</p>
              <p className="text-white">••••••••</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setPasswordError('');
                setPasswordSuccess('');
              }}
              data-testid="change-password-toggle"
              className="text-sm text-netflix-light-gray transition-colors hover:text-white"
            >
              {showPasswordForm ? 'Cancel' : 'Change'}
            </button>
          </div>

          {/* Password Change Form */}
          {showPasswordForm && (
            <form
              onSubmit={handleChangePassword}
              className="mt-4 space-y-3 rounded-md border border-netflix-border bg-netflix-dark p-4"
              data-testid="change-password-form"
            >
              <div>
                <label htmlFor="current-password" className="mb-1 block text-sm text-neutral-400">
                  Current Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded border border-netflix-border bg-netflix-gray px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-netflix-light-gray focus:outline-none"
                  data-testid="current-password-input"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="mb-1 block text-sm text-neutral-400">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full rounded border border-netflix-border bg-netflix-gray px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-netflix-light-gray focus:outline-none"
                  aria-describedby="password-requirements"
                  data-testid="new-password-input"
                />
                <p id="password-requirements" className="mt-1 text-xs text-neutral-500">
                  8+ characters, uppercase, lowercase, digit, special character
                </p>
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-1 block text-sm text-neutral-400">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded border border-netflix-border bg-netflix-gray px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:border-netflix-light-gray focus:outline-none"
                  data-testid="confirm-password-input"
                />
              </div>

              {passwordError && (
                <p role="alert" className="text-sm text-red-500" data-testid="password-error">
                  {passwordError}
                </p>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                data-testid="submit-password"
                className="rounded bg-netflix-red px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover disabled:opacity-50"
              >
                {passwordLoading ? 'Saving...' : 'Save Password'}
              </button>
            </form>
          )}

          {passwordSuccess && (
            <p role="alert" className="text-sm text-green-500" data-testid="password-success">
              {passwordSuccess}
            </p>
          )}

          <div>
            <p className="text-sm text-neutral-400">Name</p>
            <p className="text-white">{user?.name}</p>
          </div>

          {memberSince && (
            <div>
              <p className="text-sm text-neutral-400">Member since</p>
              <p className="text-white">{memberSince}</p>
            </div>
          )}
        </div>
      </section>

      {/* Profiles Section */}
      <section className="mb-8 rounded-lg border border-netflix-border bg-netflix-dark/50 p-6" data-testid="profiles-section">
        <h2 className="mb-4 text-lg font-semibold text-netflix-light-gray uppercase tracking-wider">
          Profiles
        </h2>

        {profiles && profiles.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded text-sm font-bold text-white"
                  style={{ backgroundColor: p.avatarUrl?.startsWith('#') ? p.avatarUrl : '#E50914' }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-white">{p.name}</span>
              </div>
            ))}
          </div>
        )}

        <Link
          href="/profiles/manage"
          data-testid="manage-profiles-link"
          className="inline-block rounded border border-netflix-border px-4 py-2 text-sm text-netflix-light-gray transition-colors hover:border-white hover:text-white"
        >
          Manage Profiles
        </Link>
      </section>

      {/* Playback Settings Section */}
      <section className="rounded-lg border border-netflix-border bg-netflix-dark/50 p-6" data-testid="playback-section">
        <h2 className="mb-4 text-lg font-semibold text-netflix-light-gray uppercase tracking-wider">
          Playback Settings
        </h2>

        <div className="space-y-5">
          {/* Volume */}
          <div>
            <label htmlFor="default-volume" className="mb-2 block text-sm text-neutral-400">
              Default Volume: {Math.round(volume * 100)}%
            </label>
            <input
              id="default-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full max-w-xs accent-netflix-red"
              data-testid="volume-slider"
            />
          </div>

          {/* Auto-play next episode */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white">Auto-play next episode</p>
              <p className="text-xs text-neutral-500">Automatically play the next episode in a series</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={autoPlay}
              onClick={() => setAutoPlay(!autoPlay)}
              data-testid="autoplay-toggle"
              className={`relative h-6 w-11 rounded-full transition-colors ${autoPlay ? 'bg-netflix-red' : 'bg-neutral-600'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${autoPlay ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>

          {/* Default playback speed */}
          <div>
            <label htmlFor="default-speed" className="mb-2 block text-sm text-neutral-400">
              Default Playback Speed
            </label>
            <select
              id="default-speed"
              value={playbackSpeed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              data-testid="speed-select"
              className="rounded border border-netflix-border bg-netflix-gray px-3 py-2 text-sm text-white focus:border-netflix-light-gray focus:outline-none"
            >
              {SPEED_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>
    </div>
  );
}
