'use client';

import { ContentSummary } from '@/types';
import MovieCard from '@/components/home/MovieCard';

interface ContentGridProps {
  items: ContentSummary[];
}

export default function ContentGrid({ items }: ContentGridProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {items.map((item) => (
        <MovieCard key={item.id} item={item} compact />
      ))}
    </div>
  );
}
