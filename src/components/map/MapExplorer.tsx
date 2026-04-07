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

// Order for display
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

  // Available categories that actually have data
  const availableCategories = useMemo(
    () => CATEGORY_ORDER.filter((type) => (categoryCounts[type] ?? 0) > 0),
    [categoryCounts]
  );

  // Filter points
  const filteredPoints = useMemo(() => {
    let pts = initialPoints;

    // Category filter
    if (activeCategory !== "all") {
      pts = pts.filter((p) => p.type === activeCategory);
    }

    // Search filter
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
  }, [initialPoints, activeCategory, search]);

  // Sort list view by distance from center
  const sortedListPoints = useMemo(() => {
    return [...filteredPoints].sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredPoints]);

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
      if (type !== "all") setShowList(false);
    },
    []
  );

  // Close detail card on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSelectedPoint(null);
        setShowList(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const totalPoints = initialPoints.length;

  return (
    <div
      className="relative w-full flex flex-col"
      style={{ height: "calc(100dvh - 64px - 80px)" }}
    >
      {/* ── Top bar: Title + Search ── */}
      <div className="shrink-0 bg-deep border-b border-border-subtle px-4 pt-3 pb-2 space-y-2.5 z-30 relative">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading font-bold text-[17px] leading-tight flex items-center gap-2">
              <span className="text-gold"><Icon name="pin" size={16} className="text-gold" /></span>
              Find Resources
            </h1>
            <p className="text-[11px] text-warm-gray mt-0.5">
              {totalPoints} locations across Compton
            </p>
          </div>
          <button
            onClick={() => setShowList(!showList)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              showList
                ? "bg-gold/15 text-gold border border-gold/30"
                : "bg-white/5 text-warm-gray border border-border-subtle"
            }`}
            aria-label={showList ? "Show map" : "Show list"}
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

        {/* Search */}
        <div className="relative">
          <svg
            width="15"
            height="15"
            viewBox="0 0 16 16"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M11 11l3 3"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search schools, clinics, businesses..."
            className="w-full pl-9 pr-8 py-2 bg-white/[0.04] border border-border-subtle rounded-xl text-[13px] text-txt-primary placeholder:text-muted-gray focus:outline-none focus:border-gold/30 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10"
              aria-label="Clear search"
            >
              <svg
                width="8"
                height="8"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 1l6 6M7 1L1 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-1">
          <button
            onClick={() => handleCategoryClick("all")}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              activeCategory === "all"
                ? "bg-gold text-midnight"
                : "bg-white/[0.06] text-warm-gray border border-border-subtle"
            }`}
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
                  : "bg-white/[0.06] text-warm-gray border border-border-subtle"
              }`}
              style={
                activeCategory === type
                  ? { backgroundColor: MAP_POINT_COLORS[type] }
                  : undefined
              }
            >
              <span className="text-xs">{CATEGORY_ICONS[type]}</span>
              {MAP_POINT_LABELS[type]}
              <span className="opacity-60">{categoryCounts[type] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Map or List view ── */}
      <div className="flex-1 relative">
        {showList ? (
          /* ── List View ── */
          <div
            ref={listRef}
            className="absolute inset-0 bg-deep overflow-y-auto z-20"
          >
            {sortedListPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-5">
                <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-3">
                  <span className="text-2xl"><Icon name="search" size={24} /></span>
                </div>
                <p className="text-sm text-warm-gray font-medium">
                  No results found
                </p>
                <p className="text-[12px] text-muted-gray mt-1">
                  Try a different search or category
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {sortedListPoints.map((point) => {
                  const link = typeof point.metadata?.link === "string" ? point.metadata.link : undefined;
                  const inner = (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
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
                          <p className="text-[11px] text-warm-gray truncate mt-0.5">
                            <Icon name="pin" size={16} /> {point.metadata.address}
                          </p>
                        )}
                        {typeof point.metadata?.description === "string" && (
                          <p className="text-[11px] text-muted-gray truncate mt-0.5">
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
                      className="block hover:bg-white/[0.02] transition-colors"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div
                      key={point.id}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer"
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

            {/* Result count pill */}
            {!selectedPoint && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-deep/90 backdrop-blur-lg border border-border-subtle rounded-full px-4 py-2 shadow-xl">
                <p className="text-[11px] text-warm-gray whitespace-nowrap">
                  <span className="text-gold font-bold">
                    {filteredPoints.length}
                  </span>{" "}
                  {activeCategory === "all"
                    ? "locations"
                    : MAP_POINT_LABELS[activeCategory as PointType]?.toLowerCase() ??
                      "places"}{" "}
                  · Tap pins to explore
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Detail Card (overlay on map) ── */}
        {selectedPoint && !showList && (
          <div className="absolute bottom-0 left-0 right-0 z-30 animate-slide-up">
            <div className="mx-3 mb-3 bg-deep border border-border-subtle rounded-2xl shadow-2xl overflow-hidden">
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
                      <h3 className="font-heading font-bold text-[14px] truncate">
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
                      <p className="text-[12px] text-warm-gray truncate">
                        <Icon name="pin" size={16} /> {selectedPoint.metadata.address}
                      </p>
                    )}
                    {typeof selectedPoint.metadata?.description === "string" && (
                      <p className="text-[11px] text-muted-gray mt-0.5 line-clamp-2">
                        {selectedPoint.metadata.description}
                      </p>
                    )}
                    {typeof selectedPoint.metadata?.phone === "string" && (
                      <a
                        href={`tel:${selectedPoint.metadata.phone}`}
                        className="inline-flex items-center gap-1 text-[11px] text-gold font-medium mt-1"
                      >
                        <Icon name="phone" size={16} /> {selectedPoint.metadata.phone}
                      </a>
                    )}
                  </div>

                  {/* Close */}
                  <button
                    onClick={() => setSelectedPoint(null)}
                    className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center shrink-0"
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
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-border-subtle text-[12px] font-semibold text-warm-gray"
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
