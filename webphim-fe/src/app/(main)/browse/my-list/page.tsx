'use client';

import useSWR from 'swr';
import { Loader2, Plus } from 'lucide-react';
import ContentGrid from '@/components/browse/ContentGrid';
import type { WatchlistResponse } from '@/types';

export default function MyListPage() {
  const { data, isLoading } = useSWR<WatchlistResponse>('/watchlist?page=1&limit=40');

  const items = data?.data ?? [];
  const contentItems = items.map((item) => item.content);

  return (
    <div className="min-h-screen bg-netflix-black px-4 pt-20 md:px-12">
      <h1 className="mb-6 text-2xl font-bold text-white">My List</h1>

      {isLoading && (
        <div className="flex justify-center py-16" data-testid="mylist-loading">
          <Loader2 className="h-8 w-8 animate-spin text-netflix-red" />
        </div>
      )}

      {!isLoading && contentItems.length === 0 && (
        <div
          className="flex flex-col items-center justify-center py-16 text-center"
          data-testid="mylist-empty"
          role="status"
          aria-live="polite"
        >
          <Plus size={48} className="mb-4 text-netflix-mid-gray" />
          <p className="text-lg text-netflix-mid-gray">Your list is empty</p>
          <p className="mt-1 text-sm text-netflix-mid-gray">
            Add movies and series to keep track of what you want to watch.
          </p>
        </div>
      )}

      {!isLoading && contentItems.length > 0 && (
        <ContentGrid items={contentItems} />
      )}
    </div>
  );
}
