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

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed" },
        { status: 400 }
      );
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be under 5MB" },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";

    // Support both avatar and cover uploads via ?type= query param
    const url = new URL(request.url);
    const uploadType = url.searchParams.get("type") === "cover" ? "cover" : "avatar";

    const bucket = uploadType === "cover" ? "profile-covers" : "profile-avatars";
    const path = `${uploadType}s/${user.id}/${Date.now()}.${ext}`;

    // Upload to Supabase storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    const fileUrl = urlData.publicUrl;

    // Update the correct profile field
    const updateField = uploadType === "cover" ? "cover_url" : "avatar_url";
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [updateField]: fileUrl })
      .eq("id", user.id);

    if (updateError) throw updateError;

    // Return both field names so callers can use either
    return NextResponse.json({ avatar_url: fileUrl, cover_url: fileUrl, url: fileUrl });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
