"use client";

import { useState, useCallback } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
import {
  DISTRICT_BOUNDARIES,
  COMPTON_CENTER,
  districtToGeoJSON,
  getDistrictBoundary,
} from "@/lib/district-boundaries";
import type { DistrictBoundary } from "@/lib/district-boundaries";
import Skeleton from "@/components/ui/Skeleton";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface DistrictMapProps {
  /** If provided, highlights just this district. Otherwise shows all 4. */
  district?: number | null;
  height?: string;
  className?: string;
}

export default function DistrictMap({
  district,
  height = "200px",
  className = "",
}: DistrictMapProps) {
  const [loaded, setLoaded] = useState(false);
  const handleLoad = useCallback(() => setLoaded(true), []);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-deep border border-border-subtle rounded-2xl ${className}`}
        style={{ height }}
      >
        <p className="text-txt-secondary text-sm">Map unavailable</p>
      </div>
    );
  }

  // Determine which districts to show and map center/zoom
  const singleDistrict = district ? getDistrictBoundary(district) : null;
  const districts = singleDistrict ? [singleDistrict] : DISTRICT_BOUNDARIES;
  const center = singleDistrict ? singleDistrict.center : COMPTON_CENTER;
  const zoom = singleDistrict ? 13.2 : 12.5;

  const geojson = districtToGeoJSON(districts);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {!loaded && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}

      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={handleLoad}
        reuseMaps
        interactive={true}
        scrollZoom={false}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="districts" type="geojson" data={geojson}>
          {/* Fill layer */}
          <Layer
            id="district-fill"
            type="fill"
            paint={{
              "fill-color": ["get", "color"],
              "fill-opacity": 0.15,
            }}
          />
          {/* Stroke layer */}
          <Layer
            id="district-stroke"
            type="line"
            paint={{
              "line-color": ["get", "color"],
              "line-width": 2.5,
              "line-opacity": 0.8,
            }}
          />
          {/* District labels */}
          <Layer
            id="district-labels"
            type="symbol"
            layout={{
              "text-field": ["get", "name"],
              "text-size": 12,
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
              "text-allow-overlap": true,
            }}
            paint={{
              "text-color": ["get", "color"],
              "text-halo-color": "rgba(10, 10, 15, 0.8)",
              "text-halo-width": 1.5,
            }}
          />
        </Source>
      </Map>
    </div>
  );
}
