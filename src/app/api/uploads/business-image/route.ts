/**
 * POST /api/uploads/business-image
 * Multipart upload for business hero/gallery images. Accepts one or more
 * `files` form fields, returns `{ urls: string[] }`. Caller (typically the
 * dashboard ImageGallery component) is responsible for persisting the URLs
 * to `businesses.image_urls`.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "business-images";
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();
    if (!business) {
      return NextResponse.json(
        { error: "No business found for this user" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    for (const file of files) {
      if (!ALLOWED.includes(file.type)) {
        return NextResponse.json(
          { error: `Unsupported type: ${file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name} (max 5MB)` },
          { status: 400 }
        );
      }
    }

    const urls: string[] = [];
    for (const file of files) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${business.id}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) {
        // Surface the storage error explicitly so the caller can show it.
        return NextResponse.json(
          { error: upErr.message || "Storage upload failed" },
          { status: 500 }
        );
      }
      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
      urls.push(pub.publicUrl);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    console.error("business-image upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
