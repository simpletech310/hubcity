"use client";

import { useState, useRef, useEffect } from "react";
import Badge from "@/components/ui/Badge";
import { useActiveCity } from "@/hooks/useActiveCity";

interface AISearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AISearchModal({ isOpen, onClose }: AISearchModalProps) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeCity = useActiveCity();
  const cityName = activeCity?.name ?? "your city";

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setResponse("");
    setSource(null);

    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim(), context_type: "general" }),
      });

      if (!res.ok) throw new Error("Search failed");

      const data = await res.json();
      setResponse(data.response || "No response received.");
      setSource(data.source || null);
    } catch {
      setResponse("Sorry, AI search is temporarily unavailable. Try browsing the app directly.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const quickQueries = [
    "Best food spots nearby",
    `Youth programs in ${cityName}`,
    "Free health clinics",
    "Upcoming events this week",
    "Job training resources",
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-midnight/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full max-w-[430px] mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-gold" strokeLinecap="round">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M10.5 10.5l3.5 3.5" />
              </svg>
            </div>
            <div>
              <h2 className="font-heading font-bold text-base">Culture AI</h2>
              <p className="text-[10px] text-txt-secondary">Powered by AI · {cityName} data</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors press"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSubmit} className="px-5 mb-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Ask anything about ${cityName}...`}
              className="w-full bg-white/[0.06] border border-border-subtle rounded-2xl pl-4 pr-12 py-4 text-sm text-white placeholder:text-txt-secondary focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20 transition-colors"
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-gradient-to-r from-gold to-gold-light flex items-center justify-center text-midnight disabled:opacity-30 transition-opacity press"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12l5-5 5 5" transform="rotate(90 8 8)" />
                </svg>
              )}
            </button>
          </div>
        </form>

        {/* Results or Quick Queries */}
        <div className="flex-1 overflow-y-auto px-5 pb-8">
          {loading && (
            <div className="space-y-3 animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-gold animate-bounce" />
                <span className="text-xs text-gold font-medium">Searching {cityName} data...</span>
              </div>
              <div className="h-4 bg-white/5 rounded-lg w-full" />
              <div className="h-4 bg-white/5 rounded-lg w-4/5" />
              <div className="h-4 bg-white/5 rounded-lg w-3/5" />
              <div className="h-4 bg-white/5 rounded-lg w-full" />
              <div className="h-4 bg-white/5 rounded-lg w-2/3" />
            </div>
          )}

          {!loading && response && (
            <div className="animate-fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Badge label="AI Response" variant="gold" shine />
                {source && (
                  <span className="text-[10px] text-txt-secondary">
                    via {source === "openai" ? "OpenAI" : "Culture"}
                  </span>
                )}
              </div>
              <div className="bg-white/[0.03] border border-border-subtle rounded-2xl p-4">
                <div className="text-sm text-txt-primary leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
              </div>
              <button
                onClick={() => {
                  setResponse("");
                  setQuery("");
                  setSource(null);
                  inputRef.current?.focus();
                }}
                className="mt-4 text-xs text-gold font-medium hover:underline press"
              >
                ← Ask another question
              </button>
            </div>
          )}

          {!loading && !response && (
            <div>
              <p className="text-[11px] text-txt-secondary font-semibold uppercase tracking-wider mb-3">
                Try asking
              </p>
              <div className="space-y-2">
                {quickQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setQuery(q);
                      setTimeout(() => handleSearch(), 0);
                    }}
                    className="w-full text-left flex items-center gap-3 bg-white/[0.03] border border-border-subtle rounded-xl px-4 py-3 hover:border-gold/20 hover:bg-white/[0.05] transition-all press group"
                  >
                    <span className="text-gold/60 group-hover:text-gold transition-colors">→</span>
                    <span className="text-sm text-txt-secondary group-hover:text-white transition-colors">
                      {q}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-[10px] text-txt-secondary/50 leading-relaxed">
                  Culture AI searches local businesses, events, and resources in {cityName}.
                  <br />
                  Results are based on community data.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
