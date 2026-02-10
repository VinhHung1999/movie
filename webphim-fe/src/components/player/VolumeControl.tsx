// UPLOAD LEARN 13: VolumeControl - icon + slider.
// Click icon toggle mute. Kéo slider thay đổi volume 0→1.
'use client';

import { useCallback, useRef } from 'react';
import { Volume2, Volume1, VolumeX } from 'lucide-react';

interface VolumeControlProps {
  volume: number;
  isMuted: boolean;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
}

export default function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleSliderClick = useCallback(
    (e: React.MouseEvent) => {
      const slider = sliderRef.current;
      if (!slider) return;
      const rect = slider.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onVolumeChange(ratio);
    },
    [onVolumeChange]
  );

  const displayVolume = isMuted ? 0 : volume;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="group/vol flex items-center gap-1" data-testid="volume-control">
      <button
        type="button"
        onClick={onToggleMute}
        data-testid="volume-icon"
        className="rounded p-1 text-white transition-colors hover:text-netflix-red"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        <VolumeIcon className="h-5 w-5" />
      </button>

      <div
        ref={sliderRef}
        data-testid="volume-slider"
        className="flex h-5 w-0 cursor-pointer items-center transition-all group-hover/vol:w-20"
        onClick={handleSliderClick}
        role="slider"
        aria-label="Volume"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayVolume * 100)}
        tabIndex={0}
      >
        <div className="relative h-1 w-full rounded-full bg-white/30">
          <div
            data-testid="volume-fill"
            className="absolute top-0 h-full rounded-full bg-white"
            style={{ width: `${displayVolume * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
