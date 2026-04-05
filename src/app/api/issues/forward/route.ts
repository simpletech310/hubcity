import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, issueDigestEmailTemplate } from "@/lib/email";

interface CityIssue {
  id: string;
  type: string;
  title: string;
  location_text: string | null;
  department_email: string | null;
  assigned_department: string | null;
  upvote_count: number;
}

/**
 * Core forwarding logic — shared between the admin endpoint and the bot.
 * Returns { forwarded, departments } or throws on error.
 */
export async function forwardIssuesToDepartments(): Promise<{
  forwarded: number;
  departments: number;
  issuesByDept: Record<string, CityIssue[]>;
}> {
  const adminClient = createAdminClient();

  // Get all unforwarded issues with a department email
  const { data: issues, error } = await adminClient
    .from("city_issues")
    .select(
      "id, type, title, location_text, department_email, assigned_department, upvote_count"
    )
    .is("forwarded_at", null)
    .in("status", ["reported", "acknowledged"])
    .not("department_email", "is", null);

  if (error) throw error;

  if (!issues || issues.length === 0) {
    return { forwarded: 0, departments: 0, issuesByDept: {} };
  }

  // Group issues by department email
  const issuesByDept: Record<string, CityIssue[]> = {};
  for (const issue of issues) {
    const deptEmail = issue.department_email!;
    if (!issuesByDept[deptEmail]) {
      issuesByDept[deptEmail] = [];
    }
    issuesByDept[deptEmail].push(issue);
  }

  // Send digest email to each department
  let forwarded = 0;
  const forwardedIds: string[] = [];

  for (const [deptEmail, deptIssues] of Object.entries(issuesByDept)) {
    const deptName =
      deptIssues[0]?.assigned_department || "City Department";

    const digestData = deptIssues.map((issue) => ({
      type: issue.type,
      title: issue.title,
      location: issue.location_text || "Not specified",
      count: issue.upvote_count ?? 0,
      url: `https://hubcityapp.com/city-hall/issues/${issue.id}`,
    }));

    const html = issueDigestEmailTemplate(digestData);

    const sent = await sendEmail({
      to: deptEmail,
      subject: `Hub City Issue Report: ${deptIssues.length} new issue${deptIssues.length > 1 ? "s" : ""} for ${deptName}`,
      html,
    });

    if (sent) {
      forwarded += deptIssues.length;
      forwardedIds.push(...deptIssues.map((i) => i.id));
    }
  }

  // Update forwarded_at on all processed issues
  if (forwardedIds.length > 0) {
    const now = new Date().toISOString();
    const { error: updateError } = await adminClient
      .from("city_issues")
      .update({ forwarded_at: now })
      .in("id", forwardedIds);

    if (updateError) {
      console.error("[IssueForward] Failed to update forwarded_at:", updateError);
    }
  }

  return {
    forwarded,
    departments: Object.keys(issuesByDept).length,
    issuesByDept,
  };
}

/**
 * POST /api/issues/forward
 * Admin/city_official endpoint to manually trigger issue forwarding.
 */
export async function POST() {
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

    const result = await forwardIssuesToDepartments();

    // Audit log
    const adminClient = createAdminClient();
    await adminClient.from("audit_log").insert({
      actor_id: user.id,
      action: "forward_issues",
      target_type: "city_issue",
      details: {
        forwarded: result.forwarded,
        departments: result.departments,
      },
    });

    return NextResponse.json({
      forwarded: result.forwarded,
      departments: result.departments,
    });
  } catch (error) {
    console.error("[IssueForward] Error:", error);
    return NextResponse.json(
      { error: "Failed to forward issues" },
      { status: 500 }
    );
  }
}
