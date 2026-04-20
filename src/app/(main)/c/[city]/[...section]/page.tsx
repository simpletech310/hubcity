import { notFound, redirect } from "next/navigation";
import { getCityBySlug } from "@/lib/cities";
import { setActiveCityCookie } from "@/lib/city-context";

/**
 * Catch-all under /c/[city]/* — sets the active-city cookie based on the URL
 * slug, then 301-redirects to the root-level section. The root pages remain
 * the canonical render targets and pick the city up from the cookie.
 *
 * This means /c/compton/events, /c/inglewood/food, etc. all "just work"
 * without duplicating page components.
 *
 * Allowed top-level sections are enumerated to prevent open-redirect
 * abuse via crafted catch-all paths.
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
  // Verified-only overlays — middleware enforces access at the canonical
  // root path after the redirect.
  "district",
  "council",
  "trustee",
]);

type PageProps = {
  params: Promise<{ city: string; section: string[] }>;
};

export default async function CitySectionPage({ params }: PageProps) {
  const { city: slug, section } = await params;
  const city = await getCityBySlug(slug);

  if (!city) notFound();

  if (city.launch_status !== "live") {
    redirect(`/choose-city?pending=${encodeURIComponent(city.name)}`);
  }

  const top = section[0];
  if (!top || !ALLOWED_TOP_SECTIONS.has(top)) notFound();

  await setActiveCityCookie(city.slug);

  // Reconstruct the root path: ["events", "123"] → "/events/123"
  const target = "/" + section.join("/");
  redirect(target);
}
