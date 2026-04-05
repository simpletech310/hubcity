"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import MapView from "@/components/ui/MapView";
import MapPointCard from "@/components/map/MapPointCard";
import type { MapPoint } from "@/types/map";
import { MAP_POINT_COLORS, MAP_POINT_LABELS } from "@/types/map";
import { geocodeSearch, type GeocodingResult } from "@/lib/mapbox";

interface MapExplorerProps {
  initialPoints: MapPoint[];
}

type PointType = MapPoint["type"];

// Compton landmark seed points — always shown so the map is never empty
const COMPTON_LANDMARKS: MapPoint[] = [
  {
    id: "landmark-city-hall",
    type: "business",
    name: "Compton City Hall",
    latitude: 33.8958,
    longitude: -118.2201,
    metadata: { address: "205 S Willowbrook Ave, Compton, CA 90220", category: "Government", description: "Compton City Hall — seat of city government" },
  },
  {
    id: "landmark-compton-courthouse",
    type: "business",
    name: "Compton Courthouse",
    latitude: 33.8969,
    longitude: -118.2175,
    metadata: { address: "200 W Compton Blvd, Compton, CA 90220", category: "Government", description: "Los Angeles Superior Court — Compton branch" },
  },
  {
    id: "landmark-mlk-transit",
    type: "transit",
    name: "Compton Station (Metro A Line)",
    latitude: 33.8968,
    longitude: -118.2238,
    metadata: { address: "101 E Compton Blvd, Compton, CA 90220", category: "Transit", description: "Metro A Line (Blue) light rail station" },
  },
  {
    id: "landmark-centennial-hs",
    type: "school",
    name: "Centennial High School",
    latitude: 33.8838,
    longitude: -118.2291,
    metadata: { address: "727 S Central Ave, Compton, CA 90220", category: "Education", description: "Compton Unified School District" },
  },
  {
    id: "landmark-compton-college",
    type: "school",
    name: "Compton College",
    latitude: 33.8789,
    longitude: -118.2045,
    metadata: { address: "1111 E Artesia Blvd, Compton, CA 90221", category: "Education", description: "Community college serving Compton" },
  },
  {
    id: "landmark-wilson-park",
    type: "park",
    name: "Wilson Park",
    latitude: 33.9002,
    longitude: -118.2134,
    metadata: { address: "701 E Palmer St, Compton, CA 90221", category: "Park", description: "Community park with sports facilities" },
  },
  {
    id: "landmark-gonzales-park",
    type: "park",
    name: "Gonzales Park",
    latitude: 33.8822,
    longitude: -118.2381,
    metadata: { address: "111 S Santa Fe Ave, Compton, CA 90221", category: "Park", description: "Neighborhood park and recreation area" },
  },
  {
    id: "landmark-lueders-park",
    type: "park",
    name: "Lueders Park / Community Center",
    latitude: 33.8925,
    longitude: -118.2303,
    metadata: { address: "1500 E Santa Fe Ave, Compton, CA 90221", category: "Park", description: "Community center with gym, pool, and event space" },
  },
  {
    id: "landmark-hub-city-market",
    type: "business",
    name: "Compton Swap Meet & Market",
    latitude: 33.8993,
    longitude: -118.2202,
    metadata: { address: "1600 W Long Beach Blvd, Compton, CA 90221", category: "Market", description: "Local marketplace and swap meet" },
  },
  {
    id: "landmark-mlk-memorial",
    type: "mural",
    name: "MLK Memorial Mural",
    latitude: 33.8960,
    longitude: -118.2250,
    metadata: { address: "Compton Blvd & Willowbrook Ave", category: "Art", description: "Martin Luther King Jr. memorial mural" },
  },
  {
    id: "landmark-compton-fire",
    type: "health",
    name: "Compton Fire Station #1",
    latitude: 33.8979,
    longitude: -118.2191,
    metadata: { address: "201 E Compton Blvd, Compton, CA 90220", category: "Emergency", description: "LA County Fire Department Station #26" },
  },
  {
    id: "landmark-sheriff-station",
    type: "health",
    name: "Compton Sheriff Station",
    latitude: 33.9041,
    longitude: -118.2215,
    metadata: { address: "301 S Willowbrook Ave, Compton, CA 90220", category: "Emergency", description: "LA County Sheriff's Department — Compton Station" },
  },
  {
    id: "landmark-surrounded-mural",
    type: "mural",
    name: "Compton Cowboys Mural",
    latitude: 33.8908,
    longitude: -118.2268,
    metadata: { address: "Richland Farms area", category: "Art", description: "Mural celebrating the Compton Cowboys horseback riding tradition" },
  },
  {
    id: "landmark-artesia-transit",
    type: "transit",
    name: "Artesia Transit Center",
    latitude: 33.8756,
    longitude: -118.2266,
    metadata: { address: "Artesia Blvd & Pioneer Blvd", category: "Transit", description: "Metro bus transit hub" },
  },
];

export default function MapExplorer({ initialPoints }: MapExplorerProps) {
  const [search, setSearch] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [geocodeResults, setGeocodeResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-118.2201, 33.8958]);
  const [mapZoom, setMapZoom] = useState(13);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Merge DB points with landmark seed data (de-duplicate by proximity)
  const allPoints = useMemo(() => {
    const combined = [...initialPoints];
    // Add landmarks only when DB has very few points (fallback for empty DB)
    if (initialPoints.length < 10) {
      for (const lm of COMPTON_LANDMARKS) {
        // Skip if a DB point is within ~100m
        const isDuplicate = initialPoints.some(
          (p) =>
            Math.abs(p.latitude - lm.latitude) < 0.001 &&
            Math.abs(p.longitude - lm.longitude) < 0.001
        );
        if (!isDuplicate) combined.push(lm);
      }
    }
    return combined;
  }, [initialPoints]);

  // Available types from all points
  const availableTypes = useMemo(() => {
    const types = new Set<PointType>();
    allPoints.forEach((p) => types.add(p.type));
    return Array.from(types).sort();
  }, [allPoints]);

  const [enabledTypes, setEnabledTypes] = useState<Set<PointType>>(
    () => new Set(availableTypes)
  );

  // Update enabled types when available types change
  useEffect(() => {
    setEnabledTypes(new Set(availableTypes));
  }, [availableTypes]);

  const toggleType = useCallback((type: PointType) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  // Filter points by enabled types and name search
  const filteredPoints = useMemo(() => {
    let pts = allPoints.filter((p) => enabledTypes.has(p.type));
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
  }, [allPoints, enabledTypes, search]);

  // Debounced geocoding search
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!search.trim() || search.trim().length < 2) {
      setGeocodeResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await geocodeSearch(search, 5);
      setGeocodeResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 400);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [search]);

  // Close results when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePointClick = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    setShowResults(false);
  }, []);

  // When user selects a geocode result, fly to it and drop a temporary pin
  const handleGeocodeSelect = useCallback((result: GeocodingResult) => {
    const point: MapPoint = {
      id: `geocode-${result.id}`,
      type: "business",
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      color: "#F2A900",
      metadata: {
        address: result.fullAddress,
        category: result.category || result.type,
        description: `Found via search: ${result.fullAddress}`,
      },
    };
    setSelectedPoint(point);
    setMapCenter([result.longitude, result.latitude]);
    setMapZoom(16);
    setShowResults(false);
    setSearch(result.name);
  }, []);

  // Quick-select a point from the local results list
  const handleLocalResultSelect = useCallback((point: MapPoint) => {
    setSelectedPoint(point);
    setMapCenter([point.longitude, point.latitude]);
    setMapZoom(16);
    setShowResults(false);
    setSearch(point.name);
  }, []);

  return (
    <div
      className="relative w-full"
      style={{ height: "calc(100dvh - 72px - 80px)" }}
    >
      {/* Search bar */}
      <div className="absolute top-3 left-3 right-14 z-20" ref={searchContainerRef}>
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-txt-secondary"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
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
            onChange={(e) => {
              setSearch(e.target.value);
              if (e.target.value.trim()) setShowResults(true);
            }}
            onFocus={() => {
              if (search.trim()) setShowResults(true);
            }}
            placeholder="Search places, addresses, businesses..."
            className="w-full pl-9 pr-10 py-2.5 bg-deep/95 backdrop-blur-lg border border-border-subtle rounded-xl text-sm text-txt-primary placeholder:text-muted-gray focus:outline-none focus:border-gold/30 transition-colors"
          />
          {/* Clear button */}
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setGeocodeResults([]);
                setShowResults(false);
                setSelectedPoint(null);
                setMapCenter([-118.2201, 33.8958]);
                setMapZoom(13);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path
                  d="M1 1l8 8M9 1L1 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}

          {/* Loading indicator */}
          {isSearching && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Search results dropdown */}
        {showResults && (filteredPoints.length > 0 || geocodeResults.length > 0) && (
          <div className="mt-1.5 bg-deep/98 backdrop-blur-lg border border-border-subtle rounded-xl shadow-2xl max-h-[60vh] overflow-y-auto">
            {/* Local matches */}
            {filteredPoints.length > 0 && (
              <div>
                <div className="px-3 pt-2.5 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary">
                    On the Map ({filteredPoints.length})
                  </p>
                </div>
                {filteredPoints.slice(0, 8).map((point) => (
                  <button
                    key={point.id}
                    onClick={() => handleLocalResultSelect(point)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span
                      className="shrink-0 w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          point.color || MAP_POINT_COLORS[point.type],
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-txt-primary font-medium truncate">
                        {point.name}
                      </p>
                      {typeof point.metadata?.address === "string" && (
                        <p className="text-xs text-txt-secondary truncate">
                          {point.metadata.address}
                        </p>
                      )}
                    </div>
                    <span
                      className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase"
                      style={{
                        color: MAP_POINT_COLORS[point.type],
                        backgroundColor: `${MAP_POINT_COLORS[point.type]}15`,
                      }}
                    >
                      {MAP_POINT_LABELS[point.type]}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Geocode results */}
            {geocodeResults.length > 0 && (
              <div>
                {filteredPoints.length > 0 && (
                  <div className="mx-3 border-t border-border-subtle" />
                )}
                <div className="px-3 pt-2.5 pb-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-txt-secondary">
                    Nearby Places
                  </p>
                </div>
                {geocodeResults.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleGeocodeSelect(result)}
                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-gold/10">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="text-gold"
                      >
                        <path
                          d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5z"
                          fill="currentColor"
                          opacity="0.2"
                        />
                        <path
                          d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.5 4.5 8.5 4.5 8.5s4.5-5 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                        />
                        <circle
                          cx="8"
                          cy="6"
                          r="1.5"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-txt-primary font-medium truncate">
                        {result.name}
                      </p>
                      <p className="text-xs text-txt-secondary truncate">
                        {result.fullAddress}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty search state */}
        {showResults &&
          search.trim().length >= 2 &&
          !isSearching &&
          filteredPoints.length === 0 &&
          geocodeResults.length === 0 && (
            <div className="mt-1.5 bg-deep/98 backdrop-blur-lg border border-border-subtle rounded-xl shadow-2xl p-4 text-center">
              <p className="text-sm text-txt-secondary">
                No results for &ldquo;{search}&rdquo;
              </p>
              <p className="text-xs text-muted-gray mt-1">
                Try a different search term or address
              </p>
            </div>
          )}
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

          {/* Point count */}
          <div className="mt-2 pt-2 border-t border-border-subtle">
            <p className="text-[10px] text-txt-secondary">
              {filteredPoints.length} places visible
            </p>
          </div>
        </div>
      )}

      {/* Map */}
      <MapView
        points={filteredPoints}
        center={mapCenter}
        zoom={mapZoom}
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

      {/* Bottom info pill — shown when no point is selected */}
      {!selectedPoint && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-deep/90 backdrop-blur-lg border border-border-subtle rounded-full px-4 py-2 shadow-xl">
          <p className="text-xs text-txt-secondary whitespace-nowrap">
            <span className="text-gold font-semibold">{filteredPoints.length}</span>{" "}
            places in Compton · Tap to explore
          </p>
        </div>
      )}
    </div>
  );
}
