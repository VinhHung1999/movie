export default function HeroBannerSkeleton() {
  return (
    <div className="relative h-[85vh] w-full bg-netflix-dark">
      <div className="absolute bottom-[15%] left-0 px-4 md:bottom-[20%] md:px-12">
        <div className="mb-3 h-5 w-16 animate-pulse rounded bg-netflix-gray" />
        <div className="mb-3 h-10 w-80 animate-pulse rounded bg-netflix-gray md:h-14 md:w-96" />
        <div className="mb-2 h-4 w-96 animate-pulse rounded bg-netflix-gray" />
        <div className="mb-5 h-4 w-72 animate-pulse rounded bg-netflix-gray" />
        <div className="flex gap-3">
          <div className="h-10 w-32 animate-pulse rounded bg-netflix-gray" />
          <div className="h-10 w-36 animate-pulse rounded bg-netflix-gray" />
        </div>
      </div>
    </div>
  );
}
