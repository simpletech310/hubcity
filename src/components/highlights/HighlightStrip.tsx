"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import type { CityHighlight } from "@/types/highlights";
import type { ReactionEmoji } from "@/types/database";
import HighlightViewer from "./HighlightViewer";
import HighlightComposer from "./HighlightComposer";

interface HighlightStripProps {
  canCreate: boolean;
  userId: string | null;
  userName: string;
}

const STORAGE_KEY = "hc_viewed_city_highlights";

export default function HighlightStrip({
  canCreate,
  userId,
  userName,
}: HighlightStripProps) {
  const [highlights, setHighlights] = useState<CityHighlight[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionEmoji[]>>({});
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);

  // Fetch highlights
  const fetchHighlights = useCallback(async () => {
    try {
      const res = await fetch("/api/city-highlights");
      if (res.ok) {
        const data = await res.json();
        if (data.highlights) setHighlights(data.highlights);
        if (data.userReactions) setUserReactions(data.userReactions);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  // Load viewed from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setViewedIds(new Set(JSON.parse(stored)));
    } catch {}
  }, []);

  const markViewed = useCallback((id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  }, []);

  const openHighlight = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  if (!canCreate && highlights.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-1">
          {/* New highlight button */}
          {canCreate && (
            <button
              onClick={() => setComposerOpen(true)}
              className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] press"
            >
              <div className="w-[60px] h-[60px] rounded-full border-2 border-dashed border-gold/30 flex items-center justify-center bg-gold/5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <span className="text-[10px] font-medium text-gold/60">New</span>
            </button>
          )}

          {/* Highlight avatars */}
          {highlights.map((h, i) => {
            const isViewed = viewedIds.has(h.id);
            const name = h.author?.display_name || "Unknown";
            const firstName = name.split(" ")[0];
            const initial = name.charAt(0).toUpperCase();

            return (
              <button
                key={h.id}
                onClick={() => openHighlight(i)}
                className="flex flex-col items-center gap-1.5 shrink-0 w-[68px] press"
              >
                <div
                  className={`w-[60px] h-[60px] rounded-full p-[2px] ${
                    isViewed
                      ? "bg-white/20"
                      : "bg-gradient-to-br from-gold via-gold/80 to-amber-600"
                  }`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-midnight">
                    {h.author?.avatar_url ? (
                      <Image
                        src={h.author.avatar_url}
                        alt={name}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-royal to-hc-purple text-gold font-heading font-bold text-lg">
                        {initial}
                      </div>
                    )}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium truncate max-w-[60px] ${
                    isViewed ? "text-white/30" : "text-white/60"
                  }`}
                >
                  {firstName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Viewer */}
      {viewerOpen && highlights.length > 0 && (
        <HighlightViewer
          highlights={highlights}
          initialIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onViewed={markViewed}
          userId={userId}
          userReactions={userReactions}
        />
      )}

      {/* Composer */}
      {canCreate && userId && (
        <HighlightComposer
          isOpen={composerOpen}
          onClose={() => setComposerOpen(false)}
          userId={userId}
          onCreated={fetchHighlights}
        />
      )}
    </>
  );
}
