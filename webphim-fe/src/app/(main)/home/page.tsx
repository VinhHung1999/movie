import { Suspense } from 'react';
import { fetchFromAPI } from '@/lib/fetchers';
import { ContentSummary, FeaturedContent } from '@/types';
import HeroBanner from '@/components/home/HeroBanner';
import ContentRow from '@/components/home/ContentRow';
import ContinueWatchingRow from '@/components/home/ContinueWatchingRow';
import HeroBannerSkeleton from '@/components/skeleton/HeroBannerSkeleton';
import ContentRowSkeleton from '@/components/skeleton/ContentRowSkeleton';

async function fetchContent(params: string): Promise<ContentSummary[]> {
  const result = await fetchFromAPI<ContentSummary[]>(`/content?${params}`, { cache: 'no-store' });
  return result ?? [];
}

async function fetchFeatured(): Promise<FeaturedContent | null> {
  return fetchFromAPI<FeaturedContent>('/content/featured', { cache: 'no-store' });
}

export default async function HomePage() {
  const [featured, trending, newReleases, actionMovies, comedyMovies, dramaMovies, topRated] =
    await Promise.all([
      fetchFeatured(),
      fetchContent('sort=views&limit=20'),
      fetchContent('sort=newest&limit=20'),
      fetchContent('genre=action&limit=20'),
      fetchContent('genre=comedy&limit=20'),
      fetchContent('genre=drama&limit=20'),
      fetchContent('sort=views&limit=20'),
    ]);

  const rows = [
    { title: 'Trending Now', items: trending, ranked: true },
    { title: 'New Releases', items: newReleases },
    { title: 'Action', items: actionMovies },
    { title: 'Comedy', items: comedyMovies },
    { title: 'Drama', items: dramaMovies },
    { title: 'Top Rated', items: topRated },
  ];

  return (
    <>
      <Suspense fallback={<HeroBannerSkeleton />}>
        <HeroBanner featured={featured} />
      </Suspense>

      <div className="relative z-10 -mt-24">
        <ContinueWatchingRow />
        {rows.map((row) =>
          row.items.length > 0 ? (
            <Suspense key={row.title} fallback={<ContentRowSkeleton />}>
              <ContentRow title={row.title} items={row.items} ranked={row.ranked} />
            </Suspense>
          ) : null
        )}
      </div>
    </>
  );
}
