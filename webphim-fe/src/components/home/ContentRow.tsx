'use client';

import { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ContentSummary } from '@/types';
import MovieCard from './MovieCard';
import PreviewModal from '@/components/detail/PreviewModal';

interface ContentRowProps {
  title: string;
  items: ContentSummary[];
  ranked?: boolean;
}

export default function ContentRow({ title, items, ranked = false }: ContentRowProps) {
  const [previewId, setPreviewId] = useState<string | null>(null);
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

  if (items.length === 0) return null;

  return (
    <>
      <div className="group/row relative py-4">
        {/* Title */}
        <h2 className="mb-2 px-4 text-lg font-bold text-white md:px-12 md:text-xl">{title}</h2>

        {/* Carousel container */}
        <div className="relative">
          {/* Left arrow — desktop only */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-0 z-20 hidden h-full w-12 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:flex"
              aria-label="Scroll left"
            >
              <ChevronLeft size={28} className="text-white" />
            </button>
          )}

          {/* Right arrow — desktop only */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-0 z-20 hidden h-full w-12 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:flex"
              aria-label="Scroll right"
            >
              <ChevronRight size={28} className="text-white" />
            </button>
          )}

          {/* Scrollable content — native scroll for touch, smooth for desktop */}
          <div
            ref={scrollRef}
            data-testid="content-row-scroll"
            className="flex gap-1 overflow-x-auto px-4 scrollbar-hide md:px-12"
            style={{ WebkitOverflowScrolling: 'touch' }}
            onScroll={updateScrollState}
          >
            {items.map((item, index) => (
              <div
                key={item.id}
                className={
                  ranked
                    ? 'w-[calc((100vw-2rem)/1.8)] flex-shrink-0 sm:w-[calc((100vw-2rem)/2.5)] md:w-[calc((100vw-6rem)/3.2)] lg:w-[calc((100vw-6rem)/4)] xl:w-[calc((100vw-6rem)/4.8)]'
                    : 'w-[calc((100vw-2rem)/2.5)] flex-shrink-0 sm:w-[calc((100vw-2rem)/3.5)] md:w-[calc((100vw-6rem)/4.5)] lg:w-[calc((100vw-6rem)/5.5)] xl:w-[calc((100vw-6rem)/6.5)]'
                }
              >
                {ranked ? (
                  <div
                    data-testid={`ranked-card-${index + 1}`}
                    className="relative flex cursor-pointer items-end"
                    onClick={() => setPreviewId(item.id)}
                  >
                    <span
                      className="z-10 flex-shrink-0 select-none text-right font-black italic leading-[0.75] text-neutral-800 [-webkit-text-stroke:3px_rgba(255,255,255,0.4)] text-[100px] sm:text-[130px] md:text-[160px]"
                      style={{ minWidth: '0.6em' }}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="w-[55%] flex-shrink-0 sm:w-[50%]">
                      <MovieCard item={item} onOpenPreview={() => setPreviewId(item.id)} />
                    </div>
                  </div>
                ) : (
                  <MovieCard item={item} onOpenPreview={() => setPreviewId(item.id)} />
                )}
              </div>
            ))}
          </div>
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
