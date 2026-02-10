'use client';

import { useRouter } from 'next/navigation';
import { Play, Volume2, VolumeX, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { ContentDetail } from '@/types';
import ContentMeta from './ContentMeta';
import CastList from './CastList';
import EpisodeList from './EpisodeList';
import SimilarTitles from './SimilarTitles';
import WatchlistButton from '@/components/watchlist/WatchlistButton';
import RatingButtons from '@/components/ratings/RatingButtons';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

interface ModalContentProps {
  content: ContentDetail;
  onClose?: () => void;
  onPlay: () => void;
}

export default function ModalContent({ content, onClose, onPlay }: ModalContentProps) {
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
    <div
      data-testid="modal-content"
      className="relative overflow-hidden rounded-lg bg-neutral-900 shadow-2xl"
    >
      {/* Close button */}
      {onClose && (
        <button
          data-testid="modal-close"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/80 text-white transition-colors hover:bg-neutral-800"
        >
          <X size={20} />
        </button>
      )}

      {/* Trailer / Banner */}
      <div className="relative aspect-video w-full bg-black">
        {content.trailerUrl ? (
          <video
            ref={videoRef}
            src={`${SERVER_BASE}${content.trailerUrl}`}
            autoPlay
            muted
            playsInline
            loop
            className="h-full w-full object-cover"
          />
        ) : content.bannerUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${SERVER_BASE}${content.bannerUrl}`}
            alt={content.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl font-bold text-white">{content.title}</span>
          </div>
        )}

        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-900 to-transparent" />

        {/* Title + action buttons over gradient */}
        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
          <div className="flex-1">
            <h2 className="mb-3 text-2xl font-bold text-white md:text-3xl">{content.title}</h2>
            <div className="flex items-center gap-2">
              <button
                data-testid="play-button"
                onClick={() => {
                  router.push(`/watch/${content.id}`);
                  onPlay();
                }}
                className="flex items-center gap-2 rounded bg-white px-5 py-2 font-semibold text-black transition-colors hover:bg-white/80"
              >
                <Play size={18} fill="currentColor" />
                Play
              </button>
              <WatchlistButton
                contentId={content.id}
                size={18}
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neutral-500 text-white transition-colors hover:border-white"
              />
              <RatingButtons contentId={content.id} />
            </div>
          </div>

          {/* Mute toggle for trailer */}
          {content.trailerUrl && (
            <button
              data-testid="mute-toggle"
              onClick={() => setIsMuted(!isMuted)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-neutral-500 text-white transition-colors hover:border-white"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Content info */}
      <div className="space-y-4 p-4">
        {/* Meta */}
        <ContentMeta content={content} />

        {/* Synopsis */}
        <p className="text-sm text-neutral-300">{content.description}</p>

        {/* Cast */}
        <CastList cast={content.cast} />

        {/* Episodes (series only) */}
        {content.type === 'SERIES' && content.seasons && content.seasons.length > 0 && (
          <EpisodeList seasons={content.seasons} contentId={content.id} />
        )}

        {/* Similar titles */}
        <SimilarTitles contentId={content.id} />
      </div>
    </div>
  );
}
