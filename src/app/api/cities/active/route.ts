import { NextResponse } from "next/server";
import { setActiveCityCookie, clearActiveCityCookie } from "@/lib/city-context";
import { getCityBySlug } from "@/lib/cities";

/**
 * Change the active city for the current browser. Called by the CityPicker
 * component. The picker reloads the page on success so RSCs refetch with
 * the new cookie applied.
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    slug?: string;
  } | null;

  const slug = body?.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }

  const city = await getCityBySlug(slug);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 404 });
  }
  if (city.launch_status !== "live") {
    return NextResponse.json(
      { error: "City is not yet live", status: city.launch_status },
      { status: 400 }
    );
  }

  await setActiveCityCookie(city.slug);

  return NextResponse.json({
    ok: true,
    city: { id: city.id, slug: city.slug, name: city.name, state: city.state },
  });
}

export async function DELETE() {
  await clearActiveCityCookie();
  return NextResponse.json({ ok: true });
}
