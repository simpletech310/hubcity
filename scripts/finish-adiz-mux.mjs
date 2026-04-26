#!/usr/bin/env node

/**
 * Finish what seed-real-adiz-element78.mjs started but couldn't:
 *   - Free 1 Mux asset slot by deleting the oldest orphan (a Mux asset
 *     whose playback_id isn't referenced by any tracks/channel_videos/
 *     podcasts row).
 *   - Upload the Westside Party MP4 music video to Mux.
 *   - Reuse the Westside Party MP3 audio asset that already uploaded
 *     successfully in the prior run.
 *   - Insert album "Westside Party" + 1 track on Adiz's channel.
 *   - Insert channel_video "Westside Party (Official Music Video)".
 *   - Build a clean on-air rotation: music video looping.
 *   - (Skips the Element 78 pre-roll ad Mux upload — Mux free-tier
 *     cap doesn't have room for it. Rotation is just the MV.)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

const ADIZ_VIDEO_PATH =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Creator/adizthebam post/video/Westside Party (Official Music Video).mp4";

// The audio asset that uploaded in the prior run. From mux-list output.
const AUDIO_ASSET_ID = "Clwgmvoie4a8DOMD5DTk6c8z11iirrkO8c00SPGvxhMI";
const AUDIO_PLAYBACK_ID = "GhKpV5Pc7x3PPRNBbfZ7tfjRVpkDivx3ga5SdK4ZkS00";

async function muxApi(method, path, body) {
  const res = await fetch(`https://api.mux.com${path}`, {
    method,
    headers: {
      Authorization: `Basic ${MUX_AUTH}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Mux ${method} ${path} → ${res.status} ${await res.text()}`);
  if (method === "DELETE") return null;
  return res.json();
}

async function muxListAssets() {
  const data = await muxApi("GET", "/video/v1/assets?limit=100");
  return data.data;
}

async function freeOneMuxSlot() {
  const assets = await muxListAssets();
  console.log(`Mux currently has ${assets.length} assets`);
  if (assets.length < 10) {
    console.log("  → already room; skipping orphan cleanup");
    return;
  }

  // Build the in-use set from DB
  const [tracksR, cvR, podcastsR] = await Promise.all([
    supabase.from("tracks").select("mux_playback_id, mux_asset_id").not("mux_playback_id", "is", null),
    supabase.from("channel_videos").select("mux_playback_id, mux_asset_id").not("mux_playback_id", "is", null),
    supabase.from("podcasts").select("mux_playback_id, mux_asset_id").not("mux_playback_id", "is", null),
  ]);
  const inUsePlayback = new Set();
  const inUseAsset = new Set();
  for (const r of [...(tracksR.data ?? []), ...(cvR.data ?? []), ...(podcastsR.data ?? [])]) {
    if (r.mux_playback_id) inUsePlayback.add(r.mux_playback_id);
    if (r.mux_asset_id) inUseAsset.add(r.mux_asset_id);
  }
  // Reserve the audio asset we want to use
  inUsePlayback.add(AUDIO_PLAYBACK_ID);
  inUseAsset.add(AUDIO_ASSET_ID);

  // Find orphans: assets whose playback_id is NOT in DB
  const orphans = [];
  for (const a of assets) {
    const pbs = a.playback_ids?.map((p) => p.id) ?? [];
    const referenced = pbs.some((pb) => inUsePlayback.has(pb)) || inUseAsset.has(a.id);
    if (!referenced) orphans.push(a);
  }
  console.log(`  found ${orphans.length} orphaned Mux assets`);

  if (orphans.length === 0) {
    console.warn("  no orphans found! Cannot free a slot automatically.");
    console.warn("  Manually delete a Mux asset and re-run, or upgrade plan.");
    process.exit(1);
  }

  // Sort orphans by created_at ascending and delete the oldest ONE
  orphans.sort((a, b) => Number(a.created_at) - Number(b.created_at));
  const target = orphans[0];
  const targetPb = target.playback_ids?.[0]?.id ?? "(no pb)";
  console.log(`  deleting oldest orphan: asset=${target.id} pb=${targetPb} created=${new Date(Number(target.created_at) * 1000).toISOString()}`);
  await muxApi("DELETE", `/video/v1/assets/${target.id}`);
  console.log("  ✓ deleted");
}

async function muxUpload(filePath, contentType, label) {
  console.log(`[mux:${label}] creating direct upload...`);
  const created = await muxApi("POST", "/video/v1/uploads", {
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
      max_resolution_tier: "1080p",
    },
  });
  const upload = created.data;
  console.log(`[mux:${label}] PUTting body...`);
  const buf = readFileSync(filePath);
  const putRes = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: buf,
  });
  if (!putRes.ok) throw new Error(`Mux PUT ${label}: ${putRes.status} ${await putRes.text()}`);

  console.log(`[mux:${label}] polling for asset_id...`);
  let assetId = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const u = await muxApi("GET", `/video/v1/uploads/${upload.id}`);
    if (u.data.asset_id) {
      assetId = u.data.asset_id;
      break;
    }
  }
  if (!assetId) throw new Error(`Mux ${label}: no asset_id after 120s`);

  console.log(`[mux:${label}] polling asset until ready...`);
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const a = await muxApi("GET", `/video/v1/assets/${assetId}`);
    if (a.data.status === "ready") {
      const playbackId = a.data.playback_ids?.[0]?.id;
      const duration = a.data.duration;
      console.log(`[mux:${label}] READY playback=${playbackId} dur=${duration?.toFixed?.(1)}s`);
      return { asset_id: assetId, playback_id: playbackId, duration };
    }
    if (a.data.status === "errored") {
      throw new Error(`Mux ${label} errored: ${JSON.stringify(a.data.errors)}`);
    }
  }
  throw new Error(`Mux ${label}: not ready after 300s`);
}

async function main() {
  // Resolve adiz + channel
  const { data: adizRows } = await supabase
    .from("profiles")
    .select("id")
    .or("handle.ilike.%adiz%,display_name.ilike.%adiz%,display_name.ilike.%bam%")
    .order("created_at", { ascending: false })
    .limit(1);
  const ADIZ_ID = adizRows[0].id;
  const { data: chRows } = await supabase
    .from("channels")
    .select("id")
    .eq("owner_id", ADIZ_ID)
    .order("created_at", { ascending: true })
    .limit(1);
  const ADIZ_CHANNEL_ID = chRows[0].id;
  console.log(`Adiz profile=${ADIZ_ID} channel=${ADIZ_CHANNEL_ID}`);

  // Read audio duration from the existing Mux asset
  const audioInfo = await muxApi("GET", `/video/v1/assets/${AUDIO_ASSET_ID}`);
  const audioDuration = audioInfo.data.duration;
  console.log(`Reusing audio asset (Westside Party MP3): pb=${AUDIO_PLAYBACK_ID} dur=${audioDuration?.toFixed?.(1)}s`);

  // Fetch one of Adiz's images to use as album cover
  const { data: adizPosts } = await supabase
    .from("posts")
    .select("image_url")
    .eq("author_id", ADIZ_ID)
    .like("image_url", "%adizthebam%")
    .order("created_at", { ascending: false })
    .limit(1);
  const albumCover = adizPosts?.[0]?.image_url ?? null;

  // Free a Mux slot (only if needed)
  console.log("\n[mux] freeing slot if needed...");
  await freeOneMuxSlot();

  // Upload the music video MP4
  console.log("\n[mux] uploading Westside Party music video...");
  const mv = await muxUpload(ADIZ_VIDEO_PATH, "video/mp4", "westside-mv");

  // Insert album using the AUDIO Mux asset
  console.log("\n[db] inserting album + track + channel video + rotation...");

  // Idempotency: clean any prior 'westside-party' album from a partial run
  await supabase.from("albums").delete().eq("slug", "westside-party");

  const { data: albumRow, error: albumErr } = await supabase
    .from("albums")
    .insert({
      creator_id: ADIZ_ID,
      channel_id: ADIZ_CHANNEL_ID,
      slug: "westside-party",
      title: "Westside Party",
      description: "The Bam x Saucy Santana — Westside Party. Official single. Compton stand up.",
      release_type: "single",
      cover_art_url: albumCover,
      genre_slug: "hip-hop",
      release_date: new Date().toISOString().slice(0, 10),
      access_type: "free",
      is_published: true,
      is_demo: false,
    })
    .select("id")
    .single();
  if (albumErr) throw albumErr;

  const { data: trackRow, error: trackErr } = await supabase
    .from("tracks")
    .insert({
      album_id: albumRow.id,
      channel_id: ADIZ_CHANNEL_ID,
      creator_id: ADIZ_ID,
      title: "Westside Party",
      track_number: 1,
      duration_seconds: Math.round(audioDuration ?? 0) || null,
      mux_asset_id: AUDIO_ASSET_ID,
      mux_playback_id: AUDIO_PLAYBACK_ID,
      mux_status: "ready",
      genre_slug: "hip-hop",
      features: ["Saucy Santana"],
      is_published: true,
      is_demo: false,
    })
    .select("id")
    .single();
  if (trackErr) throw trackErr;

  // Pin the track as Adiz's featured media
  await supabase.from("profiles").update({
    featured_kind: "track",
    featured_id: trackRow.id,
    featured_caption: "Westside Party — out now",
    featured_set_at: new Date().toISOString(),
  }).eq("id", ADIZ_ID);

  // Insert channel video for the music video
  const { data: mvRow, error: mvErr } = await supabase
    .from("channel_videos")
    .insert({
      channel_id: ADIZ_CHANNEL_ID,
      title: "Westside Party (Official Music Video)",
      description: "The Bam x Saucy Santana — Westside Party. Official music video, shot in Compton.",
      video_type: "original",
      mux_asset_id: mv.asset_id,
      mux_playback_id: mv.playback_id,
      status: "ready",
      duration: mv.duration ?? null,
      thumbnail_url: `https://image.mux.com/${mv.playback_id}/thumbnail.webp?width=1280&height=720&fit_mode=smartcrop&time=2`,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (mvErr) throw mvErr;

  // Build rotation: music video looping (no ad, since Mux is at cap)
  const now = new Date();
  const mvSec = Math.max(60, Math.round(mv.duration ?? 240));
  function iso(off) { return new Date(now.getTime() + off * 1000).toISOString(); }

  // Wipe any leftover scheduled broadcasts for the channel
  await supabase.from("scheduled_broadcasts").delete().eq("channel_id", ADIZ_CHANNEL_ID);

  await supabase.from("scheduled_broadcasts").insert([
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id, starts_at: iso(0),               ends_at: iso(mvSec),         position: 1, is_ad_slot: false },
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id, starts_at: iso(mvSec),           ends_at: iso(mvSec * 2),     position: 2, is_ad_slot: false },
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id, starts_at: iso(mvSec * 2),       ends_at: iso(mvSec * 3),     position: 3, is_ad_slot: false },
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id, starts_at: iso(mvSec * 3),       ends_at: iso(mvSec * 4),     position: 4, is_ad_slot: false },
  ]);

  await supabase.from("channels").update({ is_live_simulated: true }).eq("id", ADIZ_CHANNEL_ID);

  console.log("\n=== DONE ===");
  console.log(JSON.stringify({
    album_id: albumRow.id,
    track_id: trackRow.id,
    audio_playback_id: AUDIO_PLAYBACK_ID,
    music_video_id: mvRow.id,
    music_video_playback_id: mv.playback_id,
    rotation_slots: 4,
  }, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
