"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  link: string;
}

interface SearchResults {
  people: SearchResult[];
  posts: SearchResult[];
  businesses: SearchResult[];
  events: SearchResult[];
  schools: SearchResult[];
  channels: SearchResult[];
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ------------------------------------------------------------------ */
/*  Category config                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_META: Record<
  keyof SearchResults,
  { label: string; icon: React.ReactNode }
> = {
  people: {
    label: "People",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="7" cy="5" r="3" />
        <path d="M1.5 13a5.5 5.5 0 0 1 11 0" />
      </svg>
    ),
  },
  posts: {
    label: "Posts",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="10" height="10" rx="2" />
        <path d="M5 5h4M5 7.5h3" />
      </svg>
    ),
  },
  businesses: {
    label: "Businesses",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12V6l5-4 5 4v6H2z" />
        <rect x="5" y="8" width="4" height="4" />
      </svg>
    ),
  },
  events: {
    label: "Events",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1.5" y="3" width="11" height="9" rx="1.5" />
        <path d="M4.5 1.5v3M9.5 1.5v3M1.5 6.5h11" />
      </svg>
    ),
  },
  schools: {
    label: "Schools",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 1L1 5l6 4 6-4-6-4z" />
        <path d="M1 9l6 4 6-4" />
      </svg>
    ),
  },
  channels: {
    label: "Channels",
    icon: (
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="5,3 12,7 5,11" />
      </svg>
    ),
  },
};

const SUGGESTIONS = [
  "Restaurants near me",
  "Community events",
  "Youth programs",
  "Local schools",
  "Independents near me",
];

const RECENT_KEY = "knect_recent_searches";
const MAX_RECENT = 8;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter(
      (s) => s.toLowerCase() !== query.toLowerCase()
    );
    recent.unshift(query);
    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {
    // localStorage unavailable
  }
}

function removeRecentSearch(query: string) {
  try {
    const recent = getRecentSearches().filter(
      (s) => s.toLowerCase() !== query.toLowerCase()
    );
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
  } catch {
    // localStorage unavailable
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults(null);
      setLoading(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Debounced search
  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);

    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results);
      saveRecentSearch(q);
      setRecentSearches(getRecentSearches());
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setResults(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => search(value.trim()), 300);
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    search(text);
  };

  const handleRemoveRecent = (text: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentSearch(text);
    setRecentSearches(getRecentSearches());
  };

  const handleResultClick = () => {
    onClose();
  };

  // Count total results
  const totalResults = results
    ? Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
    : 0;

  const hasResults = results && totalResults > 0;
  const hasNoResults = results && totalResults === 0 && query.length >= 2;
  const showEmpty = !loading && !results && query.length < 2;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(26,21,18,0.72)" }}
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="relative z-10 flex flex-col h-full max-w-[430px] mx-auto w-full animate-slide-up"
        style={{ background: "var(--paper)", color: "var(--ink-strong)" }}
      >
        {/* Header with search input */}
        <div className="px-4 pt-safe-top">
          <div className="flex items-center gap-3 pt-4 pb-3">
            {/* Search input */}
            <div className="flex-1 relative">
              <div
                className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--ink-strong)", opacity: 0.7 }}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="M10.5 10.5l3.5 3.5" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search people, posts, businesses..."
                className="w-full pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all"
                style={{
                  background: "var(--paper)",
                  color: "var(--ink-strong)",
                  border: "2px solid var(--rule-strong-c)",
                  borderRadius: 0,
                  // @ts-expect-error CSS custom prop
                  "--tw-ring-color": "var(--gold-c)",
                }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    border: "2px solid var(--rule-strong-c)",
                    background: "var(--paper)",
                    color: "var(--ink-strong)",
                  }}
                >
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M1 1l8 8M9 1l-8 8" />
                  </svg>
                </button>
              )}
            </div>

            {/* Cancel button */}
            <button
              onClick={onClose}
              className="c-btn c-btn-outline c-btn-sm press shrink-0"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Scrollable results area */}
        <div className="flex-1 overflow-y-auto px-4 pb-8 overscroll-contain">
          {/* Loading skeleton */}
          {loading && !hasResults && (
            <div className="space-y-4 pt-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse">
                  <div
                    className="h-3 w-20 mb-3"
                    style={{ background: "var(--paper-soft)" }}
                  />
                  <div className="space-y-2.5">
                    {[1, 2].map((j) => (
                      <div
                        key={j}
                        className="flex items-center gap-3 p-3"
                        style={{
                          background: "var(--paper)",
                          border: "2px solid var(--rule-strong-c)",
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full shrink-0"
                          style={{ background: "var(--paper-soft)" }}
                        />
                        <div className="flex-1 space-y-1.5">
                          <div
                            className="h-3.5 w-3/4"
                            style={{ background: "var(--paper-soft)" }}
                          />
                          <div
                            className="h-2.5 w-1/2"
                            style={{ background: "var(--paper-soft)", opacity: 0.7 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grouped by type */}
          {hasResults && (
            <div className="space-y-5 pt-2">
              {(Object.keys(CATEGORY_META) as Array<keyof SearchResults>).map(
                (category) => {
                  const items = results[category];
                  if (!items || items.length === 0) return null;
                  const meta = CATEGORY_META[category];
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <span style={{ color: "var(--ink-strong)", opacity: 0.7 }}>
                          {meta.icon}
                        </span>
                        <span
                          className="c-kicker"
                          style={{ color: "var(--ink-strong)", opacity: 0.7 }}
                        >
                          {meta.label}
                        </span>
                        <span
                          className="c-meta"
                          style={{ fontSize: "10px" }}
                        >
                          {items.length}
                        </span>
                      </div>
                      <div>
                        {items.map((item) => (
                          <Link
                            key={item.id}
                            href={item.link}
                            onClick={handleResultClick}
                            className="flex items-center gap-3 p-3 transition-all press group"
                            style={{
                              background: "var(--paper)",
                              borderBottom: "2px solid var(--rule-strong-c)",
                              color: "var(--ink-strong)",
                            }}
                          >
                            {/* Avatar / image */}
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-10 h-10 object-cover shrink-0 c-frame"
                                style={{ background: "var(--paper-soft)" }}
                              />
                            ) : (
                              <div
                                className="w-10 h-10 flex items-center justify-center shrink-0 c-frame"
                                style={{
                                  background: "var(--paper-soft)",
                                  color: "var(--ink-strong)",
                                }}
                              >
                                {meta.icon}
                              </div>
                            )}
                            {/* Text */}
                            <div className="flex-1 min-w-0">
                              <p
                                className="c-card-t truncate"
                                style={{ fontSize: "14px" }}
                              >
                                {item.title}
                              </p>
                              {item.subtitle && (
                                <p className="c-meta truncate mt-0.5">
                                  {item.subtitle}
                                </p>
                              )}
                              {item.description && !item.subtitle && (
                                <p className="c-meta truncate mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            {/* Arrow */}
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              className="shrink-0"
                              style={{ color: "var(--ink-strong)", opacity: 0.5 }}
                            >
                              <path d="M5 2l6 5-6 5" />
                            </svg>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}

          {/* No results */}
          {hasNoResults && !loading && (
            <div className="flex flex-col items-center justify-center pt-16 text-center">
              <div
                className="w-14 h-14 flex items-center justify-center mb-4 c-frame"
                style={{ background: "var(--paper-soft)" }}
              >
                <svg
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  style={{ color: "var(--ink-strong)", opacity: 0.6 }}
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M16 16l5 5" />
                  <path d="M8 11h6" />
                </svg>
              </div>
              <p
                className="c-card-t"
                style={{ fontSize: "14px" }}
              >
                No results for &ldquo;{query}&rdquo;
              </p>
              <p className="c-meta mt-1.5 max-w-[240px]">
                Try searching for people, businesses, events, schools, or channels
              </p>
            </div>
          )}

          {/* Empty state: Recent searches + suggestions */}
          {showEmpty && (
            <div className="pt-2">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between px-1 mb-2.5">
                    <span
                      className="c-kicker"
                      style={{ color: "var(--ink-strong)", opacity: 0.7 }}
                    >
                      Recent
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem(RECENT_KEY);
                        setRecentSearches([]);
                      }}
                      className="c-meta press"
                      style={{ textTransform: "none" }}
                    >
                      Clear all
                    </button>
                  </div>
                  <div>
                    {recentSearches.map((text) => (
                      <button
                        key={text}
                        onClick={() => handleSuggestionClick(text)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 transition-colors press group"
                        style={{
                          background: "var(--paper)",
                          borderBottom: "2px solid var(--rule-strong-c)",
                          color: "var(--ink-strong)",
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="shrink-0"
                          style={{ color: "var(--ink-strong)", opacity: 0.55 }}
                        >
                          <polyline points="1,1 1,6 6,6" transform="rotate(180 3.5 3.5)" />
                          <path d="M1.5 6A5.5 5.5 0 1 0 3 2.5" />
                        </svg>
                        <span
                          className="flex-1 text-left truncate text-sm"
                          style={{ color: "var(--ink-strong)" }}
                        >
                          {text}
                        </span>
                        <span
                          onClick={(e) => handleRemoveRecent(text, e)}
                          className="w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          style={{
                            border: "2px solid var(--rule-strong-c)",
                            background: "var(--paper)",
                          }}
                        >
                          <svg
                            width="8"
                            height="8"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            style={{ color: "var(--ink-strong)" }}
                          >
                            <path d="M1 1l6 6M7 1l-6 6" />
                          </svg>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div>
                <p
                  className="c-kicker px-1 mb-2.5"
                  style={{ color: "var(--ink-strong)", opacity: 0.7 }}
                >
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((text) => (
                    <button
                      key={text}
                      onClick={() => handleSuggestionClick(text)}
                      className="c-chip press"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer hint */}
              <div className="mt-10 text-center">
                <p
                  className="c-meta leading-relaxed"
                  style={{ fontSize: "10px" }}
                >
                  Search across people, posts, businesses, events, schools &amp; channels
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
