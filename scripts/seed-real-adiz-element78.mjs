#!/usr/bin/env node

/**
 * Replace the placeholder Adiz the BAM + Element 78 seed content
 * (created by migrations 105/106) with the REAL assets shipped in
 * /Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/.
 *
 * For Element 78:
 *   - Upload all 7 product/lifestyle JPGs and the 3 .mov clips
 *   - Replace business.image_urls with the real photo URLs
 *   - Insert one post per JPG (4 posts) and one reel per .mov (3 reels)
 *
 * For Adiz the BAM:
 *   - Upload all 6 JPGs and 4 .mov clips → posts + reels
 *   - Upload "Westside Party (Official Music Video).mp3" to Mux as
 *     audio → real album + track on the Frequency hub
 *   - Upload "Westside Party (Official Music Video).mp4" to Mux as
 *     video → channel_videos row on her channel + on-air rotation
 *   - Upload one Element 78 .mov to Mux as the pre-roll ad creative
 *     so the simulated-live rotation plays an ad → her music video
 *
 * Idempotent. Re-running:
 *   - Re-uploads files with `upsert: true` so storage doesn't error
 *   - Wipes prior placeholder rows (unsplash/pexels URLs, demo- mux ids)
 *   - Re-inserts fresh rows pointing at the real uploads
 *   - Re-uploads to Mux (creates fresh assets — old Mux assets are
 *     left behind; clean those out of Mux if needed)
 *
 * Usage:
 *   node scripts/seed-real-adiz-element78.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync, existsSync } from "node:fs";
import { basename, extname, dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

// ── Env loading ─────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  /* fall through to env */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;

for (const [k, v] of Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_KEY,
  MUX_TOKEN_ID,
  MUX_TOKEN_SECRET,
})) {
  if (!v) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Mux helpers ─────────────────────────────────────────────────────────
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

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
  return res.json();
}

async function muxUploadFile(filePath, contentType, label) {
  console.log(`  [mux:${label}] creating direct upload...`);
  const created = await muxApi("POST", "/video/v1/uploads", {
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
      max_resolution_tier: "1080p",
    },
  });
  const upload = created.data;
  console.log(`  [mux:${label}] PUT body to upload URL...`);
  const fileBuffer = readFileSync(filePath);
  const putRes = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: fileBuffer,
  });
  if (!putRes.ok) throw new Error(`Mux PUT ${label}: ${putRes.status} ${await putRes.text()}`);

  console.log(`  [mux:${label}] polling for asset_id...`);
  let assetId = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const u = await muxApi("GET", `/video/v1/uploads/${upload.id}`);
    if (u.data.asset_id) {
      assetId = u.data.asset_id;
      break;
    }
  }
  if (!assetId) throw new Error(`Mux ${label}: timed out waiting for asset_id`);

  console.log(`  [mux:${label}] polling asset until ready...`);
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 2500));
    const a = await muxApi("GET", `/video/v1/assets/${assetId}`);
    if (a.data.status === "ready") {
      const playbackId = a.data.playback_ids?.[0]?.id;
      const duration = a.data.duration;
      console.log(`  [mux:${label}] READY playback_id=${playbackId} duration=${duration?.toFixed?.(1) ?? duration}s`);
      return { asset_id: assetId, playback_id: playbackId, duration };
    }
    if (a.data.status === "errored") {
      throw new Error(`Mux ${label}: errored ${JSON.stringify(a.data.errors)}`);
    }
  }
  throw new Error(`Mux ${label}: timed out waiting for ready status`);
}

// ── Storage helpers ─────────────────────────────────────────────────────
const CT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
};

async function uploadToBucket(bucket, storagePath, filePath) {
  const buf = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = CT[ext] ?? "application/octet-stream";
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${storagePath}: ${error.message}`);
  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

// ── Asset paths ─────────────────────────────────────────────────────────
const ASSETS = "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts";
const E78_DIR = `${ASSETS}/Businesses/element 78 busniess`;
const ADIZ_DIR = `${ASSETS}/Creator/adizthebam post`;
const ADIZ_AUDIO = `${ADIZ_DIR}/Music/Westside Party (Official Music Video).mp3`;
const ADIZ_VIDEO = `${ADIZ_DIR}/video/Westside Party (Official Music Video).mp4`;

const E78_IMAGES = [
  "IMG_3314.jpg",
  "IMG_3316.jpg",
  "IMG_3318.jpg",
  "IMG_3319.jpg",
  "IMG_3321.jpg",
  "IMG_3322.jpg",
  "IMG_3323.jpg",
];
const E78_VIDEOS = [
  "ScreenRecording_04-26-2026 14-54-43_1.mov",
  "ScreenRecording_04-26-2026 14-55-30_1.mov",
  "ScreenRecording_04-26-2026 14-56-32_1.mov",
];

const ADIZ_IMAGES = [
  "IMG_3304.jpg",
  "IMG_3305.jpg",
  "IMG_3306.jpg",
  "IMG_3307.jpg",
  "IMG_3308.jpg",
  "IMG_3311.jpg",
];
const ADIZ_VIDEOS = [
  "ScreenRecording_04-26-2026 14-51-21_1.mov",
  "ScreenRecording_04-26-2026 14-52-10_1.mov",
  "ScreenRecording_04-26-2026 14-52-53_1.mov",
  "ScreenRecording_04-26-2026 14-53-30_1.mov",
];

// Captions (one per asset; deterministic so re-runs match prior inserts)
const E78_POST_CAPTIONS = [
  "First drop is in. Training Tees, Performance Joggers, and the Tripod Hydration Bottle — built for Compton athletes.",
  "Studio's open Saturday. Drop-in strength session 9am, retail floor open all day.",
  "New colorway dropped. Black-on-black for the early mornings.",
  "Tripod Hydration — set it down, snap a clip, keep training. Stainless, BPA-free, 32oz.",
  "Pull up to 1078 Compton Blvd. Walk-throughs welcome.",
  "Element 78 — built where we train.",
  "Programs are open for the spring cohort. DM to claim a spot.",
];
const E78_REEL_CAPTIONS = [
  "Inside the studio — Compton-built apparel, in motion.",
  "First drop, on the floor.",
  "How we move at Element 78.",
];

const ADIZ_POST_CAPTIONS = [
  "Studio session, finishing touches on Westside Party. Compton stand up.",
  "From the lab. New record, same roots.",
  "Backstage at Compton Center — about to run it.",
  "Behind the scenes on the Westside Party visual.",
  "BAM SZN. Out now on Frequency.",
  "Hub City forever. New visuals dropping.",
];
const ADIZ_REEL_CAPTIONS = [
  "Westside Party — preview clip.",
  "Studio session. Locked in.",
  "Behind the scenes on the visual.",
  "Live cut — Compton Center.",
];

// Helper to skim a few hashtags
const E78_TAGS = ["element78", "compton", "fitness"];
const ADIZ_TAGS = ["compton", "adizthebam", "westsideparty"];

const E78_OWNER_ID = "b7800001-0000-4000-8000-000000007800";
const E78_BUSINESS_ID = "b7800002-0000-4000-8000-000000007800";

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  // 1. Resolve Adiz profile + her channel
  const { data: adizRows, error: adizErr } = await supabase
    .from("profiles")
    .select("id, display_name, handle")
    .or("handle.ilike.%adiz%,display_name.ilike.%adiz%,display_name.ilike.%bam%")
    .order("created_at", { ascending: false })
    .limit(1);
  if (adizErr) throw adizErr;
  if (!adizRows?.length) throw new Error("Adiz the BAM profile not found in DB.");
  const ADIZ_ID = adizRows[0].id;
  console.log(`Adiz profile: ${adizRows[0].display_name} (${adizRows[0].handle}) ${ADIZ_ID}`);

  const { data: chRows, error: chErr } = await supabase
    .from("channels")
    .select("id, slug, name")
    .eq("owner_id", ADIZ_ID)
    .order("created_at", { ascending: true })
    .limit(1);
  if (chErr) throw chErr;
  if (!chRows?.length) throw new Error("Adiz channel not found.");
  const ADIZ_CHANNEL_ID = chRows[0].id;
  console.log(`Adiz channel: ${chRows[0].name} (${chRows[0].slug}) ${ADIZ_CHANNEL_ID}`);

  // ── 2. Cleanup phase ────────────────────────────────────────────────
  console.log("\n[cleanup] removing placeholder rows from migrations 105/106...");

  // Posts: remove unsplash-backed posts authored by adiz or e78
  await supabase.from("posts").delete()
    .in("author_id", [ADIZ_ID, E78_OWNER_ID])
    .like("image_url", "%images.unsplash.com%");

  // Reels: remove pexels-backed reels by adiz or e78
  await supabase.from("reels").delete()
    .in("author_id", [ADIZ_ID, E78_OWNER_ID])
    .like("video_url", "%videos.pexels.com%");

  // Adiz album/track placeholder from 105 (slug bam-szn-2026)
  await supabase.from("albums").delete().eq("slug", "bam-szn-2026"); // tracks cascade

  // Adiz channel videos with demo mux ids
  await supabase.from("channel_videos").delete()
    .eq("channel_id", ADIZ_CHANNEL_ID)
    .like("mux_playback_id", "demo-%");

  // Wipe future scheduled broadcasts for adiz channel
  await supabase.from("scheduled_broadcasts").delete()
    .eq("channel_id", ADIZ_CHANNEL_ID);

  // Reset Adiz featured pin if it pointed at a deleted track
  await supabase.from("profiles").update({
    featured_kind: null,
    featured_id: null,
    featured_caption: null,
    featured_set_at: null,
  }).eq("id", ADIZ_ID);

  console.log("[cleanup] done.");

  // ── 3. Element 78 image + video uploads ─────────────────────────────
  console.log("\n[element78] uploading images + videos to Supabase storage...");
  const e78ImageUrls = [];
  for (let i = 0; i < E78_IMAGES.length; i++) {
    const fname = E78_IMAGES[i];
    const url = await uploadToBucket(
      "post-images",
      `seed/element78/${fname}`,
      `${E78_DIR}/${fname}`
    );
    e78ImageUrls.push(url);
    console.log(`  e78 img ${i + 1}/${E78_IMAGES.length} → ${url.split("/").slice(-2).join("/")}`);
  }
  const e78ReelData = [];
  for (let i = 0; i < E78_VIDEOS.length; i++) {
    const fname = E78_VIDEOS[i];
    const dest = `seed/element78/${fname.replace(/\s+/g, "_")}`;
    const url = await uploadToBucket("reels", dest, `${E78_DIR}/${fname}`);
    e78ReelData.push({ video_url: url, video_path: dest });
    console.log(`  e78 reel ${i + 1}/${E78_VIDEOS.length} → ${dest}`);
  }

  // Refresh businesses.image_urls to point at real photos (first 3 JPGs)
  await supabase.from("businesses").update({
    image_urls: e78ImageUrls.slice(0, 3),
    updated_at: new Date().toISOString(),
  }).eq("id", E78_BUSINESS_ID);

  // Insert Element 78 posts (1 per JPG, up to 4 to keep the feed tidy)
  for (let i = 0; i < Math.min(4, E78_IMAGES.length); i++) {
    await supabase.from("posts").insert({
      author_id: E78_OWNER_ID,
      body: E78_POST_CAPTIONS[i] ?? "Element 78 — Compton-built.",
      image_url: e78ImageUrls[i],
      is_published: true,
      hashtags: E78_TAGS,
    });
  }
  console.log(`[element78] inserted ${Math.min(4, E78_IMAGES.length)} posts.`);

  // Insert Element 78 reels
  for (let i = 0; i < e78ReelData.length; i++) {
    await supabase.from("reels").insert({
      author_id: E78_OWNER_ID,
      video_url: e78ReelData[i].video_url,
      video_path: e78ReelData[i].video_path,
      poster_url: e78ImageUrls[(i + 4) % e78ImageUrls.length] ?? null,
      poster_path: null,
      caption: E78_REEL_CAPTIONS[i] ?? "Element 78",
      duration_seconds: null,
      width: 1080,
      height: 1920,
      is_published: true,
      hashtags: E78_TAGS,
    });
  }
  console.log(`[element78] inserted ${e78ReelData.length} reels.`);

  // ── 4. Adiz image + video uploads (storage) ─────────────────────────
  console.log("\n[adiz] uploading images + videos to Supabase storage...");
  const adizImageUrls = [];
  for (let i = 0; i < ADIZ_IMAGES.length; i++) {
    const fname = ADIZ_IMAGES[i];
    const url = await uploadToBucket(
      "post-images",
      `seed/adizthebam/${fname}`,
      `${ADIZ_DIR}/${fname}`
    );
    adizImageUrls.push(url);
    console.log(`  adiz img ${i + 1}/${ADIZ_IMAGES.length} → ${url.split("/").slice(-2).join("/")}`);
  }
  const adizReelData = [];
  for (let i = 0; i < ADIZ_VIDEOS.length; i++) {
    const fname = ADIZ_VIDEOS[i];
    const dest = `seed/adizthebam/${fname.replace(/\s+/g, "_")}`;
    const url = await uploadToBucket("reels", dest, `${ADIZ_DIR}/${fname}`);
    adizReelData.push({ video_url: url, video_path: dest });
    console.log(`  adiz reel ${i + 1}/${ADIZ_VIDEOS.length} → ${dest}`);
  }

  // Adiz posts (up to 4)
  for (let i = 0; i < Math.min(4, ADIZ_IMAGES.length); i++) {
    await supabase.from("posts").insert({
      author_id: ADIZ_ID,
      body: ADIZ_POST_CAPTIONS[i] ?? "Adiz the BAM — Compton.",
      image_url: adizImageUrls[i],
      is_published: true,
      hashtags: ADIZ_TAGS,
    });
  }
  console.log(`[adiz] inserted ${Math.min(4, ADIZ_IMAGES.length)} posts.`);

  // Adiz reels (one per .mov)
  const adizReelIds = [];
  for (let i = 0; i < adizReelData.length; i++) {
    const { data, error } = await supabase.from("reels").insert({
      author_id: ADIZ_ID,
      video_url: adizReelData[i].video_url,
      video_path: adizReelData[i].video_path,
      poster_url: adizImageUrls[(i + 4) % adizImageUrls.length] ?? null,
      poster_path: null,
      caption: ADIZ_REEL_CAPTIONS[i] ?? "Adiz the BAM",
      duration_seconds: null,
      width: 1080,
      height: 1920,
      is_published: true,
      hashtags: ADIZ_TAGS,
    }).select("id").single();
    if (error) throw error;
    adizReelIds.push(data.id);
  }
  console.log(`[adiz] inserted ${adizReelData.length} reels.`);

  // ── 5. Mux uploads — three concurrent, audio + music video + ad ─────
  console.log("\n[mux] uploading 3 assets concurrently (audio, music video, e78 ad)...");
  // Pick the smallest e78 .mov as the ad (faster Mux processing)
  const e78AdSource = `${E78_DIR}/${E78_VIDEOS[2]}`; // 14-56-32_1.mov (~11MB)
  const [audio, musicVideo, adVideo] = await Promise.all([
    muxUploadFile(ADIZ_AUDIO, "audio/mpeg", "westside-audio"),
    muxUploadFile(ADIZ_VIDEO, "video/mp4", "westside-mv"),
    muxUploadFile(e78AdSource, "video/quicktime", "e78-ad"),
  ]);

  // Pick a square cover image for the album from the Adiz photo set
  const albumCover = adizImageUrls[0];

  // Insert real album + track
  const { data: albumRow, error: albumErr } = await supabase
    .from("albums")
    .insert({
      creator_id: ADIZ_ID,
      channel_id: ADIZ_CHANNEL_ID,
      slug: "westside-party",
      title: "Westside Party",
      description: "The official single. Compton stand up.",
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
      duration_seconds: Math.round(audio.duration ?? 0) || null,
      mux_asset_id: audio.asset_id,
      mux_playback_id: audio.playback_id,
      mux_status: "ready",
      genre_slug: "hip-hop",
      is_published: true,
      is_demo: false,
    })
    .select("id")
    .single();
  if (trackErr) throw trackErr;
  console.log(`[adiz] album=${albumRow.id} track=${trackRow.id}`);

  // Pin the track as her featured media
  await supabase.from("profiles").update({
    featured_kind: "track",
    featured_id: trackRow.id,
    featured_caption: "Westside Party — out now",
    featured_set_at: new Date().toISOString(),
  }).eq("id", ADIZ_ID);

  // Insert real channel videos: music video + Element 78 ad
  const { data: mvRow, error: mvErr } = await supabase
    .from("channel_videos")
    .insert({
      channel_id: ADIZ_CHANNEL_ID,
      title: "Westside Party (Official Music Video)",
      description: "The official music video for Westside Party — directed and shot in Compton.",
      video_type: "original",
      mux_asset_id: musicVideo.asset_id,
      mux_playback_id: musicVideo.playback_id,
      status: "ready",
      duration: musicVideo.duration ?? null,
      thumbnail_url: `https://image.mux.com/${musicVideo.playback_id}/thumbnail.webp?width=1280&height=720&fit_mode=smartcrop&time=2`,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (mvErr) throw mvErr;

  const { data: adRow, error: adErr } = await supabase
    .from("channel_videos")
    .insert({
      channel_id: ADIZ_CHANNEL_ID,
      title: "Element 78 — Move with Purpose",
      description: "Element 78 fitness apparel — Compton-built. Brand spot.",
      video_type: "on_demand",
      mux_asset_id: adVideo.asset_id,
      mux_playback_id: adVideo.playback_id,
      status: "ready",
      duration: adVideo.duration ?? null,
      thumbnail_url: `https://image.mux.com/${adVideo.playback_id}/thumbnail.webp?width=1280&height=720&fit_mode=smartcrop&time=1`,
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (adErr) throw adErr;
  console.log(`[adiz] music_video=${mvRow.id} ad_video=${adRow.id}`);

  // ── 6. On-air rotation ─────────────────────────────────────────────
  // Schedule: ad → music video → ad → music video, looping
  const now = new Date();
  const adSec = Math.max(15, Math.round(adVideo.duration ?? 30));
  const mvSec = Math.max(60, Math.round(musicVideo.duration ?? 240));

  function iso(offsetSec) {
    return new Date(now.getTime() + offsetSec * 1000).toISOString();
  }

  await supabase.from("scheduled_broadcasts").insert([
    { channel_id: ADIZ_CHANNEL_ID, video_id: adRow.id,  starts_at: iso(0),                     ends_at: iso(adSec),                       position: 1, is_ad_slot: true },
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id,  starts_at: iso(adSec),                 ends_at: iso(adSec + mvSec),               position: 2, is_ad_slot: false },
    { channel_id: ADIZ_CHANNEL_ID, video_id: adRow.id,  starts_at: iso(adSec + mvSec),         ends_at: iso(adSec * 2 + mvSec),           position: 3, is_ad_slot: true },
    { channel_id: ADIZ_CHANNEL_ID, video_id: mvRow.id,  starts_at: iso(adSec * 2 + mvSec),     ends_at: iso(adSec * 2 + mvSec * 2),       position: 4, is_ad_slot: false },
  ]);

  // Make sure the channel is flagged as live-simulated
  await supabase.from("channels").update({ is_live_simulated: true }).eq("id", ADIZ_CHANNEL_ID);

  console.log("\n=== DONE ===");
  console.log(JSON.stringify({
    adiz: {
      profile_id: ADIZ_ID,
      channel_id: ADIZ_CHANNEL_ID,
      posts: Math.min(4, ADIZ_IMAGES.length),
      reels: adizReelData.length,
      album_id: albumRow.id,
      track_id: trackRow.id,
      music_video_id: mvRow.id,
      ad_video_id: adRow.id,
      audio_playback_id: audio.playback_id,
      music_video_playback_id: musicVideo.playback_id,
    },
    element78: {
      owner_id: E78_OWNER_ID,
      business_id: E78_BUSINESS_ID,
      images_uploaded: e78ImageUrls.length,
      posts: Math.min(4, E78_IMAGES.length),
      reels: e78ReelData.length,
      ad_uploaded_to_mux: adVideo.playback_id,
    },
  }, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
