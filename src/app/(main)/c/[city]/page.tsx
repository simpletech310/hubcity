import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getCityBySlug } from "@/lib/cities";

/**
 * City entry point. /c/:city sets the active-city cookie and bounces to the
 * home feed, which reads the cookie (via src/lib/current-city helpers) to
 * scope content. This avoids forking the entire public tree under /c/[city]
 * immediately — the tree can migrate page-by-page in a follow-on PR.
 */
export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = await getCityBySlug(slug);
  if (!city || city.launch_status === "hidden") notFound();

  if (city.launch_status === "coming_soon") {
    redirect(`/choose-city?pending=${city.slug}`);
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

  redirect("/");
}
