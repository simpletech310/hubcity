import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "resource-alerts");
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
      .ilike("body", "%new resource%")
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ skipped: true, reason: "Already posted today" });
    }

    // Find resources added in the last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data: newResources } = await supabase
      .from("resources")
      .select("title, category, description")
      .eq("is_published", true)
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!newResources || newResources.length === 0) {
      return NextResponse.json({ skipped: true, reason: "No new resources this week" });
    }

    // Find expiring resources (deadline within 7 days)
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const { data: expiringResources } = await supabase
      .from("resources")
      .select("title, category, deadline")
      .eq("is_published", true)
      .not("deadline", "is", null)
      .lte("deadline", nextWeek)
      .gte("deadline", today)
      .order("deadline")
      .limit(5);

    // Build post body
    let body = "📢 **Resource Alert** — Stay informed, Compton!\n\n";

    if (newResources.length > 0) {
      body += "🆕 **New Resources Available:**\n";
      for (const r of newResources) {
        body += `• ${r.title} (${r.category})\n`;
      }
      body += "\n";
    }

    if (expiringResources && expiringResources.length > 0) {
      body += "⏰ **Deadlines Approaching:**\n";
      for (const r of expiringResources) {
        const deadline = new Date(r.deadline).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        body += `• ${r.title} — due ${deadline}\n`;
      }
      body += "\n";
    }

    body += "Browse all resources in the app → Resources tab\n\n#resources #compton #community";

    const { error } = await supabase.from("posts").insert({
      author_id: bot.id,
      body,
      post_type: "update",
      is_automated: true,
      hashtags: ["resources", "compton", "community"],
    });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      new_resources: newResources.length,
      expiring_resources: expiringResources?.length || 0,
    });
  } catch (error) {
    console.error("Resource alerts bot error:", error);
    return NextResponse.json({ error: "Failed to post resource alert" }, { status: 500 });
  }
}
