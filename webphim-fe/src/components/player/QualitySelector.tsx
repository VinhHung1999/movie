// UPLOAD LEARN 15: QualitySelector - dropdown chọn chất lượng video.
// hls.js cho phép set currentLevel: -1=Auto, 0=lowest, n=highest.
// Hiển thị danh sách quality levels từ MANIFEST_PARSED event.
'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { QualityLevel } from '@/hooks/useVideoPlayer';

interface QualitySelectorProps {
  qualities: QualityLevel[];
  currentQuality: number; // -1 = auto
  onSelect: (index: number) => void;
}

export default function QualitySelector({
  qualities,
  currentQuality,
  onSelect,
}: QualitySelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (qualities.length === 0) return null;

  return (
    <div ref={containerRef} className="relative" data-testid="quality-selector">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-testid="quality-button"
        className="rounded p-1 text-white transition-colors hover:text-netflix-red"
        aria-label="Video quality"
      >
        <Settings className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="quality-menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 min-w-[140px] rounded-md bg-netflix-dark/95 py-1 shadow-lg backdrop-blur-sm"
          >
            {/* Auto option */}
            <button
              type="button"
              onClick={() => {
                onSelect(-1);
                setOpen(false);
              }}
              data-testid="quality-option-auto"
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-white/10"
            >
              <span className="w-4">
                {currentQuality === -1 && <Check className="h-4 w-4 text-netflix-red" />}
              </span>
              Auto
            </button>

            {/* Quality levels (highest first) */}
            {[...qualities].reverse().map((q, reversedIndex) => {
              const actualIndex = qualities.length - 1 - reversedIndex;
              return (
                <button
                  key={q.height}
                  type="button"
                  onClick={() => {
                    onSelect(actualIndex);
                    setOpen(false);
                  }}
                  data-testid={`quality-option-${q.height}`}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-white/10"
                >
                  <span className="w-4">
                    {currentQuality === actualIndex && (
                      <Check className="h-4 w-4 text-netflix-red" />
                    )}
                  </span>
                  {q.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
