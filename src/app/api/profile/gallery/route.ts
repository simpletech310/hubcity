import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profile_gallery_images")
    .select("*")
    .eq("owner_id", user.id)
    .order("display_order", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ images: data ?? [] });
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

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const caption = (formData.get("caption") as string | null) ?? null;
    const eventId = (formData.get("event_id") as string | null) ?? null;
    const widthRaw = formData.get("width");
    const heightRaw = formData.get("height");

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Use JPEG, PNG, WebP, or GIF.` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max 10MB.` },
          { status: 400 }
        );
      }
    }

    const parsedWidth = widthRaw ? parseInt(String(widthRaw), 10) : null;
    const parsedHeight = heightRaw ? parseInt(String(heightRaw), 10) : null;

    const inserted: Array<{ id: string; image_url: string }> = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `gallery/${user.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(path);

      const { data: row, error: insertError } = await supabase
        .from("profile_gallery_images")
        .insert({
          owner_id: user.id,
          image_url: urlData.publicUrl,
          caption,
          event_id: eventId,
          width: Number.isFinite(parsedWidth) ? parsedWidth : null,
          height: Number.isFinite(parsedHeight) ? parsedHeight : null,
        })
        .select("id, image_url")
        .single();

      if (insertError) throw insertError;

      if (row) inserted.push(row);
    }

    return NextResponse.json({ images: inserted });
  } catch (error) {
    console.error("Profile gallery upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
