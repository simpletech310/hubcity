"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  GeolocateControl,
  Source,
  Layer,
} from "react-map-gl/mapbox";
import type { MapRef } from "react-map-gl/mapbox";
// mapbox-gl CSS loaded via globals.css or link tag
import type { MapPoint } from "@/types/map";
import { MAP_POINT_COLORS } from "@/types/map";
import Skeleton from "@/components/ui/Skeleton";

interface MapViewProps {
  points?: MapPoint[];
  center?: [number, number];
  zoom?: number;
  height?: string;
  showUserLocation?: boolean;
  onPointClick?: (point: MapPoint) => void;
  className?: string;
  children?: React.ReactNode;
}

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const COMPTON_CENTER: [number, number] = [-118.2201, 33.8958];
const CLUSTER_RADIUS = 50;
const CLUSTER_MAX_ZOOM = 14;

function pointsToGeoJSON(points: MapPoint[]) {
  return {
    type: "FeatureCollection" as const,
    features: points.map((p) => ({
      type: "Feature" as const,
      properties: {
        id: p.id,
        type: p.type,
        name: p.name,
        color: p.color || MAP_POINT_COLORS[p.type] || "#F2A900",
        metadata: JSON.stringify(p.metadata || {}),
      },
      geometry: {
        type: "Point" as const,
        coordinates: [p.longitude, p.latitude],
      },
    })),
  };
}

export default function MapView({
  points = [],
  center = COMPTON_CENTER,
  zoom = 13,
  height = "100%",
  showUserLocation = true,
  onPointClick,
  className = "",
  children,
}: MapViewProps) {
  const mapRef = useRef<MapRef>(null);
  const [loaded, setLoaded] = useState(false);
  const [popupPoint, setPopupPoint] = useState<MapPoint | null>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
  }, []);

  // Fly to new center/zoom when props change
  const prevCenter = useRef(center);
  const prevZoom = useRef(zoom);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    if (
      prevCenter.current[0] !== center[0] ||
      prevCenter.current[1] !== center[1] ||
      prevZoom.current !== zoom
    ) {
      map.flyTo({
        center: [center[0], center[1]],
        zoom,
        duration: 1200,
      });
      prevCenter.current = center;
      prevZoom.current = zoom;
    }
  }, [center, zoom, loaded]);

  const handleMarkerClick = useCallback(
    (point: MapPoint) => {
      setPopupPoint(point);
      onPointClick?.(point);
    },
    [onPointClick]
  );

  // Handle cluster click to zoom in
  const handleClusterClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["cluster-circles"],
      });
      if (!features.length) return;

      const feature = features[0];
      const clusterId = feature.properties?.cluster_id;
      const source = map.getSource("points") as mapboxgl.GeoJSONSource;

      source.getClusterExpansionZoom(clusterId, (err: unknown, zoomLevel: number | null | undefined) => {
        if (err || zoomLevel == null) return;
        const geometry = feature.geometry as GeoJSON.Point;
        map.easeTo({
          center: geometry.coordinates as [number, number],
          zoom: zoomLevel,
        });
      });
    },
    []
  );

  // Handle unclustered point click
  const handleUnclusteredClick = useCallback(
    (e: mapboxgl.MapMouseEvent) => {
      const map = mapRef.current;
      if (!map) return;

      const features = map.queryRenderedFeatures(e.point, {
        layers: ["unclustered-points"],
      });
      if (!features.length) return;

      const props = features[0].properties;
      if (!props) return;

      const geometry = features[0].geometry as GeoJSON.Point;
      const point: MapPoint = {
        id: props.id,
        type: props.type,
        name: props.name,
        latitude: geometry.coordinates[1],
        longitude: geometry.coordinates[0],
        color: props.color,
        metadata: props.metadata ? JSON.parse(props.metadata) : {},
      };

      setPopupPoint(point);
      onPointClick?.(point);
    },
    [onPointClick]
  );

  // Attach layer click handlers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;

    map.on("click", "cluster-circles", handleClusterClick);
    map.on("click", "unclustered-points", handleUnclusteredClick);

    map.on("mouseenter", "cluster-circles", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "cluster-circles", () => {
      map.getCanvas().style.cursor = "";
    });
    map.on("mouseenter", "unclustered-points", () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", "unclustered-points", () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.off("click", "cluster-circles", handleClusterClick);
      map.off("click", "unclustered-points", handleUnclusteredClick);
    };
  }, [loaded, handleClusterClick, handleUnclusteredClick]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={`flex items-center justify-center bg-deep border border-border-subtle rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-6">
          <p className="text-txt-secondary text-sm">
            Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN not configured.
          </p>
        </div>
      </div>
    );
  }

  const geojson = pointsToGeoJSON(points);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      {!loaded && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-none" />
        </div>
      )}

      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{
          longitude: center[0],
          latitude: center[1],
          zoom,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={handleLoad}
        reuseMaps
      >
        <NavigationControl position="top-left" showCompass={false} />

        {showUserLocation && (
          <GeolocateControl
            position="bottom-right"
            trackUserLocation
            showUserHeading
            style={{
              background: "#111116",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        )}

        {/* Clustered source */}
        <Source
          id="points"
          type="geojson"
          data={geojson}
          cluster
          clusterRadius={CLUSTER_RADIUS}
          clusterMaxZoom={CLUSTER_MAX_ZOOM}
        >
          {/* Cluster circles */}
          <Layer
            id="cluster-circles"
            type="circle"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": "#F2A900",
              "circle-opacity": 0.85,
              "circle-radius": [
                "step",
                ["get", "point_count"],
                18,
                10,
                24,
                50,
                32,
              ],
              "circle-stroke-width": 2,
              "circle-stroke-color": "rgba(242, 169, 0, 0.3)",
            }}
          />

          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={["has", "point_count"]}
            layout={{
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": 13,
              "text-font": ["DIN Pro Medium", "Arial Unicode MS Bold"],
            }}
            paint={{
              "text-color": "#0A0A0A",
            }}
          />

          {/* Unclustered points */}
          <Layer
            id="unclustered-points"
            type="circle"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": 7,
              "circle-stroke-width": 2,
              "circle-stroke-color": "rgba(255, 255, 255, 0.15)",
            }}
          />
        </Source>

        {/* Popup */}
        {popupPoint && (
          <Popup
            longitude={popupPoint.longitude}
            latitude={popupPoint.latitude}
            anchor="bottom"
            onClose={() => setPopupPoint(null)}
            closeButton={false}
            className="map-popup"
          >
            <div className="bg-deep border border-border-subtle rounded-xl p-3 min-w-[160px] shadow-xl">
              <p className="text-txt-primary text-sm font-semibold font-heading leading-tight">
                {popupPoint.name}
              </p>
              <span
                className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide"
                style={{
                  backgroundColor: `${MAP_POINT_COLORS[popupPoint.type]}20`,
                  color: MAP_POINT_COLORS[popupPoint.type],
                  border: `1px solid ${MAP_POINT_COLORS[popupPoint.type]}33`,
                }}
              >
                {popupPoint.type}
              </span>
            </div>
          </Popup>
        )}

        {children}
      </Map>
    </div>
  );
}
