'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, useMotionValue } from 'framer-motion';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const x = useMotionValue(0);

  useEffect(() => {
    const updateWidths = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setContentWidth(containerRef.current.scrollWidth);
      }
    };
    updateWidths();
    window.addEventListener('resize', updateWidths);
    return () => window.removeEventListener('resize', updateWidths);
  }, [items]);

  const maxDrag = Math.min(0, -(contentWidth - containerWidth));

  const updateScrollState = useCallback(
    (currentX: number) => {
      setCanScrollLeft(currentX < -10);
      setCanScrollRight(currentX > maxDrag + 10);
    },
    [maxDrag]
  );

  useEffect(() => {
    const unsubscribe = x.on('change', updateScrollState);
    return unsubscribe;
  }, [x, updateScrollState]);

  const scroll = (direction: 'left' | 'right') => {
    const scrollAmount = containerWidth * 0.8;
    const currentX = x.get();
    const newX =
      direction === 'right'
        ? Math.max(maxDrag, currentX - scrollAmount)
        : Math.min(0, currentX + scrollAmount);
    x.set(newX);
  };

  if (items.length === 0) return null;

  return (
    <>
    <div className="group/row relative py-4">
      {/* Title */}
      <h2 className="mb-2 px-4 text-lg font-bold text-white md:px-12 md:text-xl">{title}</h2>

      {/* Carousel container */}
      <div className="relative overflow-x-clip overflow-y-visible">
        {/* Left arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-0 z-20 flex h-full w-10 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:w-12"
            aria-label="Scroll left"
          >
            <ChevronLeft size={28} className="text-white" />
          </button>
        )}

        {/* Right arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-0 z-20 flex h-full w-10 cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity duration-200 group-hover/row:opacity-100 md:w-12"
            aria-label="Scroll right"
          >
            <ChevronRight size={28} className="text-white" />
          </button>
        )}

        {/* Scrollable content */}
        <motion.div
          ref={containerRef}
          className="flex gap-1 px-4 md:px-12"
          drag="x"
          style={{ x }}
          dragConstraints={{ left: maxDrag, right: 0 }}
          dragElastic={0.1}
          dragTransition={{ bounceStiffness: 300, bounceDamping: 30 }}
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
                  className="flex cursor-pointer items-end"
                  onClick={() => setPreviewId(item.id)}
                >
                  <span
                    className="select-none font-black leading-none text-transparent [-webkit-text-stroke:2px_rgba(128,128,128,0.5)] text-[120px] sm:text-[140px] md:text-[160px]"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </span>
                  <div className="-ml-6 w-[60%] flex-shrink-0 sm:-ml-8">
                    <MovieCard item={item} onOpenPreview={() => setPreviewId(item.id)} />
                  </div>
                </div>
              ) : (
                <MovieCard item={item} onOpenPreview={() => setPreviewId(item.id)} />
              )}
            </div>
          ))}
        </motion.div>
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
