import { NextResponse, type NextRequest } from "next/server";
import { getCityBySlug } from "@/lib/cities";
import {
  ACTIVE_CITY_COOKIE,
  LEGACY_ACTIVE_CITY_COOKIE,
} from "@/lib/city-context";

/**
 * Per-city home. Sets the active-city cookie based on the URL slug, then
 * redirects to `/` (or to `?then=/path` if provided) so the cookie-driven
 * home page renders with the new city's content.
 *
 * Route Handler rather than page: writing cookies from a Server Component
 * is disallowed in Next.js 15+.
 */

function safeThen(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw.split("#")[0];
}

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ city: string }> }
) {
  const { city: slug } = await params;
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

  const then = new URL(request.url).searchParams.get("then");
  const response = NextResponse.redirect(new URL(safeThen(then), request.url));

  const cookieOpts = {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax" as const,
  };
  response.cookies.set(ACTIVE_CITY_COOKIE, city.slug, cookieOpts);
  response.cookies.set(LEGACY_ACTIVE_CITY_COOKIE, city.slug, cookieOpts);

  return response;
}
