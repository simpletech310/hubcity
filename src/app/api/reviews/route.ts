import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const businessId = searchParams.get("business_id");

    if (!businessId) {
      return NextResponse.json(
        { error: "business_id required" },
        { status: 400 }
      );
    }

    const { data: reviews, error } = await supabase
      .from("business_reviews")
      .select(
        "*, reviewer:profiles!reviewer_id(id, display_name, avatar_url)"
      )
      .eq("business_id", businessId)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Calculate aggregates
    const items = reviews ?? [];
    const avgRating =
      items.length > 0
        ? items.reduce((s, r) => s + r.rating, 0) / items.length
        : 0;

    return NextResponse.json({
      reviews: items,
      stats: {
        count: items.length,
        average: Math.round(avgRating * 10) / 10,
        distribution: {
          5: items.filter((r) => r.rating === 5).length,
          4: items.filter((r) => r.rating === 4).length,
          3: items.filter((r) => r.rating === 3).length,
          2: items.filter((r) => r.rating === 2).length,
          1: items.filter((r) => r.rating === 1).length,
        },
      },
    });
  } catch (error) {
    console.error("Fetch reviews error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rl = await checkRateLimit(getStrictRateLimiter(), user.id);
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const { business_id, rating, body } = await request.json();

    if (!business_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "business_id and rating (1-5) required" },
        { status: 400 }
      );
    }

    const { data: review, error } = await supabase
      .from("business_reviews")
      .upsert(
        {
          business_id,
          reviewer_id: user.id,
          rating,
          body: body || null,
          is_published: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "business_id,reviewer_id" }
      )
      .select("*")
      .single();

    if (error) throw error;

    // Update business rating_avg and rating_count
    const { data: allReviews } = await supabase
      .from("business_reviews")
      .select("rating")
      .eq("business_id", business_id)
      .eq("is_published", true);

    if (allReviews && allReviews.length > 0) {
      const avg =
        allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await supabase
        .from("businesses")
        .update({
          rating_avg: Math.round(avg * 10) / 10,
          rating_count: allReviews.length,
        })
        .eq("id", business_id);
    }

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
