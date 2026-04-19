import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "morning-brief");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];
    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = dayNames[new Date().getDay()];
    const monthDay = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
    });

    // Check if already posted today
    const { data: existing } = await adminClient
      .from("bot_posts")
      .select("id")
      .eq("bot_name", "knect")
      .eq("post_type", "morning_brief")
      .gte("created_at", `${today}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: "Already posted morning brief today",
      });
    }

    // Gather data
    const [
      { count: eventCount },
      { count: bizCount },
      { count: activeIssues },
      { data: todayEvents },
      { count: newBizCount },
    ] = await Promise.all([
      adminClient
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .eq("start_date", today),
      adminClient
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      adminClient
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .in("status", ["reported", "acknowledged", "in_progress"]),
      adminClient
        .from("events")
        .select("title, start_time, location_name")
        .eq("is_published", true)
        .eq("start_date", today)
        .order("start_time")
        .limit(3),
      adminClient
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ]);

    // Build the post
    let body = `☀️ Good morning, Compton! Happy ${dayName}, ${monthDay}.\n\n`;
    body += `📊 Knect Pulse:\n`;
    body += `• ${bizCount ?? 0} local businesses on the platform\n`;

    if ((newBizCount ?? 0) > 0) {
      body += `• ${newBizCount} new businesses this week!\n`;
    }

    if ((eventCount ?? 0) > 0) {
      body += `• ${eventCount} events happening today\n`;
      if (todayEvents && todayEvents.length > 0) {
        body += `\n🗓️ Today's Events:\n`;
        for (const evt of todayEvents) {
          const time = evt.start_time
            ? ` at ${evt.start_time.slice(0, 5)}`
            : "";
          body += `• ${evt.title}${time}${evt.location_name ? ` — ${evt.location_name}` : ""}\n`;
        }
      }
    } else {
      body += `• No events today — check out what's coming this week!\n`;
    }

    if ((activeIssues ?? 0) > 0) {
      body += `\n🔧 ${activeIssues} active city issues being tracked\n`;
    }

    body += `\nHave a great day, Knect! 🏆`;

    // Get or create the Knect bot profile
    // For now, use a system approach - find bot profile
    const { data: botProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("is_bot", true)
      .eq("handle", "knect")
      .single();

    if (!botProfile) {
      return NextResponse.json(
        {
          error:
            "Knect bot profile not found. Create a profile with handle 'knect' and is_bot=true",
        },
        { status: 400 }
      );
    }

    // Create the post
    const { data: post, error } = await adminClient
      .from("posts")
      .insert({
        author_id: botProfile.id,
        body,
        is_published: true,
        is_automated: true,
        hashtags: ["morningbrief", "compton"],
        reaction_counts: {},
      })
      .select("id")
      .single();

    if (error) throw error;

    // Log the bot post
    await adminClient.from("bot_posts").insert({
      bot_name: "knect",
      post_type: "morning_brief",
      post_id: post.id,
      data: { event_count: eventCount, biz_count: bizCount },
    });

    return NextResponse.json({ success: true, post_id: post.id });
  } catch (error) {
    console.error("Morning brief error:", error);
    return NextResponse.json(
      { error: "Failed to create morning brief" },
      { status: 500 }
    );
  }
}
