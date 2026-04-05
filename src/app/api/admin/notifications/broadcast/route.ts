import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendBulkEmail, notificationEmailTemplate } from "@/lib/email";

export async function POST(request: Request) {
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

    const { title, body, target_district } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Get target user IDs
    let query = adminClient
      .from("profiles")
      .select("id")
      .eq("is_suspended", false);

    const district = target_district ? parseInt(target_district) : null;
    if (district && district >= 1 && district <= 4) {
      query = query.eq("district", district);
    }

    const { data: recipients, error: recipientError } = await query;
    if (recipientError) throw recipientError;

    const recipientIds = (recipients ?? []).map((r: { id: string }) => r.id);

    if (recipientIds.length === 0) {
      return NextResponse.json(
        { error: "No recipients found" },
        { status: 400 }
      );
    }

    // Create notifications in batches of 500
    const notifications = recipientIds.map((userId: string) => ({
      user_id: userId,
      type: district ? "district" : "system",
      title,
      body,
      is_read: false,
    }));

    const batchSize = 500;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      const { error: insertError } = await adminClient
        .from("notifications")
        .insert(batch);
      if (insertError) {
        console.error("Batch insert error:", insertError);
      }
    }

    // Log the broadcast
    await adminClient.from("broadcast_log").insert({
      title,
      body,
      target_district: district,
      sent_by: user.id,
      recipient_count: recipientIds.length,
    });

    // Send email notifications to recipients
    try {
      const { data: authUsers } = await adminClient.auth.admin.listUsers({
        perPage: 1000,
      });

      if (authUsers?.users) {
        const recipientIdSet = new Set(recipientIds);
        const recipientEmails = authUsers.users
          .filter((u) => recipientIdSet.has(u.id) && u.email)
          .map((u) => u.email as string);

        if (recipientEmails.length > 0) {
          const emailHtml = notificationEmailTemplate(
            title,
            body,
            "https://hubcityapp.com/notifications",
            "View Notifications"
          );

          const emailResult = await sendBulkEmail(
            recipientEmails,
            `Hub City: ${title}`,
            emailHtml
          );

          console.log(
            `[Broadcast] Email sent to ${emailResult.sent}, failed: ${emailResult.failed}`
          );
        }
      }
    } catch (emailError) {
      // Don't fail the broadcast if emails fail
      console.error("[Broadcast] Email sending failed:", emailError);
    }

    // Audit log
    await adminClient.from("audit_log").insert({
      actor_id: user.id,
      action: "broadcast_notification",
      target_type: "notification",
      details: {
        title,
        target_district: district ?? "all",
        recipient_count: recipientIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      recipient_count: recipientIds.length,
    });
  } catch (error) {
    console.error("Broadcast error:", error);
    return NextResponse.json(
      { error: "Failed to send broadcast" },
      { status: 500 }
    );
  }
}

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

    const { data: broadcasts } = await supabase
      .from("broadcast_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return NextResponse.json({ broadcasts: broadcasts ?? [] });
  } catch (error) {
    console.error("Fetch broadcasts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch broadcasts" },
      { status: 500 }
    );
  }
}
