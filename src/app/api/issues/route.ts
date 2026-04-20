import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStrictRateLimiter, checkRateLimit } from "@/lib/ratelimit";
import { ISSUE_DEPARTMENT_MAP, ISSUE_SLA_HOURS } from "@/lib/hashtags";
import { sendEmail, notificationEmailTemplate } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const district = searchParams.get("district");
    const mine = searchParams.get("mine");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("city_issues")
      .select(
        "*, reporter:profiles!reported_by(id, display_name, avatar_url)"
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    // Filter to current user's reported issues
    if (mine === "true") {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query = query.eq("reported_by", user.id);
    }

    if (type && type !== "all") {
      query = query.eq("type", type);
    }
    if (status && status !== "all") {
      query = query.eq("status", status);
    }
    if (district && district !== "all") {
      query = query.eq("district", parseInt(district));
    }

    const { data, error } = await query;
    if (error) throw error;

    // Get aggregate stats
    const { count: totalCount } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true });

    const { count: inProgressCount } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "in_progress");

    const { count: resolvedThisMonth } = await supabase
      .from("city_issues")
      .select("*", { count: "exact", head: true })
      .eq("status", "resolved")
      .gte(
        "resolved_at",
        new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1
        ).toISOString()
      );

    return NextResponse.json({
      issues: data ?? [],
      stats: {
        total: totalCount ?? 0,
        in_progress: inProgressCount ?? 0,
        resolved_this_month: resolvedThisMonth ?? 0,
      },
    });
  } catch (error) {
    console.error("Fetch issues error:", error);
    return NextResponse.json(
      { error: "Failed to fetch issues" },
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

    const body = await request.json();
    const {
      type,
      title,
      description,
      location_text,
      latitude,
      longitude,
      district,
      image_url,
      source_post_id,
    } = body;

    if (!type) {
      return NextResponse.json(
        { error: "Issue type is required" },
        { status: 400 }
      );
    }
    if (!title && !description) {
      return NextResponse.json(
        { error: "Title or description is required" },
        { status: 400 }
      );
    }

    // Look up department info from hashtag_actions, fall back to static map
    const { data: hashtagAction } = await supabase
      .from("hashtag_actions")
      .select("department, department_email")
      .eq("issue_type", type)
      .eq("is_active", true)
      .single();

    const staticDept = ISSUE_DEPARTMENT_MAP[type];
    const assignedDepartment =
      hashtagAction?.department || staticDept?.department || null;
    const departmentEmail =
      hashtagAction?.department_email || staticDept?.email || null;

    // Calculate SLA
    const slaHours = ISSUE_SLA_HOURS[type] ?? 120;
    const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString();

    const { data: issue, error } = await supabase
      .from("city_issues")
      .insert({
        type,
        title: title || `${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        description: description || null,
        location_text: location_text || null,
        latitude: latitude || null,
        longitude: longitude || null,
        district: district || null,
        image_url: image_url || null,
        source_post_id: source_post_id || null,
        reported_by: user.id,
        assigned_department: assignedDepartment,
        department_email: departmentEmail,
        sla_hours: slaHours,
        sla_deadline: slaDeadline,
      })
      .select("*")
      .single();

    if (error) throw error;

    // Forward email to department (fire-and-forget)
    if (departmentEmail) {
      const issueUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://hubcity.4everforward.net"}/city-hall/issues/${issue.id}`;
      const emailHtml = notificationEmailTemplate(
        `New ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        `<strong>${issue.title}</strong><br/><br/>${
          issue.description ? `${issue.description}<br/><br/>` : ""
        }${issue.location_text ? `📍 Location: ${issue.location_text}<br/>` : ""}${
          issue.district ? `District: ${issue.district}<br/>` : ""
        }Priority: ${issue.priority}<br/>SLA: ${slaHours} hours (due ${new Date(slaDeadline).toLocaleDateString()})`,
        issueUrl,
        "View Issue Details"
      );

      sendEmail({
        to: departmentEmail,
        subject: `[Culture] New ${type} report: ${issue.title}`,
        html: emailHtml,
      }).then((sent) => {
        if (sent) {
          supabase
            .from("city_issues")
            .update({ email_forwarded_at: new Date().toISOString() })
            .eq("id", issue.id)
            .then(() => {});
        }
      });
    }

    // Notify city officials about the new issue
    try {
      // Get users with official/admin/moderator roles to notify
      const { data: officials } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["official", "admin", "moderator"]);

      if (officials && officials.length > 0) {
        const notifications = officials.map((official) => ({
          user_id: official.id,
          type: "issue_reported" as const,
          title: "New Issue Reported",
          body: `${issue.title}${assignedDepartment ? ` — assigned to ${assignedDepartment}` : ""}`,
          link: `/city-hall/issues/${issue.id}`,
          read: false,
        }));

        await supabase.from("notifications").insert(notifications);
      }
    } catch (notifError) {
      // Don't fail the issue creation if notification fails
      console.error("Failed to create notifications:", notifError);
    }

    return NextResponse.json({ issue });
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json(
      { error: "Failed to create issue" },
      { status: 500 }
    );
  }
}
