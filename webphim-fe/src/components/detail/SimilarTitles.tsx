'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { SimilarContentResponse } from '@/types';
import MovieCard from '@/components/home/MovieCard';
import PreviewModal from '@/components/detail/PreviewModal';

interface SimilarTitlesProps {
  contentId: string;
}

function SkeletonCard() {
  return <div className="aspect-[2/3] animate-pulse rounded bg-neutral-800" />;
}

export default function SimilarTitles({ contentId }: SimilarTitlesProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
  const { data, isLoading } = useSWR<SimilarContentResponse>(
    `/content/${contentId}/similar`
  );

  if (isLoading) {
    return (
      <div data-testid="similar-titles-loading" className="px-4 py-3">
        <h3 className="mb-3 text-lg font-bold text-white">More Like This</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  const items = data?.data;
  if (!items || items.length === 0) return null;

  return (
    <>
      <div data-testid="similar-titles" className="px-4 py-3">
        <h3 className="mb-3 text-lg font-bold text-white">More Like This</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
            <MovieCard key={item.id} item={item} onOpenPreview={() => setPreviewId(item.id)} />
          ))}
        </div>
      </div>
      <PreviewModal
        contentId={previewId!}
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
