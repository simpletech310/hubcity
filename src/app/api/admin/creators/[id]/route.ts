import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdminOrOfficial(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "city_official"].includes(profile.role)) return null;
  return user;
}

// PATCH /api/admin/creators/[id] — approve or reject a creator application
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const admin = await requireAdminOrOfficial(supabase);
    if (!admin) {
      return NextResponse.json(
        { error: "Admin or city official access required" },
        { status: 403 }
      );
    }

    const { status, admin_notes } = await request.json();

    if (!status || !["approved", "rejected"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from("creator_applications")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.status !== "pending") {
      return NextResponse.json(
        { error: "Application has already been processed" },
        { status: 409 }
      );
    }

    // Use admin client for privileged operations
    const adminDb = createAdminClient();

    // Update the application
    const { error: updateError } = await adminDb
      .from("creator_applications")
      .update({
        status,
        admin_notes: admin_notes || null,
        reviewed_by: admin.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) throw updateError;

    // If approved, update the user profile and create a channel
    if (status === "approved") {
      // Get current profile to check role
      const { data: profile } = await adminDb
        .from("profiles")
        .select("role")
        .eq("id", application.user_id)
        .single();

      const profileUpdates: Record<string, unknown> = {
        is_creator: true,
        creator_approved_at: new Date().toISOString(),
        creator_tier: "starter",
      };

      // Only upgrade role if not already admin
      if (profile && profile.role !== "admin") {
        profileUpdates.role = "content_creator";
      }

      const { error: profileError } = await adminDb
        .from("profiles")
        .update(profileUpdates)
        .eq("id", application.user_id);

      if (profileError) {
        console.error("Failed to update creator profile:", profileError);
        // Revert the application status since profile update failed
        await adminDb
          .from("creator_applications")
          .update({ status: "pending", reviewed_by: null, reviewed_at: null })
          .eq("id", id);
        return NextResponse.json(
          { error: "Failed to update creator profile" },
          { status: 500 }
        );
      }

      // Generate a URL-safe slug from the channel name
      const slug = application.channel_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        || `creator-${Date.now()}`;

      // Check for slug uniqueness, append suffix if needed
      const { data: existingChannel } = await adminDb
        .from("channels")
        .select("id")
        .eq("slug", slug)
        .limit(1);

      const finalSlug = existingChannel && existingChannel.length > 0
        ? `${slug}-${Date.now().toString(36)}`
        : slug;

      // Auto-create a channel for the creator
      const { error: channelError } = await adminDb.from("channels").insert({
        name: application.channel_name,
        slug: finalSlug,
        type: "media",
        owner_id: application.user_id,
        description: application.description,
        is_active: true,
        is_verified: false,
        follower_count: 0,
      });

      if (channelError) {
        console.error("Failed to create creator channel:", channelError);
        // Channel failed but profile is updated — log but don't revert
        // The creator can still use the platform, channel can be created later
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("Admin creator application review error:", error);
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    );
  }
}
