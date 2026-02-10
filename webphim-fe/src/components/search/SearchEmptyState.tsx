'use client';

import { Search } from 'lucide-react';

interface SearchEmptyStateProps {
  query: string;
}

export default function SearchEmptyState({ query }: SearchEmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center"
      role="status"
      aria-live="polite"
      data-testid="search-empty-state"
    >
      <Search className="mb-4 h-16 w-16 text-netflix-mid-gray/50" />
      <h2 className="mb-2 text-xl font-semibold text-white">
        No results found for &apos;{query}&apos;
      </h2>
      <p className="mb-6 max-w-md text-sm text-netflix-mid-gray">
        We couldn&apos;t find anything matching your search. Try these suggestions:
      </p>
      <ul className="space-y-2 text-sm text-netflix-white" data-testid="suggestions-list">
        <li>Try different keywords</li>
        <li>Check your spelling</li>
        <li>Try more general terms</li>
      </ul>
    </div>
  );
}
