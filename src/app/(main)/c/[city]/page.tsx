import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCityBySlug } from "@/lib/cities";

/**
 * City entry point. /c/:city sets the active-city cookie and bounces to the
 * ?then= path (or /) so the feed scopes to this city on every subsequent
 * request. This avoids forking the entire public tree under /c/[city]
 * immediately — individual pages can migrate under /c/[city]/ over time.
 *
 * Valid `then` values: same-origin absolute paths only (must start with "/"
 * and not "//"). Invalid values fall back to "/".
 */
type PageProps = {
  params: Promise<{ city: string }>;
  searchParams: Promise<{ then?: string }>;
};

function safeThen(raw: string | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw.split("#")[0];
}

export default async function CityLandingPage({ params, searchParams }: PageProps) {
  const { city: slug } = await params;
  const { then } = await searchParams;
  const city = await getCityBySlug(slug);
  if (!city || city.launch_status === "hidden") notFound();

  if (city.launch_status === "coming_soon") {
    redirect(
      `/choose-city?pending=${encodeURIComponent(city.name)}${
        then ? `&next=${encodeURIComponent(then)}` : ""
      }`
    );
  }

  const jar = await cookies();
  jar.set("active_city", city.slug, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });
  jar.set("active_city_id", city.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  redirect(safeThen(then));
}
