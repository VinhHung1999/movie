'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { SearchFilterState, Genre } from '@/types';

interface SearchFiltersProps {
  filters: SearchFilterState;
  onFilterChange: (filters: SearchFilterState) => void;
  genres: Genre[];
}

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Most Popular' },
  { value: 'title', label: 'Title A-Z' },
] as const;

export default function SearchFilters({ filters, onFilterChange, genres }: SearchFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const updateFilter = (update: Partial<SearchFilterState>) => {
    onFilterChange({ ...filters, ...update });
  };

  const filtersContent = (
    <div className="space-y-6">
      {/* Type filter */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-white">Type</legend>
        <div role="radiogroup" aria-label="Content type filter" className="space-y-1">
          {[
            { value: undefined, label: 'All' },
            { value: 'MOVIE' as const, label: 'Movies' },
            { value: 'SERIES' as const, label: 'Series' },
          ].map((option) => (
            <label
              key={option.label}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white"
            >
              <input
                type="radio"
                name="content-type"
                role="radio"
                checked={filters.type === option.value}
                onChange={() => updateFilter({ type: option.value })}
                className="accent-netflix-red"
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Genre filter */}
      {genres.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-white">Genre</legend>
          <div role="radiogroup" aria-label="Genre filter" className="max-h-48 space-y-1 overflow-y-auto">
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white">
              <input
                type="radio"
                name="genre-filter"
                role="radio"
                checked={!filters.genre}
                onChange={() => updateFilter({ genre: undefined })}
                className="accent-netflix-red"
              />
              All Genres
            </label>
            {genres.map((genre) => (
              <label
                key={genre.id}
                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray hover:text-white"
              >
                <input
                  type="radio"
                  name="genre-filter"
                  role="radio"
                  checked={filters.genre === genre.slug}
                  onChange={() => updateFilter({ genre: genre.slug })}
                  className="accent-netflix-red"
                />
                {genre.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {/* Year range */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-white">Year Range</legend>
        <div className="flex items-center gap-2">
          <label className="sr-only" htmlFor="year-from">
            From year
          </label>
          <input
            id="year-from"
            type="number"
            min={1900}
            max={2100}
            placeholder="From"
            value={filters.yearFrom ?? ''}
            onChange={(e) =>
              updateFilter({ yearFrom: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-20 rounded border border-netflix-border bg-netflix-black px-2 py-1 text-sm text-white"
          />
          <span className="text-netflix-mid-gray">—</span>
          <label className="sr-only" htmlFor="year-to">
            To year
          </label>
          <input
            id="year-to"
            type="number"
            min={1900}
            max={2100}
            placeholder="To"
            value={filters.yearTo ?? ''}
            onChange={(e) =>
              updateFilter({ yearTo: e.target.value ? Number(e.target.value) : undefined })
            }
            className="w-20 rounded border border-netflix-border bg-netflix-black px-2 py-1 text-sm text-white"
          />
        </div>
      </fieldset>

      {/* Sort */}
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-white">Sort By</legend>
        <label className="sr-only" htmlFor="sort-select">
          Sort order
        </label>
        <select
          id="sort-select"
          value={filters.sort}
          onChange={(e) => updateFilter({ sort: e.target.value as SearchFilterState['sort'] })}
          className="w-full rounded border border-netflix-border bg-netflix-black px-2 py-1.5 text-sm text-white"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </fieldset>
    </div>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="mb-4 flex items-center gap-2 rounded border border-netflix-border px-4 py-2 text-sm text-netflix-white transition-colors hover:bg-netflix-gray"
          data-testid="mobile-filter-toggle"
        >
          Filters
          <ChevronDown
            size={16}
            className={`transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {mobileOpen && (
          <div className="mb-6 rounded border border-netflix-border bg-netflix-black/80 p-4" data-testid="mobile-filters">
            {filtersContent}
          </div>
        )}
      </div>

      {/* Desktop sidebar */}
      <aside
        className="sticky top-20 hidden w-64 shrink-0 md:block"
        data-testid="desktop-filters"
      >
        {filtersContent}
      </aside>
    </>
  );
}
