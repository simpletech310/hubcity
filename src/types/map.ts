export interface MapPoint {
  id: string;
  type:
    | "business"
    | "event"
    | "issue"
    | "health"
    | "school"
    | "transit"
    | "park"
    | "mural";
  name: string;
  latitude: number;
  longitude: number;
  color?: string;
  icon?: string;
  metadata?: Record<string, unknown>;
}

export const MAP_POINT_COLORS: Record<MapPoint["type"], string> = {
  business: "#F2A900", // gold
  event: "#22C55E", // emerald
  issue: "#FF6B6B", // coral
  health: "#06B6D4", // cyan
  school: "#3B82F6", // blue
  transit: "#8B5CF6", // purple
  park: "#16A34A", // green
  mural: "#FF006E", // pink
};

export const MAP_POINT_LABELS: Record<MapPoint["type"], string> = {
  business: "Businesses",
  event: "Events",
  issue: "Issues",
  health: "Health",
  school: "Schools",
  transit: "Transit",
  park: "Parks",
  mural: "Murals",
};
