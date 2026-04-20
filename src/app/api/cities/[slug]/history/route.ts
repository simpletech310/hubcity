import { NextResponse } from "next/server";
import { getCityBySlug } from "@/lib/cities";
import { loadCityHistory } from "@/lib/city-history";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const city = await getCityBySlug(slug);
  if (!city) {
    return NextResponse.json({ error: "Unknown city" }, { status: 404 });
  }
  const history = await loadCityHistory(city.id);
  return NextResponse.json({ history });
}
