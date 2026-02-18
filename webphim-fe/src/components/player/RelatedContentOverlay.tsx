'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import type { ContentSummary } from '@/types';

interface RelatedContentOverlayProps {
  contentId: string;
  onDismiss: () => void;
}

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

export default function RelatedContentOverlay({ contentId, onDismiss }: RelatedContentOverlayProps) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data } = useSWR<{ success: true; data: ContentSummary[] }>(
    `/content/${contentId}/similar?limit=4`,
  );

  const items = data?.data ?? [];

  // Auto-dismiss after 15 seconds
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onDismiss();
    }, 15000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  if (items.length === 0) return null;

  return (
    <motion.div
      data-testid="related-content-overlay"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="pointer-events-auto absolute bottom-20 right-4 z-40 w-80 rounded-lg bg-netflix-dark/95 p-4 shadow-2xl backdrop-blur-sm md:right-8"
      role="dialog"
      aria-label="Related content"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">More Like This</p>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-neutral-400 transition-colors hover:text-white"
          aria-label="Dismiss"
          data-testid="related-content-dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(`/title/${item.id}`)}
            className="overflow-hidden rounded text-left transition-transform hover:scale-105"
            data-testid={`related-item-${item.id}`}
          >
            {item.thumbnailUrl ? (
              <img
                src={`${SERVER_BASE}${item.thumbnailUrl}`}
                alt={item.title}
                className="aspect-[2/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[2/3] w-full items-center justify-center bg-netflix-gray">
                <span className="px-1 text-center text-xs text-netflix-mid-gray">{item.title}</span>
              </div>
            )}
            <p className="mt-1 truncate text-xs text-netflix-light-gray">{item.title}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
