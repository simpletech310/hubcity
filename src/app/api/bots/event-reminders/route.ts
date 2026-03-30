import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "event-reminders");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Get today's events
    const { data: events } = await adminClient
      .from("events")
      .select("id, title, start_time, location_name, category, rsvp_count")
      .eq("is_published", true)
      .eq("start_date", today)
      .order("start_time")
      .limit(5);

    if (!events || events.length === 0) {
      return NextResponse.json({ message: "No events today" });
    }

    const { data: botProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("is_bot", true)
      .eq("handle", "hubcity")
      .single();

    if (!botProfile) {
      return NextResponse.json(
        { error: "Bot profile not found" },
        { status: 400 }
      );
    }

    let body = `🗓️ HAPPENING TODAY in Compton!\n\n`;

    for (const evt of events) {
      const time = evt.start_time
        ? evt.start_time.slice(0, 5)
        : "All Day";
      const loc = evt.location_name || "TBA";
      body += `🎯 ${evt.title}\n`;
      body += `   ⏰ ${time} · 📍 ${loc}`;
      if (evt.rsvp_count > 0) {
        body += ` · ${evt.rsvp_count} attending`;
      }
      body += `\n\n`;
    }

    body += `Don't miss out! Check the Events page for details. #events #compton`;

    const { data: post, error } = await adminClient
      .from("posts")
      .insert({
        author_id: botProfile.id,
        body,
        is_published: true,
        is_automated: true,
        hashtags: ["events", "compton", "today"],
        reaction_counts: {},
      })
      .select("id")
      .single();

    if (error) throw error;

    await adminClient.from("bot_posts").insert({
      bot_name: "hubcity",
      post_type: "event_reminders",
      post_id: post.id,
      data: { event_count: events.length },
    });

    return NextResponse.json({
      success: true,
      post_id: post.id,
      events_count: events.length,
    });
  } catch (error) {
    console.error("Event reminders error:", error);
    return NextResponse.json(
      { error: "Failed to create event reminders" },
      { status: 500 }
    );
  }
}
