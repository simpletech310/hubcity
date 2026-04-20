import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBotRateLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST() {
  try {
    const rl = await checkRateLimit(getBotRateLimiter(), "weekly-stats");
    if (!rl.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", reset: rl.reset },
        { status: 429 }
      );
    }

    const adminClient = createAdminClient();
    const weekAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Gather weekly stats
    const [
      { count: newUsers },
      { count: newBusinesses },
      { count: newEvents },
      { count: newPosts },
      { count: newOrders },
      { count: newIssues },
      { count: resolvedIssues },
      { count: pollVotes },
      { count: surveyResponses },
    ] = await Promise.all([
      adminClient
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo)
        .eq("is_bot", false),
      adminClient
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("events")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("posts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo)
        .eq("is_automated", false),
      adminClient
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", weekAgo),
      adminClient
        .from("poll_votes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
      adminClient
        .from("survey_responses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo),
    ]);

    let body = `📊 This Week in Compton — Culture Weekly Recap\n\n`;
    body += `👥 ${newUsers ?? 0} new residents joined Culture\n`;
    body += `🏪 ${newBusinesses ?? 0} new businesses listed\n`;
    body += `🗓️ ${newEvents ?? 0} events created\n`;
    body += `💬 ${newPosts ?? 0} community posts\n`;

    if ((newOrders ?? 0) > 0) {
      body += `🛒 ${newOrders} orders placed with local businesses\n`;
    }
    if ((newIssues ?? 0) > 0 || (resolvedIssues ?? 0) > 0) {
      body += `🔧 ${newIssues ?? 0} issues reported, ${resolvedIssues ?? 0} resolved\n`;
    }
    if ((pollVotes ?? 0) > 0) {
      body += `🗳️ ${pollVotes} poll votes cast\n`;
    }
    if ((surveyResponses ?? 0) > 0) {
      body += `📝 ${surveyResponses} survey responses\n`;
    }

    body += `\nKeep growing, Compton! Together we build. 💪🏽\n#weeklyrecap #compton`;

    const { data: botProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("is_bot", true)
      .eq("handle", "knect")
      .single();

    if (!botProfile) {
      return NextResponse.json(
        { error: "Bot profile not found" },
        { status: 400 }
      );
    }

    const { data: post, error } = await adminClient
      .from("posts")
      .insert({
        author_id: botProfile.id,
        body,
        is_published: true,
        is_automated: true,
        hashtags: ["weeklyrecap", "compton"],
        reaction_counts: {},
      })
      .select("id")
      .single();

    if (error) throw error;

    await adminClient.from("bot_posts").insert({
      bot_name: "knect",
      post_type: "weekly_stats",
      post_id: post.id,
      data: {
        new_users: newUsers,
        new_businesses: newBusinesses,
        new_events: newEvents,
        new_posts: newPosts,
      },
    });

    return NextResponse.json({ success: true, post_id: post.id });
  } catch (error) {
    console.error("Weekly stats error:", error);
    return NextResponse.json(
      { error: "Failed to create weekly stats" },
      { status: 500 }
    );
  }
}
