'use client';

import { useState } from 'react';
import { SeasonDetail } from '@/types';
import EpisodeCard from './EpisodeCard';

interface EpisodeListProps {
  seasons: SeasonDetail[];
  contentId: string;
}

export default function EpisodeList({ seasons, contentId }: EpisodeListProps) {
  const [selectedSeason, setSelectedSeason] = useState(0);

  if (!seasons || seasons.length === 0) return null;

  const currentSeason = seasons[selectedSeason];

  return (
    <div data-testid="episode-list">
      {/* Header with season selector */}
      <div className="flex items-center justify-between px-4 py-3">
        <h3 className="text-lg font-bold text-white">Episodes</h3>
        {seasons.length > 1 && (
          <select
            data-testid="season-selector"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="rounded border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white outline-none focus:border-white"
          >
            {seasons.map((season, idx) => (
              <option key={season.id} value={idx}>
                {season.title || `Season ${season.seasonNumber}`}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Episode cards */}
      <div>
        {currentSeason?.episodes.map((episode, idx) => (
          <EpisodeCard
            key={episode.id}
            episode={episode}
            episodeIndex={idx}
            contentId={contentId}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
