#!/usr/bin/env node
/**
 * Two production data fixes for the live + watch experience:
 *
 * 1. Disable any pre-roll video_ad whose mux_playback_id no longer
 *    resolves to a real Mux asset. The player was showing
 *    "Video does not exist" because Mux returned 404 for the asset
 *    while the ad row was still flagged is_active = TRUE.
 *
 * 2. Flip every published channel_video to access_type = 'free' and
 *    is_premium = false so demo videos (e.g. The Ebony Witch pilot)
 *    play inline on /live/watch instead of bouncing to the paywall.
 *    Re-run if you intentionally want a video gated again.
 *
 * Usage: node scripts/fix-live-playback.mjs
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const MUX_TOKEN_ID = process.env.MUX_TOKEN_ID;
const MUX_TOKEN_SECRET = process.env.MUX_TOKEN_SECRET;
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

/**
 * Mux can leave a playback-id record in place after the underlying
 * asset has been deleted, so the playback-ids endpoint still returns
 * 200 but the actual stream 404s. Walk through to the asset to be
 * sure the stream is real.
 */
async function muxPlaybackExists(playbackId) {
  if (!playbackId) return false;
  // 1. Resolve the playback id → asset id.
  const r1 = await fetch(
    `https://api.mux.com/video/v1/playback-ids/${playbackId}`,
    { headers: { Authorization: `Basic ${MUX_AUTH}` } }
  );
  if (r1.status === 404) return false;
  if (!r1.ok) {
    console.warn(`  warn: mux pb-id returned ${r1.status} for ${playbackId}`);
    return true; // err on the side of leaving good ads alone
  }
  const j = await r1.json();
  const assetId = j?.data?.object?.id;
  if (!assetId) return false;
  // 2. Verify the asset itself exists and is ready.
  const r2 = await fetch(`https://api.mux.com/video/v1/assets/${assetId}`, {
    headers: { Authorization: `Basic ${MUX_AUTH}` },
  });
  if (r2.status === 404) return false;
  if (!r2.ok) {
    console.warn(`  warn: mux asset returned ${r2.status} for ${assetId}`);
    return true;
  }
  const a = await r2.json();
  return a?.data?.status === "ready";
}

async function disableBrokenAds() {
  console.log("\n[1/2] Auditing pre-roll video_ads for missing Mux assets...");
  const { data: ads, error } = await supabase
    .from("video_ads")
    .select("id, title, mux_playback_id, is_active")
    .eq("is_active", true)
    .not("mux_playback_id", "is", null);
  if (error) throw error;
  if (!ads || ads.length === 0) {
    console.log("  no active ads found");
    return;
  }
  console.log(`  ${ads.length} active ad(s)`);
  let disabled = 0;
  for (const ad of ads) {
    const exists = await muxPlaybackExists(ad.mux_playback_id);
    if (!exists) {
      console.log(`  ✗ ${ad.title} (${ad.mux_playback_id}) — not in Mux, disabling`);
      const { error: updErr } = await supabase
        .from("video_ads")
        .update({ is_active: false })
        .eq("id", ad.id);
      if (updErr) throw updErr;
      disabled++;
    } else {
      console.log(`  ✓ ${ad.title} (${ad.mux_playback_id})`);
    }
  }
  console.log(`  disabled ${disabled} broken ad(s)`);
}

async function freePremiumVideos() {
  console.log("\n[2/2] Flipping all published channel_videos to free...");
  const { data: gated, error } = await supabase
    .from("channel_videos")
    .select("id, title, access_type, is_premium")
    .eq("is_published", true)
    .or("access_type.neq.free,is_premium.eq.true");
  if (error) throw error;
  if (!gated || gated.length === 0) {
    console.log("  no gated videos found — nothing to do");
    return;
  }
  console.log(`  ${gated.length} gated video(s):`);
  for (const v of gated) {
    console.log(`    ${v.title} (access=${v.access_type} premium=${v.is_premium})`);
  }
  const { error: updErr } = await supabase
    .from("channel_videos")
    .update({ access_type: "free", is_premium: false, price_cents: null })
    .in(
      "id",
      gated.map((v) => v.id)
    );
  if (updErr) throw updErr;
  console.log(`  ✓ ${gated.length} video(s) set to access_type=free, is_premium=false`);
}

async function main() {
  await disableBrokenAds();
  await freePremiumVideos();
  console.log("\n=== DONE ===");
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
