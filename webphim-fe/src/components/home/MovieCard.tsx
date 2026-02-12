'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronDown } from 'lucide-react';
import { ContentSummary } from '@/types';
import WatchlistButton from '@/components/watchlist/WatchlistButton';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

const HOVER_DELAY = 300;

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface MovieCardProps {
  item: ContentSummary;
  index?: number;
  compact?: boolean;
  onOpenPreview?: () => void;
}

export default function MovieCard({ item, compact = false, onOpenPreview }: MovieCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeout = useRef<NodeJS.Timeout>(null);

  const handleHoverStart = useCallback(() => {
    if (compact) return;
    hoverTimeout.current = setTimeout(() => setIsHovered(true), HOVER_DELAY);
  }, [compact]);

  const handleHoverEnd = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setIsHovered(false);
  }, []);

  return (
    <motion.div
      data-testid={`movie-card-${item.id}`}
      className="relative flex-shrink-0 cursor-pointer"
      onClick={() => router.push(`/title/${item.id}`)}
      onPointerEnter={handleHoverStart}
      onPointerLeave={handleHoverEnd}
      animate={{
        scale: isHovered ? 1.3 : 1,
        zIndex: isHovered ? 50 : 1,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{ transformOrigin: 'center top' }}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-sm bg-netflix-dark">
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

      {/* Hover overlay */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 rounded-b bg-gradient-to-t from-netflix-dark via-netflix-dark to-transparent p-3 pt-8 shadow-lg"
          >
            {/* Action buttons */}
            <div className="mb-2 flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); router.push(`/watch/${item.id}`); }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/80"
              >
                <Play size={14} fill="currentColor" />
              </button>
              <WatchlistButton contentId={item.id} size={14} />
              <button
                data-testid={`chevron-down-${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenPreview?.();
                }}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-full border-2 border-netflix-mid-gray text-white transition-colors hover:border-white"
              >
                <ChevronDown size={14} />
              </button>
            </div>

            {/* Title */}
            <p className="truncate text-sm font-semibold text-white">{item.title}</p>

            {/* Meta info */}
            <div className="mt-1 flex items-center gap-1.5 text-xs text-netflix-light-gray">
              <span>{item.releaseYear}</span>
              <span className="rounded border border-netflix-mid-gray px-1 py-0.5 text-[10px] leading-none">
                {item.maturityRating}
              </span>
              {item.duration && <span>{formatDuration(item.duration)}</span>}
            </div>

            {/* Genre tags */}
            {item.genres.length > 0 && (
              <p className="mt-1.5 truncate text-xs text-netflix-mid-gray">
                {item.genres
                  .slice(0, 3)
                  .map((g) => g.name)
                  .join(' \u2022 ')}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
