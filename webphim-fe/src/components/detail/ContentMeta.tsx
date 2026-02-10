'use client';

import { ContentDetail, ContentSummary } from '@/types';

interface ContentMetaProps {
  content: ContentDetail | ContentSummary;
  variant?: 'compact' | 'full';
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function ContentMeta({ content, variant = 'compact' }: ContentMetaProps) {
  const maxGenres = variant === 'compact' ? 3 : content.genres.length;

  return (
    <div data-testid="content-meta" className="flex flex-wrap items-center gap-2 text-sm">
      {/* Maturity rating */}
      <span className="rounded border border-neutral-500 px-1.5 py-0.5 text-xs text-neutral-300">
        {content.maturityRating}
      </span>

      {/* Year */}
      <span className="text-neutral-300">{content.releaseYear}</span>

      {/* Duration */}
      {content.duration && (
        <span className="text-neutral-300">{formatDuration(content.duration)}</span>
      )}

      {/* HD badge */}
      <span className="rounded border border-neutral-500 px-1.5 py-0.5 text-xs font-medium text-neutral-300">
        HD
      </span>

      {/* Genre tags */}
      {content.genres.length > 0 && (
        <span className="text-neutral-400">
          {content.genres
            .slice(0, maxGenres)
            .map((g) => g.name)
            .join(' \u2022 ')}
        </span>
      )}
    </div>
  );
}
