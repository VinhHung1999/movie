'use client';

import { useState } from 'react';
import { ContentSummary } from '@/types';
import MovieCard from '@/components/home/MovieCard';
import PreviewModal from '@/components/detail/PreviewModal';

interface ContentGridProps {
  items: ContentSummary[];
}

export default function ContentGrid({ items }: ContentGridProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {items.map((item) => (
          <MovieCard key={item.id} item={item} onOpenPreview={() => setPreviewId(item.id)} />
        ))}
      </div>
      <PreviewModal
        contentId={previewId!}
        isOpen={!!previewId}
        onClose={() => setPreviewId(null)}
      />
    </>
  );
}
