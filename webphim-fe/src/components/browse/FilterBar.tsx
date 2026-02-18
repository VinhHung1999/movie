'use client';

interface FilterBarProps {
  type?: 'MOVIE' | 'SERIES';
  sort: string;
  maturityRating?: string;
  onTypeChange: (type?: string) => void;
  onSortChange: (sort: string) => void;
  onRatingChange: (rating?: string) => void;
}

const typeOptions = [
  { value: undefined, label: 'All' },
  { value: 'MOVIE', label: 'Movies' },
  { value: 'SERIES', label: 'Series' },
] as const;

const sortOptions = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'views', label: 'Popular' },
  { value: 'title', label: 'Title A-Z' },
] as const;

const ratingOptions = [
  { value: undefined, label: 'All Ratings' },
  { value: 'G', label: 'G' },
  { value: 'PG', label: 'PG' },
  { value: 'PG13', label: 'PG-13' },
  { value: 'R', label: 'R' },
  { value: 'NC17', label: 'NC-17' },
] as const;

export default function FilterBar({
  type,
  sort,
  maturityRating,
  onTypeChange,
  onSortChange,
  onRatingChange,
}: FilterBarProps) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3" data-testid="filter-bar">
      {/* Type chips */}
      <div className="flex gap-1" role="group" aria-label="Content type filter">
        {typeOptions.map((option) => (
          <button
            key={option.label}
            onClick={() => onTypeChange(option.value)}
            aria-pressed={type === option.value}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              type === option.value
                ? 'bg-white text-black'
                : 'bg-netflix-gray text-netflix-white hover:bg-netflix-border'
            }`}
            data-testid={`type-chip-${option.label.toLowerCase()}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Sort dropdown */}
      <label className="sr-only" htmlFor="genre-sort">Sort by</label>
      <select
        id="genre-sort"
        value={sort}
        onChange={(e) => onSortChange(e.target.value)}
        className="rounded border border-netflix-border bg-netflix-black px-3 py-1.5 text-sm text-white"
        data-testid="sort-select"
      >
        {sortOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Rating dropdown */}
      <label className="sr-only" htmlFor="genre-rating">Rating</label>
      <select
        id="genre-rating"
        value={maturityRating ?? ''}
        onChange={(e) => onRatingChange(e.target.value || undefined)}
        className="rounded border border-netflix-border bg-netflix-black px-3 py-1.5 text-sm text-white"
        data-testid="rating-select"
      >
        {ratingOptions.map((opt) => (
          <option key={opt.label} value={opt.value ?? ''}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
