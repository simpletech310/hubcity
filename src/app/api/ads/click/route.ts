import { NextResponse } from "next/server";
import { recordClick } from "@/lib/kevel";

// POST /api/ads/click — fire and forget click tracking
export async function POST(request: Request) {
  try {
    const { impression_id } = await request.json();

    if (!impression_id) {
      return NextResponse.json(
        { error: "impression_id is required" },
        { status: 400 }
      );
    }

    // Fire and forget - don't await
    recordClick(impression_id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Ad click error:", error);
    return NextResponse.json(
      { error: "Failed to record click" },
      { status: 500 }
    );
  }
}
