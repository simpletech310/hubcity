import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "spotlight");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const supabase = createAdminClient();

    // Get bot account
    const { data: bot } = await supabase
      .from("profiles")
      .select("id")
      .eq("is_bot", true)
      .eq("handle", "knect")
      .single();

    if (!bot) {
      return NextResponse.json({ error: "Bot account not found" }, { status: 404 });
    }

    // Check for duplicate post today
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("posts")
      .select("id")
      .eq("author_id", bot.id)
      .eq("is_automated", true)
      .gte("created_at", `${today}T00:00:00`)
      .ilike("body", "%spotlight%")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Already posted today" });
    }

    // Pick a random featured business
    let { data: businesses } = await supabase
      .from("businesses")
      .select("id, name, slug, category, description, rating_avg, rating_count")
      .eq("is_published", true)
      .eq("is_featured", true)
      .limit(20);

    if (!businesses || businesses.length === 0) {
      // Fallback: any published business
      const { data: anyBiz } = await supabase
        .from("businesses")
        .select("id, name, slug, category, description, rating_avg, rating_count")
        .eq("is_published", true)
        .limit(20);

      if (!anyBiz || anyBiz.length === 0) {
        return NextResponse.json({ skipped: true, reason: "No businesses to spotlight" });
      }

      businesses = anyBiz;
    }

    // Pick random business (avoid recent spotlights)
    const { data: recentSpotlights } = await supabase
      .from("posts")
      .select("body")
      .eq("author_id", bot.id)
      .eq("is_automated", true)
      .ilike("body", "%spotlight%")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentNames = (recentSpotlights || []).map((p) => {
      const match = p.body.match(/🌟\s+\*\*(.+?)\*\*/);
      return match ? match[1] : "";
    });

    const eligible = businesses.filter((b) => !recentNames.includes(b.name));
    const biz = eligible.length > 0
      ? eligible[Math.floor(Math.random() * eligible.length)]
      : businesses[Math.floor(Math.random() * businesses.length)];

    // Build spotlight post
    const stars = biz.rating_avg
      ? "⭐".repeat(Math.round(biz.rating_avg)) + ` (${biz.rating_avg.toFixed(1)})`
      : "";
    const reviews = biz.rating_count ? ` · ${biz.rating_count} reviews` : "";

    let body = `✨ **Community Spotlight** ✨\n\n`;
    body += `🌟 **${biz.name}** — ${biz.category}\n\n`;

    if (biz.description) {
      const desc = biz.description.length > 150
        ? biz.description.slice(0, 150) + "..."
        : biz.description;
      body += `${desc}\n\n`;
    }

    if (stars) {
      body += `${stars}${reviews}\n\n`;
    }

    body += `Support local! Check them out on Knect → /business/${biz.slug}\n\n`;
    body += `#shoplocal #compton #${biz.category.replace(/[^a-z]/gi, "").toLowerCase()}`;

    const { error } = await supabase.from("posts").insert({
      author_id: bot.id,
      body,
      post_type: "update",
      is_automated: true,
      hashtags: ["shoplocal", "compton", biz.category.replace(/[^a-z]/gi, "").toLowerCase()],
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      spotlighted_business: biz.name,
    });
  } catch (error) {
    console.error("Spotlight bot error:", error);
    return NextResponse.json({ error: "Failed to post spotlight" }, { status: 500 });
  }
}
