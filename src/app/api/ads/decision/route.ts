import { NextRequest, NextResponse } from "next/server";
import { getAdDecision, isValidAdZone } from "@/lib/kevel";
import type { AdZone, KevelDecision } from "@/lib/kevel";

/**
 * Map a KevelDecision (camelCase, server-side) into the AdDecision shape
 * (snake_case) that all client components expect.
 */
function mapToAdDecision(d: KevelDecision) {
  return {
    id: String(d.creativeId || d.adId || 0),
    business_name: d.title || "Sponsored",
    headline: d.title || "",
    body_text: d.contents?.[0]?.body || undefined,
    image_url: d.imageUrl || undefined,
    audio_url: d.audioUrl || undefined,
    video_url: d.videoUrl || undefined,
    cta_text: d.ctaText || "Learn More",
    cta_url: d.clickUrl || "",
    duration: d.duration || 15,
    impression_url: d.impressionUrl || "",
    click_url: d.clickUrl || "",
  };
}

// GET /api/ads/decision — get an ad decision (public, no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const zone = searchParams.get("zone") || "";
    const contentId = searchParams.get("contentId") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const district = searchParams.get("district")
      ? parseInt(searchParams.get("district")!)
      : undefined;

    if (!zone || !isValidAdZone(zone)) {
      return NextResponse.json(
        { error: "Invalid or missing ad zone" },
        { status: 400 }
      );
    }

    const decision = await getAdDecision({
      zone: zone as AdZone,
      userId,
      district,
      contentId,
    });

    if (!decision) {
      return NextResponse.json({ ad: null });
    }

    return NextResponse.json({ ad: mapToAdDecision(decision) });
  } catch (error) {
    console.error("Ad decision error:", error);
    return NextResponse.json(
      { error: "Failed to get ad decision" },
      { status: 500 }
    );
  }
}

// POST /api/ads/decision — alternative for richer payloads
export async function POST(request: Request) {
  try {
    const { zone, userId, keywords, district, contentId } = await request.json();

    if (!zone || !isValidAdZone(zone)) {
      return NextResponse.json(
        { error: "Invalid or missing ad zone" },
        { status: 400 }
      );
    }

    const decision = await getAdDecision({
      zone: zone as AdZone,
      userId: userId || undefined,
      keywords: keywords || undefined,
      district: district || undefined,
      contentId: contentId || undefined,
    });

    if (!decision) {
      return NextResponse.json({ ad: null });
    }

    return NextResponse.json({ ad: mapToAdDecision(decision) });
  } catch (error) {
    console.error("Ad decision error:", error);
    return NextResponse.json(
      { error: "Failed to get ad decision" },
      { status: 500 }
    );
  }
}
