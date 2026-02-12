'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { FeaturedContent } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

interface HeroBannerProps {
  featured: FeaturedContent | null;
}

export default function HeroBanner({ featured }: HeroBannerProps) {
  const router = useRouter();

  if (!featured) {
    return (
      <div className="relative flex h-[85vh] items-center justify-center bg-netflix-black">
        <p className="text-netflix-mid-gray">No featured content available</p>
      </div>
    );
  }

  return (
    <motion.div
      className="relative h-[85vh] w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        {featured.bannerUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={`${SERVER_BASE}${featured.bannerUrl}`}
            alt={featured.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-netflix-dark via-netflix-black to-netflix-dark" />
        )}
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-netflix-black" />
      <div className="absolute inset-0 bg-gradient-to-t from-netflix-black via-transparent to-black/30" />

      {/* Content info */}
      <div className="absolute bottom-[15%] left-0 z-10 max-w-xl px-4 md:bottom-[20%] md:px-12">
        {/* Maturity badge */}
        <span className="mb-3 inline-block rounded border border-netflix-mid-gray px-2 py-0.5 text-xs text-netflix-light-gray">
          {featured.maturityRating}
        </span>

        {/* Title */}
        <h1 className="mb-3 text-3xl font-bold text-white drop-shadow-lg md:text-5xl lg:text-6xl">
          {featured.title}
        </h1>

        {/* Description */}
        <p className="mb-5 line-clamp-3 text-sm text-netflix-white/90 drop-shadow-md md:text-base">
          {featured.description}
        </p>

        {/* Genre tags */}
        {featured.genres.length > 0 && (
          <p className="mb-5 text-sm text-netflix-light-gray">
            {featured.genres.map((g) => g.name).join(' \u2022 ')}
          </p>
        )}

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/watch/${featured.id}`)}
            className="flex cursor-pointer items-center gap-2 rounded bg-white px-6 py-2 font-bold text-black transition-colors hover:bg-white/80 md:px-8"
          >
            <Play size={20} fill="currentColor" />
            Play
          </button>
          <button
            onClick={() => router.push(`/title/${featured.id}`)}
            className="flex cursor-pointer items-center gap-2 rounded bg-netflix-gray/60 px-6 py-2 font-semibold text-white transition-colors hover:bg-netflix-gray/40 md:px-8"
          >
            <Info size={20} />
            More Info
          </button>
        </div>
      </div>
    </motion.div>
  );
}
