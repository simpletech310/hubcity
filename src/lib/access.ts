import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { isEnabled, CIVIC_ROUTE_PREFIXES } from "@/lib/feature-flags";

export type AccessMode = "anonymous" | "unverified" | "verified";

/**
 * Sections a user can access. "Base" sections are always visible (filtered to
 * the active city). "Overlay" sections are community perks visible to verified
 * users in their home city. Civic sections are hidden when civic_enabled=false.
 */
export type Section =
  // Base
  | "events"
  | "food"
  | "business"
  | "health"
  | "resources"
  | "culture"
  | "jobs"
  | "groups"
  | "people"
  | "hubtv"
  // Community benefit overlays (verified users, home city only)
  | "resident_discounts"
  | "resident_job_priority"
  | "verified_groups"
  // Civic sections (gated behind civic_enabled feature flag)
  | "district"
  | "council"
  | "trustee"
  | "district_programs"
  | "civic_reporting";

const BASE_SECTIONS: ReadonlySet<Section> = new Set([
  "events",
  "food",
  "business",
  "health",
  "resources",
  "culture",
  "jobs",
  "groups",
  "people",
  "hubtv",
]);

/** Community perk overlays — require verified + home city match. */
const COMMUNITY_OVERLAY_SECTIONS: ReadonlySet<Section> = new Set([
  "resident_discounts",
  "resident_job_priority",
  "verified_groups",
]);

/** Civic sections — additionally gated behind the civic_enabled feature flag. */
const CIVIC_SECTIONS: ReadonlySet<Section> = new Set([
  "district",
  "council",
  "trustee",
  "district_programs",
  "civic_reporting",
]);

/**
 * Kept for backwards-compat: any code that imported OVERLAY_SECTIONS still
 * gets a valid set. It now covers only the community benefit overlays.
 * @deprecated Prefer COMMUNITY_OVERLAY_SECTIONS or CIVIC_SECTIONS directly.
 */
export const OVERLAY_SECTIONS: ReadonlySet<Section> = COMMUNITY_OVERLAY_SECTIONS;

/**
 * Routes requiring verified membership (community perk routes only).
 * Civic routes are handled separately via CIVIC_ROUTE_PREFIXES + feature flag.
 */
export const VERIFIED_ONLY_PREFIXES: ReadonlyArray<string> = [
  "/resident-discounts",
];

// Re-export so consumers can import from one place if preferred.
export { CIVIC_ROUTE_PREFIXES };

export type Access = {
  mode: AccessMode;
  userId: string | null;
  homeCityId: string | null;
  followedCityIds: string[];
};

/**
 * Read access state from the server session. Intended for use in server
 * components and route handlers.
 */
export async function getAccess(): Promise<Access> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { mode: "anonymous", userId: null, homeCityId: null, followedCityIds: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("verification_status,city_id")
    .eq("id", user.id)
    .maybeSingle();

  const { data: follows } = await supabase
    .from("user_cities")
    .select("city_id, role")
    .eq("user_id", user.id);

  const homeRow = follows?.find((r) => r.role === "home");
  const followedCityIds =
    follows
      ?.filter((r) => r.role === "follower")
      .map((r) => r.city_id as string) ?? [];

  const mode: AccessMode =
    profile?.verification_status === "verified" ? "verified" : "unverified";

  return {
    mode,
    userId: user.id,
    homeCityId: (homeRow?.city_id as string | undefined) ?? profile?.city_id ?? null,
    followedCityIds,
  };
}

/**
 * Can the user see a given section in a given city?
 *
 * Rules:
 * - Base sections: always visible.
 * - Community overlay sections: verified users in their home city only.
 * - Civic sections: hidden entirely when civic_enabled=false; when enabled,
 *   also require verified + home city match.
 */
export function canSee(
  section: Section,
  mode: AccessMode,
  cityId: string | null,
  homeCityId: string | null
): boolean {
  if (BASE_SECTIONS.has(section)) return true;

  if (CIVIC_SECTIONS.has(section)) {
    if (!isEnabled("civic_enabled")) return false;
    // When civic is enabled, treat same as verified overlay
    if (mode !== "verified") return false;
    if (!cityId) return false;
    return cityId === homeCityId;
  }

  if (COMMUNITY_OVERLAY_SECTIONS.has(section)) {
    if (mode !== "verified") return false;
    if (!cityId) return false;
    return cityId === homeCityId;
  }

  return false;
}

/**
 * API-route guard. Returns null if the caller is a verified member,
 * otherwise a NextResponse to short-circuit the request with 403.
 */
export async function requireVerified(): Promise<NextResponse | null> {
  const { mode } = await getAccess();
  if (mode === "verified") return null;
  return NextResponse.json(
    { error: "Verified membership required" },
    { status: 403 }
  );
}

/**
 * Server-component guard. Redirects unverified users to /claim-your-city,
 * preserving the target path as a `next` query param.
 * Never returns if the user is not verified.
 */
export async function requireVerifiedServerRedirect(nextPath: string): Promise<void> {
  const { mode } = await getAccess();
  if (mode === "verified") return;
  const target = `/claim-your-city?next=${encodeURIComponent(nextPath)}`;
  redirect(target);
}
