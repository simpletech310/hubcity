"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import MapView from "@/components/ui/MapView";
import type { MapPoint } from "@/types/map";
import { MAP_POINT_COLORS, MAP_POINT_LABELS } from "@/types/map";
import Icon from "@/components/ui/Icon";

interface MapExplorerProps {
  initialPoints: MapPoint[];
  categoryCounts: Record<string, number>;
}

type PointType = MapPoint["type"];

interface AIPlace {
  id: string;
  name: string;
  type: string;
}

const CATEGORY_ICONS: Record<PointType, string> = {
  business: "store",
  event: "calendar",
  issue: "wrench",
  health: "heart-pulse",
  school: "graduation",
  transit: "transit",
  park: "tree",
  mural: "palette",
};

const CATEGORY_ORDER: PointType[] = [
  "school",
  "health",
  "business",
  "park",
  "event",
  "issue",
  "transit",
  "mural",
];

const SUGGESTED_QUERIES = [
  "Where can I get a burrito?",
  "Free food or food banks",
  "Parks with playgrounds",
  "Mental health clinics",
  "Best rated businesses",
  "Schools near me",
];

export default function MapExplorer({
  initialPoints,
  categoryCounts,
}: MapExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [activeCategory, setActiveCategory] = useState<PointType | "all">(
    "all"
  );
  const [showList, setShowList] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    -118.2201, 33.8958,
  ]);
  const [mapZoom, setMapZoom] = useState(13);
  const listRef = useRef<HTMLDivElement>(null);

  // AI state
  const [aiQuery, setAiQuery] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [aiPlaces, setAiPlaces] = useState<AIPlace[]>([]);
  const [aiHighlightIds, setAiHighlightIds] = useState<Set<string>>(new Set());
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const aiInputRef = useRef<HTMLInputElement>(null);

  // Available categories that actually have data
  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((type) => (categoryCounts[type] ?? 0) > 0),
    [categoryCounts]
  );

  // Filter points
  const filteredPoints = useMemo(() => {
    let pts = initialPoints;

    // If AI results active, show only those
    if (aiHighlightIds.size > 0) {
      return pts.filter((p) => aiHighlightIds.has(p.id));
    }

    if (activeCategory !== "all") {
      pts = pts.filter((p) => p.type === activeCategory);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pts = pts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.metadata?.address as string)?.toLowerCase().includes(q) ||
          (p.metadata?.category as string)?.toLowerCase().includes(q) ||
          (p.metadata?.description as string)?.toLowerCase().includes(q)
      );
    }

    return pts;
  }, [initialPoints, activeCategory, search, aiHighlightIds]);

  // Sort list view alphabetically
  const sortedListPoints = useMemo(() => {
    return [...filteredPoints].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPoints]);

  // Zoom to fit AI results
  useEffect(() => {
    if (aiHighlightIds.size === 0) return;
    const matched = initialPoints.filter((p) => aiHighlightIds.has(p.id));
    if (matched.length === 0) return;

    if (matched.length === 1) {
      setMapCenter([matched[0].longitude, matched[0].latitude]);
      setMapZoom(16);
    } else {
      // Calculate bounding box center
      const lngs = matched.map((p) => p.longitude);
      const lats = matched.map((p) => p.latitude);
      const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
      const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
      setMapCenter([centerLng, centerLat]);
      // Rough zoom based on spread
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const latSpread = Math.max(...lats) - Math.min(...lats);
      const spread = Math.max(lngSpread, latSpread);
      if (spread > 0.05) setMapZoom(13);
      else if (spread > 0.02) setMapZoom(14);
      else setMapZoom(15);
    }
  }, [aiHighlightIds, initialPoints]);

  const handlePointClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    setShowList(false);
  }, []);

  const handleListItemClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    setMapCenter([point.longitude, point.latitude]);
    setMapZoom(16);
    setShowList(false);
  }, []);

  const handleCategoryClick = useCallback(
    (type: PointType | "all") => {
      setActiveCategory(type);
      setSelectedPoint(null);
      clearAiResults();
      if (type !== "all") setShowList(false);
    },
    []
  );

  const clearAiResults = useCallback(() => {
    setAiMessage(null);
    setAiPlaces([]);
    setAiHighlightIds(new Set());
    setShowAiPanel(false);
  }, []);

  const handleAiSearch = useCallback(
    async (queryText?: string) => {
      const q = (queryText ?? aiQuery).trim();
      if (!q || aiLoading) return;

      setAiLoading(true);
      setShowAiPanel(true);
      setShowSuggestions(false);
      setAiMessage(null);
      setAiPlaces([]);
      setSelectedPoint(null);
      setActiveCategory("all");
      setSearch("");

      try {
        const res = await fetch("/api/ai/map-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q }),
        });

        if (res.ok) {
          const data = await res.json();
          setAiMessage(data.message || "No results found.");
          const places: AIPlace[] = data.places || [];
          setAiPlaces(places);

          // Match place IDs to our map points
          const matchedIds = new Set<string>();
          for (const place of places) {
            // Direct ID match
            const directMatch = initialPoints.find((p) => p.id === place.id);
            if (directMatch) {
              matchedIds.add(directMatch.id);
            } else {
              // Fuzzy name match as fallback
              const nameMatch = initialPoints.find(
                (p) =>
                  p.name.toLowerCase() === place.name?.toLowerCase()
              );
              if (nameMatch) matchedIds.add(nameMatch.id);
            }
          }
          setAiHighlightIds(matchedIds);
        } else {
          setAiMessage(
            "Sorry, I'm having trouble searching right now. Try browsing the categories instead."
          );
        }
      } catch {
        setAiMessage(
          "Couldn't reach the AI assistant. Check your connection and try again."
        );
      } finally {
        setAiLoading(false);
      }
    },
    [aiQuery, aiLoading, initialPoints]
  );

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedPoint(null);
        setShowList(false);
        setShowSuggestions(false);
        if (showAiPanel) clearAiResults();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showAiPanel, clearAiResults]);

  const totalPoints = initialPoints.length;

  return (
    <div
      className="relative w-full flex flex-col"
      style={{ height: "calc(100dvh - 64px - 80px)" }}
    >
      {/* ── Top bar ── */}
      <div className="shrink-0 px-4 pt-3 pb-2 space-y-2.5 z-30 relative" style={{ background: "var(--paper)", borderBottom: "2px solid var(--rule-strong-c)" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-[17px] leading-tight flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
              <span className="text-gold">
                <Icon name="pin" size={16} className="text-gold" />
              </span>
              Explore Compton
            </h1>
            <p className="text-[11px] c-meta mt-0.5">
              {aiHighlightIds.size > 0
                ? `${aiHighlightIds.size} AI results`
                : `${totalPoints} locations across Compton`}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {aiHighlightIds.size > 0 && (
              <button
                onClick={() => {
                  clearAiResults();
                  setAiQuery("");
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-coral/15 text-coral border border-coral/20"
              >
                <svg
                  width="10"
                  height="10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M1 1l8 8M9 1L1 9" />
                </svg>
                Clear
              </button>
            )}
            <button
              onClick={() => setShowList(!showList)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                showList
                  ? "bg-gold/15 text-gold border border-gold/30"
                  : "c-meta"
              }`}
              style={showList ? undefined : { background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
            >
              {showList ? (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M1 6a5 5 0 1010 0A5 5 0 001 6z" />
                    <path d="M9.5 9.5L13 13" />
                  </svg>
                  Map
                </>
              ) : (
                <>
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M2 3h10M2 7h7M2 11h5" />
                  </svg>
                  List
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Search Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#0A0A0F"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a4 4 0 014 4c0 1.5-1 3-2 4l-2 2-2-2c-1-1-2-2.5-2-4a4 4 0 014-4z" />
              <path d="M6 20l3-3M18 20l-3-3M12 22v-8" />
            </svg>
          </div>
          <input
            ref={aiInputRef}
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onFocus={() => !aiQuery && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAiSearch();
            }}
            placeholder="Ask AI — &quot;burritos&quot;, &quot;free food&quot;, &quot;best parks&quot;..."
            className="w-full pl-10 pr-12 py-2.5 border border-gold/20 text-[13px] placeholder:text-[var(--ink-mute)] focus:outline-none focus:border-gold/40 transition-colors"
            style={{ background: "var(--paper-warm)" }}
          />
          {aiQuery ? (
            <button
              onClick={() => handleAiSearch()}
              disabled={aiLoading}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-gold text-midnight text-[11px] font-bold disabled:opacity-50"
            >
              {aiLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-midnight border-t-transparent rounded-full animate-spin" />
              ) : (
                "Ask"
              )}
            </button>
          ) : (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gold/50 font-semibold">
              AI
            </div>
          )}

          {/* Suggested queries dropdown */}
          {showSuggestions && !aiQuery && (
            <div className="absolute left-0 right-0 top-full mt-1 shadow-xl z-40 overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-semibold text-gold/60 uppercase tracking-wider">
                Try asking
              </p>
              {SUGGESTED_QUERIES.map((q) => (
                <button
                  key={q}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    setAiQuery(q);
                    setShowSuggestions(false);
                    handleAiSearch(q);
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] c-meta hover:bg-[var(--paper-warm)] transition-colors flex items-center gap-2"
                >
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    className="text-gold/40 shrink-0"
                  >
                    <circle cx="6" cy="6" r="5" />
                    <path d="M9.5 9.5L13 13" />
                  </svg>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category chips — hide when AI results active */}
        {aiHighlightIds.size === 0 && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
            <button
              onClick={() => handleCategoryClick("all")}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                activeCategory === "all"
                  ? "bg-gold text-midnight"
                  : "c-meta"
              }`}
              style={activeCategory !== "all" ? { background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" } : undefined}
            >
              All
              <span className="opacity-60">{totalPoints}</span>
            </button>
            {availableCategories.map((type) => (
              <button
                key={type}
                onClick={() => handleCategoryClick(type)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
                  activeCategory === type
                    ? "text-midnight"
                    : "c-meta"
                }`}
                style={
                  activeCategory === type
                    ? { backgroundColor: MAP_POINT_COLORS[type] }
                    : { background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }
                }
              >
                <span className="text-xs">{CATEGORY_ICONS[type]}</span>
                {MAP_POINT_LABELS[type]}
                <span className="opacity-60">
                  {categoryCounts[type] ?? 0}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Map or List view ── */}
      <div className="flex-1 relative">
        {showList ? (
          /* ── List View ── */
          <div
            ref={listRef}
            className="absolute inset-0 overflow-y-auto z-20"
            style={{ background: "var(--paper)" }}
          >
            {sortedListPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-5">
                <div className="w-14 h-14 flex items-center justify-center mb-3" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                  <span className="text-2xl">
                    <Icon name="search" size={24} />
                  </span>
                </div>
                <p className="text-sm c-meta font-medium">
                  No results found
                </p>
                <p className="text-[12px] c-meta mt-1">
                  Try a different search or category
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--rule-strong-c)" }}>
                {sortedListPoints.map((point) => {
                  const link =
                    typeof point.metadata?.link === "string"
                      ? point.metadata.link
                      : undefined;
                  const inner = (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div
                        className="w-9 h-9 flex items-center justify-center shrink-0 mt-0.5"
                        style={{
                          backgroundColor: `${MAP_POINT_COLORS[point.type]}15`,
                        }}
                      >
                        <span className="text-sm">
                          {CATEGORY_ICONS[point.type]}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold truncate">
                          {point.name}
                        </p>
                        {typeof point.metadata?.address === "string" && (
                          <p className="text-[11px] c-meta truncate mt-0.5">
                            {point.metadata.address}
                          </p>
                        )}
                        {typeof point.metadata?.description === "string" && (
                          <p className="text-[11px] c-meta truncate mt-0.5">
                            {point.metadata.description}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: MAP_POINT_COLORS[point.type],
                            backgroundColor: `${MAP_POINT_COLORS[point.type]}12`,
                          }}
                        >
                          {MAP_POINT_LABELS[point.type]}
                        </span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleListItemClick(point);
                          }}
                          className="text-[10px] text-gold font-medium"
                        >
                          Show on map
                        </button>
                      </div>
                    </div>
                  );

                  return link ? (
                    <Link
                      key={point.id}
                      href={link}
                      className="block hover:bg-[var(--paper-warm)] transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={point.id}
                      className="hover:bg-[var(--paper-warm)] transition-colors cursor-pointer"
                      onClick={() => handleListItemClick(point)}
                    >
                      {inner}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ── Map View ── */
          <>
            <MapView
              points={filteredPoints}
              center={mapCenter}
              zoom={mapZoom}
              onPointClick={handlePointClick}
              height="100%"
            />

            {/* Result count pill — show when no AI panel and no selection */}
            {!selectedPoint && !showAiPanel && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                <p className="text-[11px] c-meta whitespace-nowrap">
                  <span className="text-gold font-bold">
                    {filteredPoints.length}
                  </span>{" "}
                  {activeCategory === "all"
                    ? "locations"
                    : MAP_POINT_LABELS[
                        activeCategory as PointType
                      ]?.toLowerCase() ?? "places"}{" "}
                  · Tap pins to explore
                </p>
              </div>
            )}
          </>
        )}

        {/* ── AI Response Panel ── */}
        {showAiPanel && !showList && (
          <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
            <div className="mx-3 mb-3 shadow-2xl overflow-hidden max-h-[45vh]" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              {/* Gold accent */}
              <div className="h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent" />

              <div className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#0A0A0F"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M12 2a4 4 0 014 4c0 1.5-1 3-2 4l-2 2-2-2c-1-1-2-2.5-2-4a4 4 0 014-4z" />
                        <path d="M6 20l3-3M18 20l-3-3M12 22v-8" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-bold text-gold uppercase tracking-wider">
                      Culture AI
                    </span>
                  </div>
                  <button
                    onClick={clearAiResults}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                  >
                    <svg
                      width="10"
                      height="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M1 1l8 8M9 1L1 9" />
                    </svg>
                  </button>
                </div>

                {/* Loading state */}
                {aiLoading && (
                  <div className="flex items-center gap-3 py-4">
                    <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] c-meta">
                      Searching Compton for you...
                    </span>
                  </div>
                )}

                {/* AI Message */}
                {!aiLoading && aiMessage && (
                  <div className="overflow-y-auto max-h-[30vh] space-y-3">
                    <p className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: "var(--ink-mute)" }}>
                      {aiMessage}
                    </p>

                    {/* Quick-tap place cards */}
                    {aiPlaces.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pt-1">
                        {aiPlaces.map((place) => {
                          const mapPoint = initialPoints.find(
                            (p) =>
                              p.id === place.id ||
                              p.name.toLowerCase() ===
                                place.name?.toLowerCase()
                          );
                          if (!mapPoint) return null;
                          return (
                            <button
                              key={place.id}
                              onClick={() => {
                                setSelectedPoint(mapPoint);
                                setMapCenter([
                                  mapPoint.longitude,
                                  mapPoint.latitude,
                                ]);
                                setMapZoom(16);
                              }}
                              className="shrink-0 flex items-center gap-2 px-3 py-2 hover:border-gold/20 transition-colors"
                              style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                            >
                              <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                                style={{
                                  backgroundColor: `${MAP_POINT_COLORS[mapPoint.type]}15`,
                                }}
                              >
                                <span className="text-xs">
                                  {CATEGORY_ICONS[mapPoint.type]}
                                </span>
                              </div>
                              <div className="text-left min-w-0">
                                <p className="text-[11px] font-semibold truncate max-w-[120px]" style={{ color: "var(--ink-strong)" }}>
                                  {mapPoint.name}
                                </p>
                                <p className="text-[9px] c-meta">
                                  {MAP_POINT_LABELS[mapPoint.type]}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Detail Card (overlay on map) ── */}
        {selectedPoint && !showList && !showAiPanel && (
          <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
            <div className="mx-3 mb-3 shadow-2xl overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
              {/* Color accent */}
              <div
                className="h-1"
                style={{
                  background: `linear-gradient(90deg, ${MAP_POINT_COLORS[selectedPoint.type]}, transparent)`,
                }}
              />

              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${MAP_POINT_COLORS[selectedPoint.type]}15`,
                      border: `1px solid ${MAP_POINT_COLORS[selectedPoint.type]}25`,
                    }}
                  >
                    <span className="text-lg">
                      {CATEGORY_ICONS[selectedPoint.type]}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-heading font-bold text-[14px] truncate" style={{ color: "var(--ink-strong)" }}>
                        {selectedPoint.name}
                      </h3>
                      <span
                        className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          color: MAP_POINT_COLORS[selectedPoint.type],
                          backgroundColor: `${MAP_POINT_COLORS[selectedPoint.type]}12`,
                        }}
                      >
                        {MAP_POINT_LABELS[selectedPoint.type]}
                      </span>
                    </div>
                    {typeof selectedPoint.metadata?.address === "string" && (
                      <p className="text-[12px] c-meta truncate">
                        {selectedPoint.metadata.address}
                      </p>
                    )}
                    {typeof selectedPoint.metadata?.description ===
                      "string" && (
                      <p className="text-[11px] c-meta mt-0.5 line-clamp-2">
                        {selectedPoint.metadata.description}
                      </p>
                    )}
                    {typeof selectedPoint.metadata?.phone === "string" && (
                      <a
                        href={`tel:${selectedPoint.metadata.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-gold font-medium mt-1"
                      >
                        <Icon name="phone" size={16} />{" "}
                        {selectedPoint.metadata.phone}
                      </a>
                    )}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    aria-label="Close"
                  >
                    <svg
                      width="12"
                      height="12"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    >
                      <path d="M2 2l8 8M10 2l-8 8" />
                    </svg>
                  </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                  {typeof selectedPoint.metadata?.link === "string" && (
                    <Link
                      href={selectedPoint.metadata.link}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-bold text-midnight"
                      style={{
                        backgroundColor:
                          MAP_POINT_COLORS[selectedPoint.type],
                      }}
                    >
                      View Details
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M4 3l4 4-4 4" />
                      </svg>
                    </Link>
                  )}
                  {typeof selectedPoint.metadata?.address === "string" && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(selectedPoint.metadata.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-4 py-2 text-[12px] font-semibold c-meta"
                      style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}
                    >
                      <svg
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 8c0 3-4 6-4 6S4 11 4 8a4 4 0 118 0z" />
                        <circle cx="8" cy="8" r="1" />
                      </svg>
                      Directions
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
