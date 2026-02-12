'use client';

import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { ContentDetail } from '@/types';
import ContentHero from '@/components/detail/ContentHero';
import CastList from '@/components/detail/CastList';
import EpisodeList from '@/components/detail/EpisodeList';
import SimilarTitles from '@/components/detail/SimilarTitles';

function DetailSkeleton() {
  return (
    <div data-testid="detail-skeleton">
      <div className="h-[45vh] w-full animate-pulse bg-neutral-800 md:h-[60vh]" />
      <div className="space-y-4 p-4 md:p-12">
        <div className="h-8 w-2/3 animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-800" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-800" />
      </div>
    </div>
  );
}

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.id as string;

  const { data, error } = useSWR<{ success: true; data: ContentDetail }>(
    contentId ? `/content/${contentId}` : null
  );

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold text-white">Content Not Found</h2>
          <p className="text-neutral-400">The content you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  const content = data?.data;

  if (!content) {
    return <DetailSkeleton />;
  }

  return (
    <div data-testid="content-detail-page" className="-mt-16">
      {/* Hero section */}
      <ContentHero content={content} />

      {/* Content info */}
      <div className="space-y-4 px-4 py-3 md:space-y-6 md:px-12 md:py-6">
        {/* Synopsis */}
        <p className="max-w-3xl text-sm text-neutral-300 md:text-base">{content.description}</p>

        {/* Cast & crew */}
        <CastList cast={content.cast} variant="full" />

        {/* Episodes (series only) */}
        {content.type === 'SERIES' && content.seasons && content.seasons.length > 0 && (
          <EpisodeList seasons={content.seasons} contentId={content.id} />
        )}

        {/* Similar titles */}
        <SimilarTitles contentId={content.id} />
      </div>
    </div>
  );
}
