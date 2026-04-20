import { notFound, redirect } from "next/navigation";
import { getCityBySlug } from "@/lib/cities";
import { setActiveCityCookie } from "@/lib/city-context";

/**
 * Per-city home. Sets the active-city cookie based on the URL slug, then
 * redirects to `/` so the cookie-driven home page renders with the new
 * city's content.
 *
 * Unknown slug → 404. Coming-soon slug → redirect to /choose-city with a
 * helpful banner.
 *
 * The optional `?then=` query lets QR codes / SMS links deep-link to any
 * section after switching cities (e.g. `/c/compton?then=/events`).
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

export default async function CityLandingPage({
  params,
  searchParams,
}: PageProps) {
  const [{ city: slug }, { then }] = await Promise.all([params, searchParams]);
  const city = await getCityBySlug(slug);

  if (!city) notFound();

  if (city.launch_status !== "live") {
    redirect(`/choose-city?pending=${encodeURIComponent(city.name)}`);
  }

  await setActiveCityCookie(city.slug);
  redirect(safeThen(then));
}
