'use client';

import { use } from 'react';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import { Loader2 } from 'lucide-react';
import { ContentSummary, GenreWithCount, ContentListResponse, GenreListResponse } from '@/types';
import ContentGrid from '@/components/browse/ContentGrid';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import ContentRowSkeleton from '@/components/skeleton/ContentRowSkeleton';

const CONTENT_TYPE_SLUGS = ['movies', 'series'];
const PAGE_LIMIT = 20;

function getPageTitle(slug: string, genres: GenreWithCount[] | undefined): string {
  if (slug === 'movies') return 'Movies';
  if (slug === 'series') return 'TV Series';
  const genre = genres?.find((g) => g.slug === slug);
  return genre?.name ?? slug.charAt(0).toUpperCase() + slug.slice(1);
}

function buildApiUrl(slug: string, page: number): string {
  const isContentType = CONTENT_TYPE_SLUGS.includes(slug);
  if (isContentType) {
    const type = slug === 'movies' ? 'MOVIE' : 'SERIES';
    return `/content?type=${type}&page=${page}&limit=${PAGE_LIMIT}`;
  }
  return `/content?genre=${slug}&page=${page}&limit=${PAGE_LIMIT}`;
}

export default function GenreBrowsePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre: slug } = use(params);

  const { data: genresData } = useSWR<GenreListResponse>('/genres');

  const getKey = (pageIndex: number, previousPageData: ContentListResponse | null) => {
    if (previousPageData && previousPageData.data.length === 0) return null;
    return buildApiUrl(slug, pageIndex + 1);
  };

  const { data, size, setSize, isLoading, isValidating } =
    useSWRInfinite<ContentListResponse>(getKey);

  const allItems: ContentSummary[] = data ? data.flatMap((page) => page.data) : [];
  const isReachingEnd = data ? data[data.length - 1]?.data.length < PAGE_LIMIT : false;
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === 'undefined');

  const sentinelRef = useIntersectionObserver(() => {
    if (!isReachingEnd && !isLoadingMore && !isValidating) {
      setSize(size + 1);
    }
  });

  const pageTitle = getPageTitle(slug, genresData?.data);

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
      <h1 className="mb-8 text-3xl font-bold text-white md:text-4xl">{pageTitle}</h1>

      {allItems.length === 0 ? (
        <p className="text-netflix-mid-gray">No content found for this category.</p>
      ) : (
        <>
          <ContentGrid items={allItems} />

          {/* Infinite scroll sentinel */}
          {!isReachingEnd && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {isLoadingMore && <Loader2 size={32} className="animate-spin text-netflix-red" />}
            </div>
          )}
        </>
      )}
    </div>
  );
}
