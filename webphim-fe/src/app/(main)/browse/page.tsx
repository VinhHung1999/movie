'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import type { GenreListResponse } from '@/types';

export default function BrowsePage() {
  const { data, isLoading } = useSWR<GenreListResponse>('/genres');
  const genres = data?.data ?? [];

  return (
    <div className="min-h-screen px-4 pt-24 pb-12 md:px-12">
      <h1 className="mb-8 text-3xl font-bold text-white">Browse by Category</h1>

      {isLoading && (
        <div className="flex justify-center py-16" data-testid="browse-loading">
          <Loader2 className="h-8 w-8 animate-spin text-netflix-red" />
        </div>
      )}

      {!isLoading && genres.length === 0 && (
        <p className="py-16 text-center text-netflix-mid-gray" data-testid="browse-empty">
          No categories available.
        </p>
      )}

      {!isLoading && genres.length > 0 && (
        <div
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          data-testid="genre-grid"
        >
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/browse/${genre.slug}`}
              className="group rounded-lg bg-netflix-dark p-4 transition-colors hover:bg-netflix-gray"
              data-testid={`genre-card-${genre.slug}`}
            >
              <h2 className="text-lg font-semibold text-white transition-colors group-hover:text-netflix-red">
                {genre.name}
              </h2>
              <p className="mt-1 text-sm text-netflix-mid-gray">
                {genre.contentCount} {genre.contentCount === 1 ? 'title' : 'titles'}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
