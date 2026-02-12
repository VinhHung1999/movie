'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Play, Plus, Volume2, VolumeX } from 'lucide-react';
import { ContentDetail } from '@/types';
import ContentMeta from './ContentMeta';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

interface ContentHeroProps {
  content: ContentDetail;
}

export default function ContentHero({ content }: ContentHeroProps) {
  const router = useRouter();
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = isMuted;
    }
  }, [isMuted]);

  return (
    <div data-testid="content-hero" className="relative h-[45vh] w-full bg-black md:h-[60vh]">
      {/* Background media */}
      {content.trailerUrl ? (
        <video
          ref={videoRef}
          src={`${SERVER_BASE}${content.trailerUrl}`}
          autoPlay
          muted
          playsInline
          loop
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : content.bannerUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={`${SERVER_BASE}${content.bannerUrl}`}
          alt={content.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <span className="text-4xl font-bold text-white">{content.title}</span>
        </div>
      )}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-900/80 via-transparent to-transparent" />

      {/* Content info at bottom-left */}
      <div className="absolute bottom-4 left-4 right-4 z-10 max-w-xl md:bottom-8 md:left-12">
        <h1 className="mb-2 text-2xl font-bold text-white md:mb-3 md:text-5xl">{content.title}</h1>

        <div className="mb-2 md:mb-4">
          <ContentMeta content={content} variant="full" />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            data-testid="hero-play-button"
            onClick={() => router.push(`/watch/${content.id}`)}
            className="flex items-center gap-1.5 rounded bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/80 md:gap-2 md:px-6 md:py-2.5 md:text-base"
          >
            <Play size={18} fill="currentColor" className="md:h-5 md:w-5" />
            Play
          </button>
          <button
            data-testid="hero-add-to-list"
            className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-neutral-400 text-white transition-colors hover:border-white md:h-11 md:w-11"
          >
            <Plus size={18} className="md:h-5 md:w-5" />
          </button>
          {content.trailerUrl && (
            <button
              data-testid="hero-mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border-2 border-neutral-400 text-white transition-colors hover:border-white md:h-11 md:w-11"
            >
              {isMuted ? <VolumeX size={18} className="md:h-5 md:w-5" /> : <Volume2 size={18} className="md:h-5 md:w-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
