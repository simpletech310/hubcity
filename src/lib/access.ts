import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

export type AccessMode = "anonymous" | "unverified" | "verified";

/**
 * Sections a user can access. "Base" sections are always visible (filtered to
 * the active city). "Overlay" sections require a verified home city and only
 * show for the user's home city.
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
  // Verified-only overlays
  | "district"
  | "council"
  | "trustee"
  | "resident_discounts"
  | "resident_job_priority"
  | "verified_groups"
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

const OVERLAY_SECTIONS: ReadonlySet<Section> = new Set([
  "district",
  "council",
  "trustee",
  "resident_discounts",
  "resident_job_priority",
  "verified_groups",
  "district_programs",
  "civic_reporting",
]);

/** Middleware checks this prefix list. Keep in sync with OVERLAY_SECTIONS. */
export const VERIFIED_ONLY_PREFIXES: ReadonlyArray<string> = [
  "/district",
  "/council",
  "/trustee",
  "/resident-discounts",
];

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
 * - Base sections: always visible (filtered to the city in question).
 * - Overlay sections: only visible to verified users AND only for their
 *   home city.
 */
export function canSee(
  section: Section,
  mode: AccessMode,
  cityId: string | null,
  homeCityId: string | null
): boolean {
  if (BASE_SECTIONS.has(section)) return true;
  if (!OVERLAY_SECTIONS.has(section)) return false;
  if (mode !== "verified") return false;
  if (!cityId) return false;
  return cityId === homeCityId;
}

/**
 * API-route guard. Returns null if the caller is a verified resident,
 * otherwise a NextResponse to short-circuit the request with 403.
 */
export async function requireVerified(): Promise<NextResponse | null> {
  const { mode } = await getAccess();
  if (mode === "verified") return null;
  return NextResponse.json(
    { error: "Verified residency required" },
    { status: 403 }
  );
}

/**
 * Server-component guard. Call from within a server component / server action
 * to redirect unverified users to /verify-address, preserving the target path
 * as a `next` query param. Never returns if the user is not verified.
 */
export async function requireVerifiedServerRedirect(nextPath: string): Promise<void> {
  const { mode } = await getAccess();
  if (mode === "verified") return;
  const target = `/verify-address?next=${encodeURIComponent(nextPath)}`;
  redirect(target);
}
