#!/usr/bin/env node
/**
 * Restore the three real music videos that the seed-onair-real.mjs
 * wipe inadvertently deleted on a rerun:
 *   - Westside Party (Adiz channel + knect-tv-live copy)
 *   - YAYA Remix (Compton Av · Steelz · Snoop · 310babii) on Culture
 *   - I'm Not Scared of Y.Ns (Mario Tory) on Culture
 *
 * Each row gets the [hub-music-rail] tag so /live's Music Videos
 * rail picks it up. seed-onair-real.mjs no longer deletes these
 * because the music tag is now distinct from the cinema-seed marker.
 *
 * Idempotent — skips rows that already exist for the same Mux id +
 * channel pair.
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

const MUSIC_TAG = "[hub-music-rail]";
// Square (930x930) cover — the original 1697x930 PNG didn't crop nicely
// into the 1:1 FEATURED SINGLE hero. See scripts/upload-westside-square-cover.mjs.
const WESTSIDE_COVER =
  "https://fahqtnwwikvocpvvfgqi.supabase.co/storage/v1/object/public/post-images/adizthebam/westside-party-cover-square.png";

async function findChannel(slug) {
  const { data } = await supabase
    .from("channels")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

async function ensureVideo({ channelSlug, title, description, muxPlayback, muxAsset, duration, thumbnail, isFeatured }) {
  const channelId = await findChannel(channelSlug);
  if (!channelId) {
    console.warn(`  ! channel ${channelSlug} not found`);
    return;
  }
  const { data: existing } = await supabase
    .from("channel_videos")
    .select("id")
    .eq("channel_id", channelId)
    .eq("mux_playback_id", muxPlayback)
    .maybeSingle();
  if (existing) {
    // Update description so the music tag is present.
    const { data: row } = await supabase
      .from("channel_videos")
      .select("description")
      .eq("id", existing.id)
      .single();
    const desc = row?.description ?? "";
    if (!desc.includes(MUSIC_TAG)) {
      const cleaned = desc
        .replace(/\n*\[hub-(cinema-seed[^\]]*|music-rail)\]/g, "")
        .trim();
      const next = cleaned ? `${cleaned}\n\n${MUSIC_TAG}` : MUSIC_TAG;
      await supabase
        .from("channel_videos")
        .update({ description: next })
        .eq("id", existing.id);
    }
    console.log(`  ⊘ ${title} on ${channelSlug} already exists — tag refreshed`);
    return;
  }
  const { error } = await supabase.from("channel_videos").insert({
    channel_id: channelId,
    title,
    description: `${description}\n\n${MUSIC_TAG}`,
    video_type: isFeatured ? "featured" : "on_demand",
    mux_playback_id: muxPlayback,
    mux_asset_id: muxAsset,
    duration,
    thumbnail_url: thumbnail,
    status: "ready",
    is_published: true,
    is_featured: isFeatured,
    published_at: new Date().toISOString(),
  });
  if (error) console.warn(`  ! ${title} on ${channelSlug}: ${error.message}`);
  else console.log(`  ✓ ${title} on ${channelSlug}`);
}

async function main() {
  // 1. Westside Party — Adiz's home channel.
  await ensureVideo({
    channelSlug: "adizthebam",
    title: "Westside Party (Official Music Video)",
    description:
      "Adiz the Bam — Westside Party (Official Music Video). Compton stand up.",
    muxPlayback: "EaCHsgmWo7xkN00Pun5uVna7Bb02FzUDtZTY01q00NqRXAg",
    muxAsset: "XtRa4xIcdOWVIsvKGBnJmOdaT00XZLy2Srh6E6BqDtw8",
    duration: 169,
    thumbnail: WESTSIDE_COVER,
    isFeatured: true,
  });

  // 2. Westside Party — knect-tv-live rotation copy.
  await ensureVideo({
    channelSlug: "knect-tv-live",
    title: "Westside Party (Official Music Video)",
    description:
      "Adiz the Bam — Westside Party (Official Music Video). On rotation on Culture TV Live.",
    muxPlayback: "EaCHsgmWo7xkN00Pun5uVna7Bb02FzUDtZTY01q00NqRXAg",
    muxAsset: "XtRa4xIcdOWVIsvKGBnJmOdaT00XZLy2Srh6E6BqDtw8",
    duration: 169,
    thumbnail: WESTSIDE_COVER,
    isFeatured: true,
  });

  // 3. YAYA (Remix) — Culture channel.
  await ensureVideo({
    channelSlug: "culture",
    title: "Compton Av, Steelz, Snoop Dogg & 310babii — YAYA (Remix)",
    description:
      "Compton Av, Steelz, Snoop Dogg, and 310babii — YAYA (Remix). Released on Empire / Rich Off Rap.",
    muxPlayback: "Pnkvm1o9R3IxVYKnueGeIMcSZNkoMV1Ot2oETkeBj8E",
    muxAsset: "yAsAYYgYJyTpjGLCWLPDnu3NJZ4P8XQm01DTYxbwbXzk",
    duration: 191,
    thumbnail: null,
    isFeatured: false,
  });

  // 4. I'm Not Scared of Y.Ns — Culture channel.
  await ensureVideo({
    channelSlug: "culture",
    title: "I'm Not Scared of Y.Ns — Mario Tory at Chocolate Sundaes",
    description:
      "Mario Tory's stand-up set from Chocolate Sundaes Comedy. Filmed in LA.",
    muxPlayback: "fvOt6Yr4VjM4cMi4wQ7qlSedZfWTr1z00yG4uH5QURmU",
    muxAsset: "VyDieRQBEj7BOSN7lb7RpoCzNvaRniziY9qWZBoGHp8",
    duration: 533,
    thumbnail: null,
    isFeatured: false,
  });

  console.log("\n→ verify on /live (Music Videos rail) + /channel/adizthebam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
