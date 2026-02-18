'use client';

import { use } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GenreWithCount, ContentListResponse, GenreListResponse } from '@/types';
import ContentGrid from '@/components/browse/ContentGrid';
import FilterBar from '@/components/browse/FilterBar';
import ContentRowSkeleton from '@/components/skeleton/ContentRowSkeleton';

const CONTENT_TYPE_SLUGS = ['movies', 'series'];
const PAGE_LIMIT = 24;

function getPageTitle(slug: string, genres: GenreWithCount[] | undefined): string {
  if (slug === 'movies') return 'Movies';
  if (slug === 'series') return 'TV Series';
  const genre = genres?.find((g) => g.slug === slug);
  return genre?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function isGenreSlug(slug: string): boolean {
  return !CONTENT_TYPE_SLUGS.includes(slug);
}

function buildApiUrl(slug: string, page: number, type?: string, sort?: string, maturityRating?: string): string {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(PAGE_LIMIT));

  if (CONTENT_TYPE_SLUGS.includes(slug)) {
    params.set('type', slug === 'movies' ? 'MOVIE' : 'SERIES');
  } else {
    params.set('genre', slug);
  }

  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  if (maturityRating) params.set('maturityRating', maturityRating);

  return `/content?${params.toString()}`;
}

export default function GenreBrowsePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre: slug } = use(params);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filters from URL
  const type = (searchParams.get('type') as 'MOVIE' | 'SERIES') || undefined;
  const sort = searchParams.get('sort') || 'newest';
  const maturityRating = searchParams.get('rating') || undefined;

  const { data: genresData } = useSWR<GenreListResponse>('/genres');
  const currentGenre = genresData?.data?.find((g) => g.slug === slug);
  const showFilters = isGenreSlug(slug);

  const { data, isLoading } = useSWR<ContentListResponse>(
    buildApiUrl(slug, 1, showFilters ? type : undefined, sort, showFilters ? maturityRating : undefined),
  );

  const updateFilters = (update: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(update).forEach(([key, value]) => {
      if (value === undefined || value === '') params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    router.replace(`/browse/${slug}${qs ? `?${qs}` : ''}`);
  };

  const pageTitle = getPageTitle(slug, genresData?.data);
  const items = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const page = Number(searchParams.get('page')) || 1;

  if (isLoading) {
    return (
      <div className="px-4 pt-24 md:px-12">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-netflix-gray" />
        <ContentRowSkeleton />
        <ContentRowSkeleton />
      </div>
    );
  }

  return (
    <div className="px-4 pt-24 pb-12 md:px-12">
      {/* Header */}
      <div className="mb-6">
        {showFilters && (
          <Link
            href="/browse"
            className="mb-3 inline-flex items-center gap-1 text-sm text-netflix-mid-gray transition-colors hover:text-white"
            data-testid="back-to-browse"
          >
            <ArrowLeft className="h-4 w-4" />
            All Categories
          </Link>
        )}
        <h1 className="text-3xl font-bold text-white md:text-4xl" data-testid="genre-title">{pageTitle}</h1>
        {currentGenre && (
          <p className="mt-1 text-sm text-netflix-mid-gray" data-testid="genre-count">
            {currentGenre.contentCount} {currentGenre.contentCount === 1 ? 'title' : 'titles'}
          </p>
        )}
      </div>

      {/* Filter Bar (only for genre pages, not movies/series) */}
      {showFilters && (
        <FilterBar
          type={type}
          sort={sort}
          maturityRating={maturityRating}
          onTypeChange={(t) => updateFilters({ type: t })}
          onSortChange={(s) => updateFilters({ sort: s })}
          onRatingChange={(r) => updateFilters({ rating: r })}
        />
      )}

      {items.length === 0 ? (
        <p className="py-16 text-center text-netflix-mid-gray" data-testid="genre-empty">
          No content found for this category.
        </p>
      ) : (
        <>
          <ContentGrid items={items} />

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Genre results pagination" data-testid="pagination">
              <button
                onClick={() => updateFilters({ page: String(page - 1) })}
                disabled={page <= 1}
                className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-netflix-mid-gray">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => updateFilters({ page: String(page + 1) })}
                disabled={page >= totalPages}
                className="rounded border border-netflix-border px-3 py-1.5 text-sm text-netflix-white transition-colors hover:bg-netflix-gray disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
