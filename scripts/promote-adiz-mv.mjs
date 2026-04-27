#!/usr/bin/env node
/**
 * Surface Adiz's "Westside Party (Official Music Video)" on /live:
 *   1. Mark the existing channel_videos row is_featured = true so the
 *      § FEATURED rail picks it up.
 *   2. Set Adiz's channel scope = 'national' so non-Compton listeners
 *      can see her videos in the recent + featured rails (the local
 *      gate was hiding the video for everyone who hadn't verified a
 *      Compton address).
 *   3. Insert a duplicate channel_videos row on knect-tv-live so the
 *      flagship rotation can include the video, then prepend two
 *      schedule blocks at the top of the on-air queue so listeners
 *      see it in the live rotation when they open the page.
 *
 * Idempotent: re-running won't create duplicate rotation rows or
 * duplicate knect-tv-live entries (we look the video up by title
 * + mux_playback_id and reuse it).
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

async function main() {
  // 1. Find Adiz's existing music video
  const { data: mv } = await supabase
    .from("channel_videos")
    .select("id, title, channel_id, mux_playback_id, mux_asset_id, duration, thumbnail_url, description")
    .ilike("title", "%westside party (official music video)%")
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!mv) {
    console.error("No Westside music video found — run finish-adiz-mux.mjs first.");
    process.exit(1);
  }
  console.log(`Found: ${mv.title} (${mv.id}) on channel ${mv.channel_id}`);

  // 2. Mark it featured so it shows in the FEATURED rail
  await supabase
    .from("channel_videos")
    .update({ is_featured: true })
    .eq("id", mv.id);
  console.log("  ✓ is_featured = true");

  // 3. Promote Adiz's channel from local → national so the visibility
  //    gate doesn't hide it from non-verified listeners
  await supabase
    .from("channels")
    .update({ scope: "national", content_scope: "national" })
    .eq("id", mv.channel_id);
  console.log("  ✓ Adiz channel scope → national");

  // 4. Look up the flagship knect-tv-live channel
  const { data: knect } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", "knect-tv-live")
    .maybeSingle();
  if (!knect) {
    console.warn("knect-tv-live channel not found — skipping rotation step.");
    return;
  }
  console.log(`Found knect-tv-live (${knect.id})`);

  // 5. Insert a copy of the music video on knect-tv-live (idempotent: look up first)
  let knectVideoId;
  const { data: existing } = await supabase
    .from("channel_videos")
    .select("id")
    .eq("channel_id", knect.id)
    .eq("mux_playback_id", mv.mux_playback_id)
    .maybeSingle();
  if (existing) {
    knectVideoId = existing.id;
    console.log(`  · existing knect-tv-live row reused: ${knectVideoId}`);
  } else {
    const { data: created, error } = await supabase
      .from("channel_videos")
      .insert({
        channel_id: knect.id,
        title: mv.title,
        description:
          mv.description ??
          "Westside Party — the official music video by Adiz the BAM. Featured on Hub City.",
        video_type: "featured",
        mux_asset_id: mv.mux_asset_id,
        mux_playback_id: mv.mux_playback_id,
        status: "ready",
        duration: mv.duration,
        thumbnail_url: mv.thumbnail_url,
        is_published: true,
        is_featured: true,
        published_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) throw error;
    knectVideoId = created.id;
    console.log(`  ✓ inserted knect-tv-live row: ${knectVideoId}`);
  }

  // 6. Prepend the music video to the knect-tv-live rotation. Wipe any
  //    rotation rows pointing at this Mux asset first so the queue stays
  //    a single fresh insert.
  await supabase
    .from("scheduled_broadcasts")
    .delete()
    .eq("channel_id", knect.id)
    .in("video_id", [knectVideoId, mv.id]);

  const dur = Math.max(60, Math.round(mv.duration ?? 170));
  const now = new Date();
  function iso(offsetSec) {
    return new Date(now.getTime() + offsetSec * 1000).toISOString();
  }

  // Two back-to-back airings at the top of the queue
  const rotation = [
    { position: 1, starts: 0, ends: dur },
    { position: 2, starts: dur, ends: dur * 2 },
  ];
  for (const slot of rotation) {
    await supabase.from("scheduled_broadcasts").insert({
      channel_id: knect.id,
      video_id: knectVideoId,
      starts_at: iso(slot.starts),
      ends_at: iso(slot.ends),
      position: slot.position,
      is_ad_slot: false,
    });
    console.log(`  ✓ scheduled slot ${slot.position}`);
  }

  console.log("\nDone — Westside Party is featured + on the on-air rotation.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
