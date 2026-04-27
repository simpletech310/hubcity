#!/usr/bin/env node
/**
 * Upload a properly square (930x930) Westside Party cover to Supabase
 * storage and wire it into albums.cover_art_url + the channel_videos
 * thumbnail rows. The original cover at adizthebam/westside-party-cover.png
 * was a 1697x930 wide music-video frame that didn't crop nicely into the
 * 1:1 FEATURED SINGLE hero on /frequency.
 *
 * Idempotent — overwrites the storage object + updates rows in place.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SQUARE_PATH = resolve(__dirname, "_westside-square.png");
const STORAGE_BUCKET = "post-images";
const STORAGE_KEY = "adizthebam/westside-party-cover-square.png";

async function main() {
  const buf = readFileSync(SQUARE_PATH);
  console.log(`→ uploading ${buf.length} bytes to ${STORAGE_BUCKET}/${STORAGE_KEY}`);
  const { error: upErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(STORAGE_KEY, buf, {
      contentType: "image/png",
      upsert: true,
      cacheControl: "3600",
    });
  if (upErr) {
    console.error("upload error:", upErr.message);
    process.exit(1);
  }
  const { data: pub } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(STORAGE_KEY);
  const url = pub.publicUrl;
  console.log(`  ✓ ${url}`);

  // 1. Albums — westside-party
  const { error: albErr } = await supabase
    .from("albums")
    .update({ cover_art_url: url, cover_art_path: STORAGE_KEY })
    .eq("slug", "westside-party");
  if (albErr) console.warn("  ! albums update:", albErr.message);
  else console.log("  ✓ albums.cover_art_url updated");

  // 2. Tracks — set cover_art_url for the Westside Party track too if column exists
  const { data: trackRows } = await supabase
    .from("tracks")
    .select("id, cover_art_url, album_id, albums:albums(slug)")
    .eq("title", "Westside Party");
  for (const t of trackRows ?? []) {
    if (t.albums?.slug !== "westside-party") continue;
    if (t.cover_art_url === url) continue;
    const { error } = await supabase
      .from("tracks")
      .update({ cover_art_url: url })
      .eq("id", t.id);
    if (error) console.warn("  ! track update:", error.message);
    else console.log(`  ✓ track ${t.id} cover updated`);
  }

  // 3. channel_videos — Westside Party music video thumbnail
  const { data: vids } = await supabase
    .from("channel_videos")
    .select("id, title, thumbnail_url, channel:channels(slug)")
    .ilike("title", "Westside Party%");
  for (const v of vids ?? []) {
    if (v.thumbnail_url === url) continue;
    const { error } = await supabase
      .from("channel_videos")
      .update({ thumbnail_url: url })
      .eq("id", v.id);
    if (error) console.warn(`  ! channel_videos ${v.id}:`, error.message);
    else
      console.log(
        `  ✓ channel_videos "${v.title}" on ${v.channel?.slug ?? "?"} updated`,
      );
  }

  console.log("\n→ verify on /frequency (FEATURED SINGLE) + /live (Music Videos rail)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
