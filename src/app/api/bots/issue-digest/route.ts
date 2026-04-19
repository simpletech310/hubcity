import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { forwardIssuesToDepartments } from "@/app/api/issues/forward/route";

export async function POST() {
  try {
    const adminClient = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Check if already posted today
    const { data: existing } = await adminClient
      .from("bot_posts")
      .select("id")
      .eq("bot_name", "knect")
      .eq("post_type", "issue_digest")
      .gte("created_at", `${today}T00:00:00`)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({
        message: "Already posted issue digest today",
      });
    }

    // Forward issues to departments
    const result = await forwardIssuesToDepartments();

    // Count new issues reported today
    const { count: newIssuesToday } = await adminClient
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .gte("created_at", `${today}T00:00:00`);

    // Count total active issues
    const { count: activeIssues } = await adminClient
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .in("status", ["reported", "acknowledged", "in_progress"]);

    // Build the Pulse post
    const newCount = newIssuesToday ?? 0;
    const forwardedCount = result.forwarded;
    const deptCount = result.departments;
    const activeCount = activeIssues ?? 0;

    let body = `📋 Daily Issue Report\n\n`;
    body += `• ${newCount} new issue${newCount !== 1 ? "s" : ""} reported today\n`;

    if (forwardedCount > 0) {
      body += `• ${forwardedCount} issue${forwardedCount !== 1 ? "s" : ""} forwarded to ${deptCount} department${deptCount !== 1 ? "s" : ""}\n`;

      // List the departments that received issues
      for (const [, deptIssues] of Object.entries(result.issuesByDept)) {
        const deptName = deptIssues[0]?.assigned_department || "Unknown";
        body += `  → ${deptName}: ${deptIssues.length} issue${deptIssues.length !== 1 ? "s" : ""}\n`;
      }
    } else {
      body += `• No new issues to forward today\n`;
    }

    body += `\n🔧 ${activeCount} total active issue${activeCount !== 1 ? "s" : ""} being tracked\n`;
    body += `\nReport an issue with #pothole, #streetlight, #graffiti, and more! 🏙️`;

    // Get the Knect bot profile
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
        hashtags: ["issuedigest", "cityissues", "compton"],
        reaction_counts: {},
      })
      .select("id")
      .single();

    if (error) throw error;

    // Log the bot post
    await adminClient.from("bot_posts").insert({
      bot_name: "knect",
      post_type: "issue_digest",
      post_id: post.id,
      data: {
        new_issues: newCount,
        forwarded: forwardedCount,
        departments: deptCount,
        active_issues: activeCount,
      },
    });

    return NextResponse.json({
      success: true,
      post_id: post.id,
      forwarded: forwardedCount,
      departments: deptCount,
    });
  } catch (error) {
    console.error("Issue digest bot error:", error);
    return NextResponse.json(
      { error: "Failed to create issue digest" },
      { status: 500 }
    );
  }
}
