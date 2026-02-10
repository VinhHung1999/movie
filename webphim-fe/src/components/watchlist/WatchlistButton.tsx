'use client';

import useSWR from 'swr';
import { Check, Plus } from 'lucide-react';
import api from '@/lib/api';

interface WatchlistButtonProps {
  contentId: string;
  size?: number;
  className?: string;
}

export default function WatchlistButton({ contentId, size = 14, className }: WatchlistButtonProps) {
  const { data, mutate } = useSWR<{ success: true; data: { inWatchlist: boolean } }>(
    `/watchlist/check/${contentId}`,
  );

  const inWatchlist = data?.data?.inWatchlist ?? false;

  const toggle = async () => {
    // Optimistic update
    mutate({ success: true, data: { inWatchlist: !inWatchlist } }, false);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/${contentId}`);
      } else {
        await api.post(`/watchlist/${contentId}`);
      }
      mutate(); // revalidate
    } catch {
      mutate(); // rollback on error
    }
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      className={className ?? 'flex h-8 w-8 items-center justify-center rounded-full border-2 border-netflix-mid-gray text-white transition-colors hover:border-white'}
      aria-label={inWatchlist ? 'Remove from My List' : 'Add to My List'}
      aria-pressed={inWatchlist}
      data-testid="watchlist-button"
    >
      {inWatchlist ? <Check size={size} /> : <Plus size={size} />}
    </button>
  );
}
