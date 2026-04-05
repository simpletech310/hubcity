import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "city_official", "city_ambassador"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(
      now.getTime() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();
    const sevenDaysAgo = new Date(
      now.getTime() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Parallel queries for all metrics
    const [
      { count: totalUsers },
      { count: verifiedUsers },
      { count: newUsersMonth },
      { count: newUsersWeek },
      { count: totalBusinesses },
      { count: newBizMonth },
      { count: totalEvents },
      { count: totalResources },
      { count: totalPosts },
      { count: postsThisWeek },
      { count: totalIssues },
      { count: openIssues },
      { count: resolvedIssuesMonth },
      { count: totalOrders },
      { count: ordersMonth },
      { count: totalJobs },
      { count: activeJobs },
      { count: totalPollVotes },
      { count: pollVotesMonth },
      { count: totalSurveyResponses },
      { count: totalRsvps },
      { data: districtUsers },
    ] = await Promise.all([
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("is_bot", false),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "verified"),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo)
        .eq("is_bot", false),
      supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo)
        .eq("is_bot", false),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true)
        .gte("created_at", sevenDaysAgo),
      supabase
        .from("city_issues")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .in("status", ["reported", "acknowledged", "in_progress"]),
      supabase
        .from("city_issues")
        .select("*", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", thirtyDaysAgo),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("job_listings")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("job_listings")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true),
      supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("poll_votes")
        .select("*", { count: "exact", head: true })
        .gte("created_at", thirtyDaysAgo),
      supabase
        .from("survey_responses")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("event_rsvps")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("profiles")
        .select("district")
        .not("district", "is", null)
        .eq("is_bot", false),
    ]);

    // Calculate district distribution
    const districtCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const u of districtUsers ?? []) {
      if (u.district && districtCounts[u.district] !== undefined) {
        districtCounts[u.district]++;
      }
    }

    return NextResponse.json({
      civic_engagement: {
        total_users: totalUsers ?? 0,
        verified_users: verifiedUsers ?? 0,
        verification_rate:
          totalUsers ? Math.round(((verifiedUsers ?? 0) / totalUsers) * 100) : 0,
        new_users_30d: newUsersMonth ?? 0,
        new_users_7d: newUsersWeek ?? 0,
        total_posts: totalPosts ?? 0,
        posts_7d: postsThisWeek ?? 0,
        poll_votes: totalPollVotes ?? 0,
        poll_votes_30d: pollVotesMonth ?? 0,
        survey_responses: totalSurveyResponses ?? 0,
        event_rsvps: totalRsvps ?? 0,
        district_distribution: districtCounts,
      },
      economic_health: {
        active_businesses: totalBusinesses ?? 0,
        new_businesses_30d: newBizMonth ?? 0,
        total_orders: totalOrders ?? 0,
        orders_30d: ordersMonth ?? 0,
        total_jobs: totalJobs ?? 0,
        active_jobs: activeJobs ?? 0,
      },
      infrastructure: {
        total_issues: totalIssues ?? 0,
        open_issues: openIssues ?? 0,
        resolved_30d: resolvedIssuesMonth ?? 0,
      },
      community: {
        total_events: totalEvents ?? 0,
        total_resources: totalResources ?? 0,
      },
    });
  } catch (error) {
    console.error("City metrics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 }
    );
  }
}
