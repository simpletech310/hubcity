"use client";

import { useState, useMemo, useCallback } from "react";
import MapView from "@/components/ui/MapView";
import MapPointCard from "@/components/map/MapPointCard";
import type { MapPoint } from "@/types/map";
import { MAP_POINT_COLORS, MAP_POINT_LABELS } from "@/types/map";

interface MapExplorerProps {
  initialPoints: MapPoint[];
}

type PointType = MapPoint["type"];

export default function MapExplorer({ initialPoints }: MapExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Determine which types are actually present in the data
  const availableTypes = useMemo(() => {
    const types = new Set<PointType>();
    initialPoints.forEach((p) => types.add(p.type));
    return Array.from(types).sort();
  }, [initialPoints]);

  const [enabledTypes, setEnabledTypes] = useState<Set<PointType>>(
    () => new Set(availableTypes)
  );

  const toggleType = useCallback((type: PointType) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  // Filter points by enabled types and search query
  const filteredPoints = useMemo(() => {
    let pts = initialPoints.filter((p) => enabledTypes.has(p.type));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      pts = pts.filter((p) => p.name.toLowerCase().includes(q));
    }
    return pts;
  }, [initialPoints, enabledTypes, search]);

  const handlePointClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
  }, []);

  return (
    <div className="relative w-full" style={{ height: "calc(100dvh - 72px - 80px)" }}>
      {/* Search bar — floating top center */}
      <div className="absolute top-3 left-3 right-14 z-20">
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M11 11l3.5 3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search places..."
            className="w-full pl-9 pr-4 py-2.5 bg-deep/95 backdrop-blur-lg border border-border-subtle rounded-xl text-sm text-txt-primary placeholder:text-muted-gray focus:outline-none focus:border-gold/30 transition-colors"
          />
        </div>
      </div>

      {/* Layer toggle button */}
      <button
        onClick={() => setShowFilters((v) => !v)}
        className={`absolute top-3 right-3 z-20 w-10 h-10 flex items-center justify-center rounded-xl border transition-colors ${
          showFilters
            ? "bg-gold/15 border-gold/30 text-gold"
            : "bg-deep/95 backdrop-blur-lg border-border-subtle text-txt-secondary"
        }`}
        aria-label="Toggle layer filters"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M2 4h14M4 9h10M6 14h6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Layer filter panel */}
      {showFilters && (
        <div className="absolute top-14 right-3 z-20 bg-deep/95 backdrop-blur-lg border border-border-subtle rounded-xl p-3 min-w-[170px] shadow-2xl">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary mb-2">
            Layers
          </p>
          <div className="flex flex-col gap-1.5">
            {availableTypes.map((type) => (
              <label
                key={type}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={enabledTypes.has(type)}
                  onChange={() => toggleType(type)}
                  className="sr-only"
                />
                <span
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    enabledTypes.has(type)
                      ? "border-transparent"
                      : "border-white/15 bg-white/5"
                  }`}
                  style={
                    enabledTypes.has(type)
                      ? { backgroundColor: MAP_POINT_COLORS[type] }
                      : undefined
                  }
                >
                  {enabledTypes.has(type) && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="#0A0A0A"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: MAP_POINT_COLORS[type] }}
                  />
                  <span className="text-xs text-txt-primary group-hover:text-gold-light transition-colors">
                    {MAP_POINT_LABELS[type]}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <MapView
        points={filteredPoints}
        onPointClick={handlePointClick}
        height="100%"
      />

      {/* Detail card */}
      {selectedPoint && (
        <MapPointCard
          point={selectedPoint}
          onClose={() => setSelectedPoint(null)}
        />
      )}
    </div>
  );
}
