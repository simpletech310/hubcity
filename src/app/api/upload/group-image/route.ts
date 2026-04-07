import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const groupId = formData.get("groupId") as string | null;

    if (!file || !groupId) {
      return NextResponse.json({ error: "File and groupId required" }, { status: 400 });
    }

    // Verify user is admin/mod of this group
    const { data: membership } = await supabase
      .from("group_members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (!membership || !["admin", "moderator"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 10MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const path = `groups/${groupId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("post-images")
      .getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (error) {
    console.error("Group image upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
