'use client';

import useSWR from 'swr';
import { Loader2 } from 'lucide-react';
import type { SearchSuggestion } from '@/types';

const SERVER_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api').replace(/\/api$/, '');

interface SearchSuggestionsProps {
  query: string;
  isVisible: boolean;
  onSelect: (id: string) => void;
  onViewAll: () => void;
  selectedIndex: number;
}

export default function SearchSuggestions({
  query,
  isVisible,
  onSelect,
  onViewAll,
  selectedIndex,
}: SearchSuggestionsProps) {
  const { data, isLoading } = useSWR<{ success: true; data: SearchSuggestion[] }>(
    isVisible && query.length >= 1 ? `/search/suggestions?q=${encodeURIComponent(query)}` : null,
  );

  const suggestions = data?.data ?? [];
  const viewAllIndex = suggestions.length;

  if (!isVisible) return null;

  return (
    <div
      id="search-suggestions"
      role="listbox"
      aria-label="Search suggestions"
      className="absolute top-full left-0 right-0 mt-1 overflow-hidden rounded-b bg-netflix-black/95 shadow-lg border border-netflix-border"
    >
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-netflix-mid-gray" data-testid="suggestions-loading" />
        </div>
      )}

      {!isLoading && suggestions.length === 0 && query.length >= 1 && (
        <div className="px-4 py-3 text-sm text-netflix-mid-gray" data-testid="no-suggestions">
          No suggestions
        </div>
      )}

      {!isLoading &&
        suggestions.map((item, index) => (
          <button
            key={item.id}
            id={`suggestion-${index}`}
            role="option"
            aria-selected={selectedIndex === index}
            className={`flex w-full items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-netflix-gray ${
              selectedIndex === index ? 'bg-netflix-gray' : ''
            }`}
            onClick={() => onSelect(item.id)}
            data-testid={`suggestion-item-${index}`}
          >
            {item.thumbnailUrl ? (
              <img
                src={`${SERVER_BASE}${item.thumbnailUrl}`}
                alt=""
                className="h-[45px] w-[30px] rounded object-cover"
              />
            ) : (
              <div className="h-[45px] w-[30px] rounded bg-netflix-gray" />
            )}
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm text-white">
                <HighlightMatch text={item.title} query={query} />
              </p>
              <div className="flex items-center gap-2 text-xs text-netflix-mid-gray">
                <span className="rounded bg-netflix-gray px-1.5 py-0.5 text-[10px] uppercase">
                  {item.type}
                </span>
                <span>{item.releaseYear}</span>
              </div>
            </div>
          </button>
        ))}

      {!isLoading && suggestions.length > 0 && (
        <button
          id={`suggestion-${viewAllIndex}`}
          role="option"
          aria-selected={selectedIndex === viewAllIndex}
          className={`w-full border-t border-netflix-border px-4 py-3 text-left text-sm text-netflix-white transition-colors hover:bg-netflix-gray ${
            selectedIndex === viewAllIndex ? 'bg-netflix-gray' : ''
          }`}
          onClick={onViewAll}
          data-testid="view-all-results"
        >
          View all results for &apos;{query}&apos;
        </button>
      )}
    </div>
  );
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;

  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const idx = lowerText.indexOf(lowerQuery);

  if (idx === -1) return <>{text}</>;

  return (
    <>
      {text.slice(0, idx)}
      <span className="font-bold text-white">{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}
