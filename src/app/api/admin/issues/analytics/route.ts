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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Fetch all issues
    const { data: allIssues } = await supabase
      .from("city_issues")
      .select("id, type, status, priority, district, sla_deadline, sla_hours, created_at, acknowledged_at, resolved_at, assigned_department, upvote_count");

    if (!allIssues) {
      return NextResponse.json({ analytics: null });
    }

    // By type
    const byType: Record<string, number> = {};
    for (const issue of allIssues) {
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }

    // By status
    const byStatus: Record<string, number> = {};
    for (const issue of allIssues) {
      byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
    }

    // By district
    const byDistrict: Record<string, number> = {};
    for (const issue of allIssues) {
      const d = issue.district ? `District ${issue.district}` : "Unknown";
      byDistrict[d] = (byDistrict[d] || 0) + 1;
    }

    // By department
    const byDepartment: Record<string, number> = {};
    for (const issue of allIssues) {
      const dept = issue.assigned_department || "Unassigned";
      byDepartment[dept] = (byDepartment[dept] || 0) + 1;
    }

    // Resolution times (for resolved issues)
    const resolvedIssues = allIssues.filter((i) => i.resolved_at);
    let avgResolutionHours = 0;
    const resolutionTimes: number[] = [];
    for (const issue of resolvedIssues) {
      const created = new Date(issue.created_at).getTime();
      const resolved = new Date(issue.resolved_at).getTime();
      const hours = (resolved - created) / (1000 * 60 * 60);
      resolutionTimes.push(hours);
    }
    if (resolutionTimes.length > 0) {
      avgResolutionHours = Math.round(
        resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length
      );
    }

    // SLA compliance
    let slaMet = 0;
    let slaMissed = 0;
    for (const issue of allIssues) {
      if (!issue.sla_deadline) continue;
      const deadline = new Date(issue.sla_deadline).getTime();

      if (["resolved", "closed"].includes(issue.status) && issue.resolved_at) {
        const resolved = new Date(issue.resolved_at).getTime();
        if (resolved <= deadline) slaMet++;
        else slaMissed++;
      } else if (!["resolved", "closed"].includes(issue.status)) {
        if (now.getTime() > deadline) slaMissed++;
        else slaMet++;
      }
    }
    const slaComplianceRate = slaMet + slaMissed > 0
      ? Math.round((slaMet / (slaMet + slaMissed)) * 100)
      : 100;

    // Trend: issues per week for last 12 weeks
    const weeklyTrend: { week: string; reported: number; resolved: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const label = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });

      const reported = allIssues.filter((issue) => {
        const d = new Date(issue.created_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      const resolved = allIssues.filter((issue) => {
        if (!issue.resolved_at) return false;
        const d = new Date(issue.resolved_at);
        return d >= weekStart && d < weekEnd;
      }).length;

      weeklyTrend.push({ week: label, reported, resolved });
    }

    // Recent 30d stats
    const recent = allIssues.filter((i) => i.created_at >= thirtyDaysAgo);
    const recentResolved = allIssues.filter(
      (i) => i.resolved_at && i.resolved_at >= thirtyDaysAgo
    );

    // Priority breakdown
    const byPriority: Record<string, number> = {};
    for (const issue of allIssues) {
      byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1;
    }

    // Top upvoted open issues
    const topUpvoted = allIssues
      .filter((i) => !["resolved", "closed"].includes(i.status))
      .sort((a, b) => b.upvote_count - a.upvote_count)
      .slice(0, 5);

    return NextResponse.json({
      analytics: {
        total: allIssues.length,
        reported_30d: recent.length,
        resolved_30d: recentResolved.length,
        open: allIssues.filter((i) => !["resolved", "closed"].includes(i.status)).length,
        avg_resolution_hours: avgResolutionHours,
        sla_compliance_rate: slaComplianceRate,
        sla_met: slaMet,
        sla_missed: slaMissed,
        by_type: byType,
        by_status: byStatus,
        by_district: byDistrict,
        by_department: byDepartment,
        by_priority: byPriority,
        weekly_trend: weeklyTrend,
        top_upvoted: topUpvoted,
      },
    });
  } catch (error) {
    console.error("Issue analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
