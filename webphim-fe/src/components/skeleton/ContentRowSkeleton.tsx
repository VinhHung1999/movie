import MovieCardSkeleton from './MovieCardSkeleton';

export default function ContentRowSkeleton() {
  return (
    <div className="py-4">
      <div className="mb-2 px-4 md:px-12">
        <div className="h-6 w-40 animate-pulse rounded bg-netflix-gray" />
      </div>
      <div className="flex gap-1 px-4 md:px-12">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="w-[calc((100vw-2rem)/2.5)] flex-shrink-0 sm:w-[calc((100vw-2rem)/3.5)] md:w-[calc((100vw-6rem)/4.5)] lg:w-[calc((100vw-6rem)/5.5)] xl:w-[calc((100vw-6rem)/6.5)]"
          >
            <MovieCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
