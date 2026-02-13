'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-netflix-black px-4 text-center">
      <h1 className="text-[120px] font-black leading-none text-netflix-red md:text-[180px]">500</h1>
      <h2 className="mt-4 text-2xl font-bold text-white md:text-3xl">Something went wrong</h2>
      <p className="mt-3 max-w-md text-netflix-light-gray">
        We&apos;re having trouble loading this page. Please try again.
      </p>
      <div className="mt-8 flex gap-4">
        <button
          onClick={reset}
          data-testid="error-retry-button"
          className="rounded bg-netflix-red px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-netflix-red-hover"
        >
          Try Again
        </button>
        <a
          href="/home"
          data-testid="error-home-link"
          className="rounded border border-netflix-mid-gray px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-netflix-gray"
        >
          Go Home
        </a>
      </div>
    </div>
  );
}
