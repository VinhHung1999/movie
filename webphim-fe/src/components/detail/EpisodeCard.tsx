'use client';

import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { EpisodeSummary } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface EpisodeCardProps {
  episode: EpisodeSummary;
  episodeIndex: number;
  contentId: string;
  onClick: () => void;
}

export default function EpisodeCard({ episode, episodeIndex, contentId, onClick }: EpisodeCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/watch/${contentId}?episode=${episode.id}`);
    onClick();
  };

  return (
    <button
      data-testid={`episode-card-${episode.id}`}
      onClick={handleClick}
      className="group/ep flex w-full items-start gap-4 border-b border-neutral-800 p-4 text-left transition-colors hover:bg-neutral-800/30"
    >
      {/* Episode number */}
      <span className="flex w-8 shrink-0 items-center justify-center text-2xl font-medium text-neutral-500">
        {episodeIndex + 1}
      </span>

      {/* Thumbnail */}
      <div className="relative h-[68px] w-[120px] shrink-0 overflow-hidden rounded bg-neutral-800">
        {episode.thumbnailUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${SERVER_BASE}${episode.thumbnailUrl}`}
            alt={episode.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Play size={24} className="text-neutral-500" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/ep:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-black/60">
            <Play size={16} className="text-white" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h4 className="truncate text-sm font-medium text-white">{episode.title}</h4>
          <span className="shrink-0 text-sm text-neutral-400">{formatDuration(episode.duration)}</span>
        </div>
        {episode.description && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-400">{episode.description}</p>
        )}
      </div>
    </button>
  );
}
