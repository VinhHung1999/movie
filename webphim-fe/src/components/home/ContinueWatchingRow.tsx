'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import type { ContinueWatchingItem } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

export default function ContinueWatchingRow() {
  const router = useRouter();
  const { data, isLoading } = useSWR<{ success: true; data: ContinueWatchingItem[] }>(
    '/watch-history/continue?limit=20',
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      dedupingInterval: 0,
    },
  );

  const items = useMemo(() => data?.data ?? [], [data]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  if (isLoading || items.length === 0) return null;

  return (
    <div className="group/row relative py-4" data-testid="continue-watching-row">
      <h2 className="mb-2 px-4 text-lg font-bold text-white md:px-12 md:text-xl">
        Continue Watching
      </h2>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 hidden h-full w-12 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:flex"
            aria-label="Scroll left"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 hidden h-full w-12 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:flex"
            aria-label="Scroll right"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-1 overflow-x-auto px-4 scrollbar-hide md:px-12"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onScroll={updateScrollState}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-[calc((100vw-2rem)/2.5)] flex-shrink-0 sm:w-[calc((100vw-2rem)/3.5)] md:w-[calc((100vw-6rem)/4.5)] lg:w-[calc((100vw-6rem)/5.5)] xl:w-[calc((100vw-6rem)/6.5)]"
            >
              <button
                onClick={() => router.push(`/watch/${item.contentId}`)}
                className="relative w-full cursor-pointer overflow-hidden rounded-sm bg-netflix-dark"
                data-testid={`continue-watching-${item.contentId}`}
              >
                <div className="relative aspect-[2/3]">
                  {item.content.thumbnailUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={`${SERVER_BASE}${item.content.thumbnailUrl}`}
                      alt={item.content.title}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-netflix-dark">
                      <span className="px-2 text-center text-xs text-netflix-mid-gray">
                        {item.content.title}
                      </span>
                    </div>
                  )}

                  {/* Play overlay on hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/40">
                    <Play
                      size={32}
                      fill="white"
                      className="text-white opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-netflix-gray"
                  role="progressbar"
                  aria-valuenow={item.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Watch progress: ${item.progressPercent}%`}
                >
                  <div
                    className="h-full bg-netflix-red"
                    style={{ width: `${item.progressPercent}%` }}
                  />
                </div>
              </button>

              <p className="mt-1 truncate px-1 text-xs text-netflix-light-gray">
                {item.content.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
