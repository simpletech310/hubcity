import { NextResponse, type NextRequest } from "next/server";
import { getCityBySlug } from "@/lib/cities";
import {
  ACTIVE_CITY_COOKIE,
  LEGACY_ACTIVE_CITY_COOKIE,
} from "@/lib/city-context";

/**
 * Catch-all under /c/[city]/* — sets the active-city cookie based on the URL
 * slug, then 308-redirects to the root-level section. The root pages remain
 * the canonical render targets and pick the city up from the cookie.
 *
 * This is a Route Handler (not a page) because writing cookies from a Server
 * Component is disallowed in Next.js 15+. Route Handlers can set cookies on
 * the response.
 */

const ALLOWED_TOP_SECTIONS = new Set([
  "culture",
  "events",
  "food",
  "business",
  "jobs",
  "groups",
  "people",
  "health",
  "resources",
  "live",
  "city-hall",
  "city-data",
  "schools",
  "parks",
  "officials",
  "podcasts",
  "pulse",
  "map",
  "art",
  "reels",
  "district",
  "council",
  "trustee",
]);

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string; section: string[] }> }
) {
  const { city: slug, section } = await params;

  const city = await getCityBySlug(slug);
  if (!city) {
    return NextResponse.redirect(new URL("/choose-city", request.url));
  }

  if (city.launch_status !== "live") {
    return NextResponse.redirect(
      new URL(
        `/choose-city?pending=${encodeURIComponent(city.name)}`,
        request.url
      )
    );
  }

  const top = section[0];
  if (!top || !ALLOWED_TOP_SECTIONS.has(top)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const target = "/" + section.join("/");
  const response = NextResponse.redirect(new URL(target, request.url));

  const cookieOpts = {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };
  response.cookies.set(ACTIVE_CITY_COOKIE, city.slug, cookieOpts);
  response.cookies.set(LEGACY_ACTIVE_CITY_COOKIE, city.slug, cookieOpts);

  return response;
}
