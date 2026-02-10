'use client';

import { CastMember } from '@/types';

interface CastListProps {
  cast: CastMember[];
  variant?: 'compact' | 'full';
}

export default function CastList({ cast, variant = 'compact' }: CastListProps) {
  if (!cast || cast.length === 0) return null;

  if (variant === 'compact') {
    const names = cast
      .filter((c) => c.role === 'ACTOR')
      .slice(0, 3)
      .map((c) => c.name);
    if (names.length === 0) return null;

    return (
      <p data-testid="cast-list" className="text-sm text-neutral-400">
        <span className="text-neutral-500">Cast: </span>
        <span className="text-white">{names.join(', ')}</span>
      </p>
    );
  }

  const actors = cast.filter((c) => c.role === 'ACTOR');
  const directors = cast.filter((c) => c.role === 'DIRECTOR');
  const writers = cast.filter((c) => c.role === 'WRITER');

  return (
    <div data-testid="cast-list" className="space-y-1 text-sm">
      {actors.length > 0 && (
        <p className="text-neutral-400">
          <span className="text-neutral-500">Starring: </span>
          <span className="text-white">{actors.map((a) => a.name).join(', ')}</span>
        </p>
      )}
      {directors.length > 0 && (
        <p className="text-neutral-400">
          <span className="text-neutral-500">Director: </span>
          <span className="text-white">{directors.map((d) => d.name).join(', ')}</span>
        </p>
      )}
      {writers.length > 0 && (
        <p className="text-neutral-400">
          <span className="text-neutral-500">Writer: </span>
          <span className="text-white">{writers.map((w) => w.name).join(', ')}</span>
        </p>
      )}
    </div>
  );
}
