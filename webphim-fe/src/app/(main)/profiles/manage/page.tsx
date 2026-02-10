'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Pencil, Trash2 } from 'lucide-react';
import api from '@/lib/api';
import type { Profile } from '@/types';
import ProfileForm from '@/components/profile/ProfileForm';
import ProfileDeleteDialog from '@/components/profile/ProfileDeleteDialog';

type ViewMode = 'list' | 'create' | 'edit';

export default function ProfileManagePage() {
  const router = useRouter();
  const { data, mutate } = useSWR<{ success: true; data: Profile[] }>('/profiles');
  const profiles = data?.data ?? [];

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(
    async (formData: { name: string; avatarUrl: string | null; isKids: boolean }) => {
      setIsSubmitting(true);
      try {
        await api.post('/profiles', formData);
        await mutate();
        setViewMode('list');
      } catch {
        // Stay on form so user can retry
      } finally {
        setIsSubmitting(false);
      }
    },
    [mutate],
  );

  const handleEdit = useCallback(
    async (formData: { name: string; avatarUrl: string | null; isKids: boolean }) => {
      if (!editingProfile) return;
      setIsSubmitting(true);
      try {
        await api.put(`/profiles/${editingProfile.id}`, formData);
        await mutate();
        setViewMode('list');
        setEditingProfile(null);
      } catch {
        // Stay on form so user can retry
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingProfile, mutate],
  );

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/profiles/${deleteTarget.id}`);
      await mutate();
      setDeleteTarget(null);
    } catch {
      // Keep dialog open so user can retry or cancel
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, mutate]);

  if (viewMode === 'create') {
    return (
      <div className="min-h-screen bg-netflix-black px-4 pt-20">
        <ProfileForm
          onSubmit={handleCreate}
          onCancel={() => setViewMode('list')}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  if (viewMode === 'edit' && editingProfile) {
    return (
      <div className="min-h-screen bg-netflix-black px-4 pt-20">
        <ProfileForm
          profile={editingProfile}
          onSubmit={handleEdit}
          onCancel={() => {
            setViewMode('list');
            setEditingProfile(null);
          }}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-netflix-black px-4 pt-20" data-testid="profile-manage">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-center text-2xl font-medium text-white">Manage Profiles</h1>

        <div className="flex flex-wrap justify-center gap-6" data-testid="manage-profile-grid">
          {profiles.map((profile) => (
            <div key={profile.id} className="group relative flex flex-col items-center gap-2">
              <div
                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md"
                style={{
                  backgroundColor: profile.avatarUrl ?? '#E50914',
                }}
              >
                <span className="text-3xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>

                {/* Edit/Delete overlay */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setEditingProfile(profile);
                      setViewMode('edit');
                    }}
                    className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
                    aria-label={`Edit ${profile.name}`}
                    data-testid={`edit-profile-${profile.id}`}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(profile)}
                    disabled={profiles.length <= 1}
                    className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40 disabled:cursor-not-allowed disabled:opacity-30"
                    aria-label={`Delete ${profile.name}`}
                    title={profiles.length <= 1 ? 'Cannot delete last profile' : undefined}
                    data-testid={`delete-profile-${profile.id}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <span className="text-sm text-netflix-mid-gray">{profile.name}</span>
            </div>
          ))}

          {profiles.length < 5 && (
            <button
              onClick={() => setViewMode('create')}
              className="flex flex-col items-center gap-2"
              aria-label="Add new profile"
              data-testid="add-profile-manage-button"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-md border-2 border-dashed border-netflix-mid-gray transition-colors hover:border-white">
                <span className="text-3xl text-netflix-mid-gray">+</span>
              </div>
              <span className="text-sm text-netflix-mid-gray">Add Profile</span>
            </button>
          )}
        </div>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => router.push('/profiles')}
            className="rounded border border-white px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-black"
            data-testid="done-button"
          >
            Done
          </button>
        </div>
      </div>

      <ProfileDeleteDialog
        profileName={deleteTarget?.name ?? ''}
        isOpen={!!deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isDeleting={isSubmitting}
      />
    </div>
  );
}
