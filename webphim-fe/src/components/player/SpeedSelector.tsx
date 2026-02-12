'use client';

import { useState, useRef, useEffect } from 'react';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeedSelectorProps {
  currentSpeed: number;
  onSelect: (speed: number) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export default function SpeedSelector({ currentSpeed, onSelect }: SpeedSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative" data-testid="speed-selector">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        data-testid="speed-button"
        className="rounded px-1.5 py-0.5 text-xs font-semibold text-white transition-colors hover:text-netflix-red"
        aria-label="Playback speed"
      >
        {currentSpeed === 1 ? '1x' : `${currentSpeed}x`}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="speed-menu"
            role="menu"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 min-w-[120px] rounded-md bg-netflix-dark/95 py-1 shadow-lg backdrop-blur-sm"
          >
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                type="button"
                role="menuitemradio"
                aria-checked={currentSpeed === speed}
                onClick={() => {
                  onSelect(speed);
                  setOpen(false);
                }}
                data-testid={`speed-option-${speed}`}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-white hover:bg-white/10"
              >
                <span className="w-4">
                  {currentSpeed === speed && <Check className="h-4 w-4 text-netflix-red" />}
                </span>
                {speed}x
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
