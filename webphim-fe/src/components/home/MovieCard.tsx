'use client';

import { ContentSummary } from '@/types';
import NewBadge from '@/components/ui/NewBadge';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function isNew(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const now = new Date();
  const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= 30;
}

interface MovieCardProps {
  item: ContentSummary;
  index?: number;
  compact?: boolean;
  onOpenPreview?: () => void;
}

export default function MovieCard({ item, onOpenPreview }: MovieCardProps) {
  return (
    <div
      data-testid={`movie-card-${item.id}`}
      className="relative flex-shrink-0 cursor-pointer"
      onClick={() => onOpenPreview?.()}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-netflix-dark">
        {isNew(item.createdAt) && <NewBadge />}
        {item.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${SERVER_BASE}${item.thumbnailUrl}`}
            alt={item.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-netflix-dark">
            <span className="px-2 text-center text-xs text-netflix-mid-gray">{item.title}</span>
          </div>
        )}
      </div>
    </div>
  );
}
