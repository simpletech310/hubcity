import { createClient } from "@/lib/supabase/client";

export async function uploadPostImage(file: File, userId: string): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("post-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadPostVideo(file: File, userId: string): Promise<string> {
  const supabase = createClient();

  const MAX_SIZE = 50 * 1024 * 1024; // 50MB
  if (file.size > MAX_SIZE) {
    throw new Error("Video must be under 100MB");
  }

  const ext = file.name.split(".").pop() || "mp4";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("post-videos")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data } = supabase.storage.from("post-videos").getPublicUrl(path);
  return data.publicUrl;
}
