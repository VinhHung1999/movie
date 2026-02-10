'use client';

import useSWR from 'swr';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import api from '@/lib/api';
import type { RatingData } from '@/types';

interface RatingButtonsProps {
  contentId: string;
}

export default function RatingButtons({ contentId }: RatingButtonsProps) {
  const { data, mutate } = useSWR<{ success: true; data: RatingData | null }>(
    `/ratings/${contentId}`,
  );

  const currentScore = data?.data?.score ?? null;

  const handleRate = async (score: number) => {
    if (currentScore === score) {
      // Remove rating (toggle off)
      mutate({ success: true, data: null }, false);
      try {
        await api.delete(`/ratings/${contentId}`);
        mutate();
      } catch {
        mutate();
      }
    } else {
      // Set or change rating
      mutate(
        { success: true, data: { contentId, score, updatedAt: new Date().toISOString() } },
        false,
      );
      try {
        await api.post(`/ratings/${contentId}`, { score });
        mutate();
      } catch {
        mutate();
      }
    }
  };

  return (
    <div role="group" aria-label="Rate this title" className="flex items-center gap-1">
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRate(1);
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors hover:border-white ${
          currentScore === 1
            ? 'border-white bg-white/20 text-white'
            : 'border-netflix-mid-gray text-white'
        }`}
        aria-label="Rate thumbs up"
        aria-pressed={currentScore === 1}
        data-testid="rate-thumbs-up"
      >
        <ThumbsUp size={14} fill={currentScore === 1 ? 'currentColor' : 'none'} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRate(2);
        }}
        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors hover:border-white ${
          currentScore === 2
            ? 'border-white bg-white/20 text-white'
            : 'border-netflix-mid-gray text-white'
        }`}
        aria-label="Rate thumbs down"
        aria-pressed={currentScore === 2}
        data-testid="rate-thumbs-down"
      >
        <ThumbsDown size={14} fill={currentScore === 2 ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
