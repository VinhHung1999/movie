'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import SearchSuggestions from './SearchSuggestions';

interface SearchBarProps {
  className?: string;
}

export default function SearchBar({ className }: SearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [dismissedQuery, setDismissedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const debouncedQuery = useDebounce(query, 300);

  // Derive suggestions visibility from debounced query
  const suggestionsVisible = debouncedQuery.length >= 1 && dismissedQuery !== debouncedQuery;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (!query) {
          setIsExpanded(false);
        }
        setDismissedQuery(debouncedQuery);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [query, debouncedQuery]);

  // Auto-focus on expand
  useEffect(() => {
    if (isExpanded) {
      // Small delay to wait for animation
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      if (!query) {
        setIsExpanded(false);
        setDismissedQuery(debouncedQuery);
      }
    } else {
      setIsExpanded(true);
    }
  }, [isExpanded, query, debouncedQuery]);

  const handleClose = useCallback(() => {
    setQuery('');
    setIsExpanded(false);
    setDismissedQuery(debouncedQuery);
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  const handleSubmit = useCallback(() => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery('');
      setIsExpanded(false);
      setDismissedQuery(debouncedQuery);
      setSelectedIndex(-1);
    }
  }, [query, router, debouncedQuery]);

  const handleSelectSuggestion = useCallback(
    (id: string) => {
      router.push(`/title/${id}`);
      setQuery('');
      setIsExpanded(false);
      setDismissedQuery(debouncedQuery);
      setSelectedIndex(-1);
    },
    [router, debouncedQuery],
  );

  const handleViewAll = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
        return;
      }

      if (e.key === 'Enter') {
        if (selectedIndex >= 0) {
          // If a suggestion is highlighted, there's no direct way to get
          // the suggestion data here, so let the suggestion items handle it
          // via their own click. For "View all" at the end, submit.
          const el = document.getElementById(`suggestion-${selectedIndex}`);
          el?.click();
        } else {
          handleSubmit();
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev + 1;
          return document.getElementById(`suggestion-${next}`) ? next : prev;
        });
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(-1, prev - 1));
      }
    },
    [selectedIndex, handleClose, handleSubmit],
  );

  const activeSuggestionId = selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined;

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <search role="search" className="flex items-center">
        <button
          onClick={handleToggle}
          className="text-netflix-white transition-colors hover:text-white"
          aria-label="Search"
          aria-expanded={isExpanded}
          aria-controls="search-suggestions"
          data-testid="search-toggle"
        >
          <Search size={20} />
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
              data-testid="search-input-container"
            >
              <div className="flex items-center border border-netflix-white/50 bg-black/80 px-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                    setDismissedQuery('');
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (debouncedQuery.length >= 1) setDismissedQuery('');
                  }}
                  placeholder="Titles, people, genres"
                  className="w-full bg-transparent py-1.5 text-sm text-white placeholder-netflix-mid-gray outline-none"
                  aria-label="Search titles, people, genres"
                  aria-autocomplete="list"
                  aria-controls="search-suggestions"
                  aria-activedescendant={activeSuggestionId}
                  data-testid="search-input"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    className="text-netflix-mid-gray hover:text-white"
                    aria-label="Clear search"
                    data-testid="search-clear"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </search>

      <SearchSuggestions
        query={debouncedQuery}
        isVisible={isExpanded && suggestionsVisible}
        onSelect={handleSelectSuggestion}
        onViewAll={handleViewAll}
        selectedIndex={selectedIndex}
      />
    </div>
  );
}
