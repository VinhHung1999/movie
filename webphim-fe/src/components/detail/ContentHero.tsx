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
    <div data-testid="content-hero" className="relative h-[60vh] w-full bg-black">
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
      <div className="absolute bottom-8 left-4 right-4 z-10 max-w-xl md:left-12">
        <h1 className="mb-3 text-4xl font-bold text-white md:text-5xl">{content.title}</h1>

        <div className="mb-4">
          <ContentMeta content={content} variant="full" />
        </div>

        <div className="flex items-center gap-3">
          <button
            data-testid="hero-play-button"
            onClick={() => router.push(`/watch/${content.id}`)}
            className="flex items-center gap-2 rounded bg-white px-6 py-2.5 font-semibold text-black transition-colors hover:bg-white/80"
          >
            <Play size={20} fill="currentColor" />
            Play
          </button>
          <button
            data-testid="hero-add-to-list"
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-neutral-400 text-white transition-colors hover:border-white"
          >
            <Plus size={20} />
          </button>
          {content.trailerUrl && (
            <button
              data-testid="hero-mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border-2 border-neutral-400 text-white transition-colors hover:border-white"
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
