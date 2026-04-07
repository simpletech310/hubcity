import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!["admin", "city_official", "city_ambassador", "resource_provider"].includes(profile?.role || "")) {
      return NextResponse.json(
        { error: "Only admins can review applications" },
        { status: 403 }
      );
    }

    const { status, reviewer_notes, status_note, referred_to, follow_up_date, internal_notes } = await request.json();

    const { data: application, error } = await supabase
      .from("grant_applications")
      .update({
        status,
        reviewer_notes: reviewer_notes || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        ...(status_note !== undefined && { status_note }),
        ...(referred_to !== undefined && { referred_to }),
        ...(follow_up_date !== undefined && { follow_up_date }),
        ...(internal_notes !== undefined && { internal_notes }),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;

    // Notify applicant of status change (fire-and-forget)
    const appStatusMessages: Record<string, string> = {
      under_review: "Your application is under review",
      approved: "Your application has been approved!",
      denied: "Your application was not approved",
      waitlisted: "You've been waitlisted",
      referred: "You've been referred to another provider",
      enrolled: "You've been enrolled in the program!",
      completed: "Your case has been marked as completed",
    };

    if (appStatusMessages[status]) {
      supabase
        .from("grant_applications")
        .select("applicant_id, resource:resources(name)")
        .eq("id", id)
        .single()
        .then(({ data: app }) => {
          if (app?.applicant_id) {
            const resource = app.resource as unknown as { name: string } | null;
            const resourceName = resource?.name || "Resource application";
            supabase
              .from("notifications")
              .insert({
                user_id: app.applicant_id,
                type: "application",
                title: appStatusMessages[status],
                body: resourceName,
                link_type: "application",
                link_id: id,
              })
              .then(({ error: notifError }) => {
                if (notifError) console.error("Notification insert error:", notifError);
              });
          }
        });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error("Update application error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
