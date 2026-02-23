'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Search, X, Loader2 } from 'lucide-react';
import ContentGrid from '@/components/browse/ContentGrid';
import SearchFilters from '@/components/search/SearchFilters';
import SearchEmptyState from '@/components/search/SearchEmptyState';
import type { SearchResultsResponse, SearchFilterState, Genre, ContentListResponse } from '@/types';

const RATING_LABELS: Record<string, string> = {
  G: 'G',
  PG: 'PG',
  PG13: 'PG-13',
  R: 'R',
  NC17: 'NC-17',
};

const SORT_LABELS: Record<string, string> = {
  relevance: 'Most Relevant',
  newest: 'Newest',
  oldest: 'Oldest',
  views: 'Most Popular',
  title: 'Title A-Z',
};

function buildSwrKey(
  query: string,
  filters: SearchFilterState,
  page: number,
): string | null {
  if (!query) return null;
  const params = new URLSearchParams();
  params.set('q', query);
  if (filters.type) params.set('type', filters.type);
  if (filters.genre) params.set('genre', filters.genre);
  if (filters.yearFrom) params.set('yearFrom', String(filters.yearFrom));
  if (filters.yearTo) params.set('yearTo', String(filters.yearTo));
  if (filters.maturityRating) params.set('maturityRating', filters.maturityRating);
  params.set('sort', filters.sort);
  params.set('page', String(page));
  params.set('limit', '20');
  return `/search?${params.toString()}`;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') as 'MOVIE' | 'SERIES') || undefined;
  const genre = searchParams.get('genre') || undefined;
  const yearFrom = searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined;
  const yearTo = searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined;
  const maturityRating = (searchParams.get('maturityRating') as SearchFilterState['maturityRating']) || undefined;
  const sort = (searchParams.get('sort') as SearchFilterState['sort']) || 'relevance';
  const page = Number(searchParams.get('page')) || 1;

  // localQuery = what the input shows; searchQuery = what SWR fetches
  const [localQuery, setLocalQuery] = useState(q);
  const [searchQuery, setSearchQuery] = useState(q);

  // Debounce: user typing → update searchQuery after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localQuery.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [localQuery]);

  // URL sync: when URL q changes (navbar navigation), update both immediately
  useEffect(() => {
    setLocalQuery(q);
    setSearchQuery(q);
  }, [q]);

  const filters: SearchFilterState = { type, genre, yearFrom, yearTo, maturityRating, sort };

  // SWR key from searchQuery — single source of truth
  const swrKey = buildSwrKey(searchQuery, filters, page);
  const { data, isLoading } = useSWR<SearchResultsResponse>(swrKey);

  // Fetch genres for filter sidebar
  const { data: genresData } = useSWR<{ success: true; data: Genre[] }>('/genres');
  const genres = genresData?.data ?? [];

  // Fetch trending/popular content when no query at all
  const { data: trendingData } = useSWR<ContentListResponse>(
    !searchQuery ? '/content?sort=views&limit=12' : null,
  );

  // Sync searchQuery to URL for shareable links
  useEffect(() => {
    if (searchQuery && searchQuery !== q) {
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      if (type) params.set('type', type);
      if (genre) params.set('genre', genre);
      if (yearFrom) params.set('yearFrom', String(yearFrom));
      if (yearTo) params.set('yearTo', String(yearTo));
      if (maturityRating) params.set('maturityRating', maturityRating);
      if (sort && sort !== 'relevance') params.set('sort', sort);
      router.replace(`/search?${params.toString()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // URL builder for filter/page changes
  const buildUrl = useCallback(
    (newFilters: SearchFilterState, newQ?: string, newPage?: number) => {
      const params = new URLSearchParams();
      const query = newQ !== undefined ? newQ : searchQuery;
      if (query) params.set('q', query);
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.genre) params.set('genre', newFilters.genre);
      if (newFilters.yearFrom) params.set('yearFrom', String(newFilters.yearFrom));
      if (newFilters.yearTo) params.set('yearTo', String(newFilters.yearTo));
      if (newFilters.maturityRating) params.set('maturityRating', newFilters.maturityRating);
      if (newFilters.sort && newFilters.sort !== 'relevance') params.set('sort', newFilters.sort);
      if (newPage && newPage > 1) params.set('page', String(newPage));
      return `/search?${params.toString()}`;
    },
    [searchQuery],
  );

  const handleFilterChange = useCallback(
    (newFilters: SearchFilterState) => {
      router.replace(buildUrl(newFilters, undefined, 1));
    },
    [buildUrl, router],
  );

  const handlePageChange = (newPage: number) => {
    router.replace(buildUrl(filters, undefined, newPage));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localQuery.trim()) {
      setSearchQuery(localQuery.trim());
      router.replace(buildUrl(filters, localQuery.trim(), 1));
    }
  };

  const handleInputChange = (value: string) => {
    setLocalQuery(value);
    if (!value.trim()) {
      setSearchQuery('');
      router.replace(buildUrl(filters, '', 1));
    }
  };

  const results = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const trendingItems = trendingData?.data ?? [];

  // Compute active filter chips
  const activeFilterChips: Array<{ key: keyof SearchFilterState; label: string }> = [];
  if (type) activeFilterChips.push({ key: 'type', label: type === 'MOVIE' ? 'Movies' : 'Series' });
  if (genre) {
    const genreName = genres.find((g) => g.slug === genre)?.name ?? genre;
    activeFilterChips.push({ key: 'genre', label: genreName });
  }
  if (yearFrom || yearTo) {
    const yearLabel = yearFrom && yearTo ? `${yearFrom}-${yearTo}` : yearFrom ? `From ${yearFrom}` : `To ${yearTo}`;
    activeFilterChips.push({ key: 'yearFrom', label: yearLabel });
  }
  if (maturityRating) activeFilterChips.push({ key: 'maturityRating', label: RATING_LABELS[maturityRating] ?? maturityRating });
  if (sort !== 'relevance') activeFilterChips.push({ key: 'sort', label: SORT_LABELS[sort] ?? sort });

  return (
    <div className="min-h-screen bg-netflix-black">
      {/* Search Hero */}
      <div className="bg-gradient-to-b from-netflix-dark to-transparent px-4 pb-8 pt-24 md:px-12" data-testid="search-hero">
        <div className="mx-auto max-w-2xl">
          <form onSubmit={handleSearchSubmit} role="search">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-netflix-mid-gray" />
              <input
                type="text"
                value={localQuery}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search titles, people, genres..."
                className="w-full rounded-lg border border-netflix-border bg-netflix-black/80 py-4 pl-14 pr-12 text-lg text-white placeholder-netflix-mid-gray outline-none transition-colors focus:border-netflix-white/50"
                autoFocus
                aria-label="Search titles, people, genres"
                data-testid="search-hero-input"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => handleInputChange('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-netflix-mid-gray hover:text-white"
                  aria-label="Clear search"
                  data-testid="search-hero-clear"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="px-4 md:px-12">
        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2" data-testid="active-filters">
            {activeFilterChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => {
                  if (chip.key === 'yearFrom') {
                    handleFilterChange({ ...filters, yearFrom: undefined, yearTo: undefined });
                  } else {
                    handleFilterChange({ ...filters, [chip.key]: undefined });
                  }
                }}
                className="flex items-center gap-1 rounded-full bg-netflix-gray px-3 py-1 text-sm text-white transition-colors hover:bg-netflix-red"
                data-testid={`filter-chip-${chip.key}`}
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        {/* Result count */}
        {searchQuery && meta && (
          <div className="mb-4">
            <p
              className="text-sm text-netflix-mid-gray"
              aria-live="polite"
              data-testid="result-count"
            >
              {meta.total} {meta.total === 1 ? 'result' : 'results'} for &lsquo;{searchQuery}&rsquo;
            </p>
          </div>
        )}

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <SearchFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            genres={genres}
          />

          {/* Results */}
          <div className="flex-1">
            {isLoading && (
              <div className="flex justify-center py-16" data-testid="search-loading">
                <Loader2 className="h-8 w-8 animate-spin text-netflix-red" />
              </div>
            )}

            {!isLoading && searchQuery && results.length === 0 && <SearchEmptyState query={searchQuery} />}

            {!isLoading && results.length > 0 && (
              <>
                <ContentGrid items={results} />

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Search results pagination" data-testid="pagination">
                    <button
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                      className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-netflix-mid-gray">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= totalPages}
                      className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </nav>
                )}
              </>
            )}

            {/* No query: show trending content */}
            {!isLoading && !searchQuery && (
              <div data-testid="trending-section">
                <h2 className="mb-4 text-xl font-semibold text-white">Popular on WebPhim</h2>
                {trendingItems.length > 0 ? (
                  <ContentGrid items={trendingItems} />
                ) : (
                  <p className="py-16 text-center text-netflix-mid-gray">
                    Enter a search term to find movies and series.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
