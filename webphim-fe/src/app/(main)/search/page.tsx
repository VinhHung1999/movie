'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import ContentGrid from '@/components/browse/ContentGrid';
import SearchFilters from '@/components/search/SearchFilters';
import SearchEmptyState from '@/components/search/SearchEmptyState';
import type { SearchResultsResponse, SearchFilterState, Genre } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get('q') || '';
  const type = (searchParams.get('type') as 'MOVIE' | 'SERIES') || undefined;
  const genre = searchParams.get('genre') || undefined;
  const yearFrom = searchParams.get('yearFrom') ? Number(searchParams.get('yearFrom')) : undefined;
  const yearTo = searchParams.get('yearTo') ? Number(searchParams.get('yearTo')) : undefined;
  const sort = (searchParams.get('sort') as SearchFilterState['sort']) || 'relevance';
  const page = Number(searchParams.get('page')) || 1;

  // Build SWR key from URL params
  const swrKey = q
    ? `/search?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}${genre ? `&genre=${genre}` : ''}${yearFrom ? `&yearFrom=${yearFrom}` : ''}${yearTo ? `&yearTo=${yearTo}` : ''}&sort=${sort}&page=${page}&limit=20`
    : null;

  const { data, isLoading } = useSWR<SearchResultsResponse>(swrKey);

  // Fetch genres for filter sidebar
  const { data: genresData } = useSWR<{ success: true; data: Genre[] }>('/genres');
  const genres = genresData?.data ?? [];

  const filters = useMemo<SearchFilterState>(
    () => ({ type, genre, yearFrom, yearTo, sort }),
    [type, genre, yearFrom, yearTo, sort],
  );

  const updateURL = useCallback(
    (newFilters: SearchFilterState, newPage?: number) => {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (newFilters.type) params.set('type', newFilters.type);
      if (newFilters.genre) params.set('genre', newFilters.genre);
      if (newFilters.yearFrom) params.set('yearFrom', String(newFilters.yearFrom));
      if (newFilters.yearTo) params.set('yearTo', String(newFilters.yearTo));
      if (newFilters.sort && newFilters.sort !== 'relevance') params.set('sort', newFilters.sort);
      if (newPage && newPage > 1) params.set('page', String(newPage));
      router.push(`/search?${params.toString()}`);
    },
    [q, router],
  );

  const handleFilterChange = useCallback(
    (newFilters: SearchFilterState) => {
      updateURL(newFilters, 1); // Reset to page 1 on filter change
    },
    [updateURL],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      updateURL(filters, newPage);
    },
    [updateURL, filters],
  );

  const results = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-netflix-black pt-20 px-4 md:px-12">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          {q ? `Search Results for '${q}'` : 'Search'}
        </h1>
        {meta && (
          <p
            className="mt-1 text-sm text-netflix-mid-gray"
            aria-live="polite"
            data-testid="result-count"
          >
            {meta.total} {meta.total === 1 ? 'result' : 'results'} found
          </p>
        )}
      </div>

      <div className="flex gap-8">
        {/* Filters */}
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

          {!isLoading && q && results.length === 0 && <SearchEmptyState query={q} />}

          {!isLoading && results.length > 0 && (
            <>
              <ContentGrid items={results} />

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Search results pagination" data-testid="pagination">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-netflix-mid-gray">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}

          {!isLoading && !q && (
            <p className="py-16 text-center text-netflix-mid-gray">
              Enter a search term to find movies and series.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
