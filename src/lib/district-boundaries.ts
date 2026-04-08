/**
 * Approximate GeoJSON boundaries for Compton's 4 council districts.
 * Compton city bounds: roughly -118.265 to -118.185 (lng), 33.860 to 33.930 (lat)
 * Divided into quadrants: NW(D1), NE(D2), SE(D3), SW(D4)
 * Center: 33.8958, -118.2201
 */

export interface DistrictBoundary {
  district: number;
  name: string;
  area: string;
  color: string;
  center: [number, number]; // [lng, lat]
  polygon: [number, number][]; // [[lng, lat], ...]
}

export const DISTRICT_BOUNDARIES: DistrictBoundary[] = [
  {
    district: 1,
    name: "District 1",
    area: "Northwest Compton",
    color: "#3B82F6",
    center: [-118.2401, 33.9100],
    polygon: [
      [-118.2650, 33.8958],
      [-118.2650, 33.9300],
      [-118.2201, 33.9300],
      [-118.2201, 33.8958],
      [-118.2650, 33.8958],
    ],
  },
  {
    district: 2,
    name: "District 2",
    area: "Northeast Compton",
    color: "#8B5CF6",
    center: [-118.2001, 33.9100],
    polygon: [
      [-118.2201, 33.8958],
      [-118.2201, 33.9300],
      [-118.1850, 33.9300],
      [-118.1850, 33.8958],
      [-118.2201, 33.8958],
    ],
  },
  {
    district: 3,
    name: "District 3",
    area: "Southeast Compton",
    color: "#22C55E",
    center: [-118.2001, 33.8800],
    polygon: [
      [-118.2201, 33.8600],
      [-118.2201, 33.8958],
      [-118.1850, 33.8958],
      [-118.1850, 33.8600],
      [-118.2201, 33.8600],
    ],
  },
  {
    district: 4,
    name: "District 4",
    area: "Southwest Compton",
    color: "#F2A900",
    center: [-118.2401, 33.8800],
    polygon: [
      [-118.2650, 33.8600],
      [-118.2650, 33.8958],
      [-118.2201, 33.8958],
      [-118.2201, 33.8600],
      [-118.2650, 33.8600],
    ],
  },
];

export const COMPTON_CENTER: [number, number] = [-118.2201, 33.8958];

export function getDistrictBoundary(district: number): DistrictBoundary | undefined {
  return DISTRICT_BOUNDARIES.find((d) => d.district === district);
}

export function districtToGeoJSON(districts: DistrictBoundary[]) {
  return {
    type: "FeatureCollection" as const,
    features: districts.map((d) => ({
      type: "Feature" as const,
      properties: {
        district: d.district,
        name: d.name,
        area: d.area,
        color: d.color,
      },
      geometry: {
        type: "Polygon" as const,
        coordinates: [d.polygon],
      },
    })),
  };
}
