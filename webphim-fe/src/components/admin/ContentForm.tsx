'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import api from '@/lib/api';
import { Genre, ContentType, MaturityRating } from '@/types';

const MATURITY_OPTIONS: MaturityRating[] = ['G', 'PG', 'PG13', 'R', 'NC17'];

interface ContentFormData {
  type: ContentType;
  title: string;
  description: string;
  releaseYear: number;
  maturityRating: MaturityRating;
  duration: number | null;
  genreIds: string[];
}

interface ContentFormProps {
  mode: 'create' | 'edit';
  contentId?: string;
}

export default function ContentForm({ mode, contentId }: ContentFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ContentFormData>({
    type: 'MOVIE',
    title: '',
    description: '',
    releaseYear: new Date().getFullYear(),
    maturityRating: 'PG13',
    duration: null,
    genreIds: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch genres for checkboxes
  const { data: genresData } = useSWR<{ success: true; data: Genre[] }>('/genres');
  const genres = genresData?.data ?? [];

  // Fetch existing content for edit mode
  const { data: contentData } = useSWR<{ success: true; data: { id: string; type: ContentType; title: string; description: string; releaseYear: number; maturityRating: MaturityRating; duration: number | null; genres: Genre[] } }>(
    mode === 'edit' && contentId ? `/content/${contentId}` : null,
  );

  useEffect(() => {
    if (contentData?.data) {
      const c = contentData.data;
      setForm({
        type: c.type,
        title: c.title,
        description: c.description,
        releaseYear: c.releaseYear,
        maturityRating: c.maturityRating,
        duration: c.duration,
        genreIds: c.genres.map((g) => g.id),
      });
    }
  }, [contentData]);

  const handleGenreToggle = (genreId: string) => {
    setForm((prev) => ({
      ...prev,
      genreIds: prev.genreIds.includes(genreId)
        ? prev.genreIds.filter((id) => id !== genreId)
        : [...prev.genreIds, genreId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      releaseYear: form.releaseYear,
      maturityRating: form.maturityRating,
      duration: form.type === 'MOVIE' ? form.duration : null,
      genreIds: form.genreIds,
    };

    try {
      if (mode === 'create') {
        await api.post('/admin/content', payload);
      } else {
        await api.put(`/admin/content/${contentId}`, payload);
      }
      router.push('/admin/content');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { message?: string } } };
        setError(axiosErr.response?.data?.message || 'Failed to save.');
      } else {
        setError('Failed to save. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">
        {mode === 'create' ? 'Add Content' : 'Edit Content'}
      </h1>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
        {/* Type */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-netflix-white">Type</legend>
          <div className="flex gap-4">
            {(['MOVIE', 'SERIES'] as ContentType[]).map((t) => (
              <label key={t} className="flex items-center gap-2 text-sm text-netflix-light-gray">
                <input
                  type="radio"
                  name="type"
                  value={t}
                  checked={form.type === t}
                  onChange={() => setForm((p) => ({ ...p, type: t }))}
                  className="accent-netflix-red"
                />
                {t === 'MOVIE' ? 'Movie' : 'Series'}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Title */}
        <div>
          <label htmlFor="cf-title" className="mb-1 block text-sm font-medium text-netflix-white">
            Title <span className="text-netflix-red">*</span>
          </label>
          <input
            id="cf-title"
            type="text"
            required
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="cf-desc" className="mb-1 block text-sm font-medium text-netflix-white">
            Description <span className="text-netflix-red">*</span>
          </label>
          <textarea
            id="cf-desc"
            required
            maxLength={2000}
            rows={4}
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full resize-none rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
          />
        </div>

        {/* Release Year + Maturity Rating */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cf-year" className="mb-1 block text-sm font-medium text-netflix-white">
              Release Year <span className="text-netflix-red">*</span>
            </label>
            <input
              id="cf-year"
              type="number"
              required
              min={1900}
              max={2100}
              value={form.releaseYear}
              onChange={(e) => setForm((p) => ({ ...p, releaseYear: Number(e.target.value) }))}
              className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white focus:border-netflix-light-gray focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="cf-rating" className="mb-1 block text-sm font-medium text-netflix-white">
              Maturity Rating
            </label>
            <select
              id="cf-rating"
              value={form.maturityRating}
              onChange={(e) => setForm((p) => ({ ...p, maturityRating: e.target.value as MaturityRating }))}
              className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white focus:border-netflix-light-gray focus:outline-none"
            >
              {MATURITY_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Duration (only for Movie) */}
        {form.type === 'MOVIE' && (
          <div>
            <label htmlFor="cf-duration" className="mb-1 block text-sm font-medium text-netflix-white">
              Duration (minutes)
            </label>
            <input
              id="cf-duration"
              type="number"
              min={1}
              value={form.duration ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value ? Number(e.target.value) : null }))}
              placeholder="e.g. 120"
              className="w-full rounded-md border border-netflix-border bg-netflix-gray px-4 py-2.5 text-sm text-netflix-white placeholder:text-netflix-mid-gray focus:border-netflix-light-gray focus:outline-none"
            />
          </div>
        )}

        {/* Genres */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-netflix-white">Genres</legend>
          <div className="flex flex-wrap gap-3">
            {genres.map((g) => (
              <label key={g.id} className="flex items-center gap-1.5 text-sm text-netflix-light-gray">
                <input
                  type="checkbox"
                  checked={form.genreIds.includes(g.id)}
                  onChange={() => handleGenreToggle(g.id)}
                  className="accent-netflix-red"
                />
                {g.name}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Error */}
        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="rounded-md bg-netflix-red px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-netflix-red-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/admin/content')}
            className="rounded-md border border-netflix-border px-6 py-2.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
