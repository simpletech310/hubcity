#!/usr/bin/env node
/**
 * Seed Fene310's "Real Negus Wednesday #RNW" podcast on /frequency
 * + a small batch of posts on his profile that promote the show.
 *
 *   1. Upload the podcast cover art to post-images/fene310/podcast/.
 *   2. Insert 5 podcast episodes (mux_playback_ids cycled from the
 *      existing pool used by the rest of the catalog) with
 *      show_slug="real-negus-wednesday".
 *   3. Upload 5 of his existing photo assets to post-images/ and
 *      create matching image posts where the body talks about the
 *      podcast — plus 3 text-only posts.
 *
 * Idempotent — wipes prior real-negus-wednesday rows + Fene's
 * podcast-tagged image/text posts before re-seeding.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
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

const FENE_USER_ID = "0cbc4a18-8b20-411b-971c-3c28205b84ae";
const FENE_HANDLE = "fene310";
const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Amassadors/post fene310";

const SHOW_SLUG = "real-negus-wednesday";
const SHOW_TITLE = "Real Negus Wednesday #RNW";
const SHOW_DESCRIPTION =
  "Real talks, convos, discussions, advice, and tips for relationships and " +
  "daily lives. Here 2 inspire. New drops every Wednesday with Fene310.";

// Reuse existing Mux audio playback ids — same pool every other
// podcast on the platform shares so demo playback works in dev.
const AUDIO_MUX_IDS = [
  "FsAe02FASMMw6J9027a00DPK02yDLbdh2fnrthJ8TnuMCpc",
  "GhKpV5Pc7x3PPRNBbfZ7tfjRVpkDivx3ga5SdK4ZkS00",
  "UrwbK00012al02HCAGiYMhHOn6rvJ00hl9mZLhLHo02go2Ko",
  "gYB4G2cW8pndjg8RrHEOlijUuHAaDy02w8jHgYTnf3xE",
];

const EPISODES = [
  {
    title: "Pilot — Why I Started Real Negus Wednesday",
    description:
      "How #RNW started, what we're here to do, and why Wednesday. " +
      "Fene310 sets the table for the season.",
    duration: 1820,
  },
  {
    title: "Boundaries Before Brunch — Relationships 101",
    description:
      "How to set boundaries early so you don't end up in situations you " +
      "can't text yourself out of. Plus a call-in from a real listener.",
    duration: 2110,
  },
  {
    title: "Soft Life vs. Real Life — Money, Mental, Movement",
    description:
      "The soft-life trend looks good on Instagram but what does it cost? " +
      "We talk about checking in on your peace and your bag at the same time.",
    duration: 1955,
  },
  {
    title: "Compton Energy — Loving Where You're From Out Loud",
    description:
      "Why representing the city ain't a fall-back, it's a flex. Local " +
      "guests pull up to talk about staying rooted while still leveling up.",
    duration: 2230,
  },
  {
    title: "Date Yourself First — Self-Worth Tips That Actually Work",
    description:
      "Practical, in-the-mirror, non-cliché advice for getting right with you " +
      "before getting right with anyone else. Listener questions answered.",
    duration: 1890,
  },
];

// Posts that promote the podcast — 5 image posts + 3 text posts.
// Image filenames map to the assets in ASSETS_DIR.
const IMAGE_POSTS = [
  {
    file: "IMG_2856.jpg",
    body:
      "NEW Wednesday drop is up — Real Negus Wednesday #RNW Ep. 1 is live. " +
      "Tap in. Tap a friend. Let's grow.",
  },
  {
    file: "IMG_2858.jpg",
    body:
      "Behind the mic this week. We talked boundaries, brunch, and not " +
      "playing yourself. New ep. drops Wednesday on Frequency.",
  },
  {
    file: "IMG_2859.jpg",
    body:
      "Soft life vs. real life — that's tomorrow's #RNW topic. What do you " +
      "actually want for yourself? Comments open.",
  },
  {
    file: "IMG_2861.jpg",
    body:
      "Compton energy. We don't outgrow the city — we grow with it. " +
      "Episode 4 of #RNW is for the home team.",
  },
  {
    file: "IMG_2876.jpg",
    body:
      "Dating yourself first ain't a hashtag, it's a lifestyle. " +
      "New #RNW lands Wednesday — set your reminder.",
  },
];

const TEXT_POSTS = [
  "If your peace costs you your purpose, the price is too high. " +
    "Tomorrow's #RNW gets into it.",
  "5 episodes deep into Real Negus Wednesday. Y'all keeping me honest in " +
    "the comments — keep it coming. Here 2 inspire.",
  "Wednesdays are for receipts, real talk, and reps. New #RNW up on " +
    "Frequency — go listen, share with somebody who needs it.",
];

// ── Helpers ─────────────────────────────────────────────────────

async function uploadFile(bucket, storagePath, filePath, contentType) {
  try {
    const buf = readFileSync(filePath);
    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buf, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });
    if (error) {
      console.warn(`  ! upload ${storagePath}: ${error.message}`);
      return null;
    }
    return supabase.storage.from(bucket).getPublicUrl(storagePath).data
      .publicUrl;
  } catch (e) {
    console.warn(`  ! read ${filePath}: ${e.message}`);
    return null;
  }
}

async function main() {
  // 1. Upload podcast cover.
  console.log("\n[cover]");
  const coverPath = join(ASSETS_DIR, "podcast cover .jpg");
  if (!statSync(coverPath, { throwIfNoEntry: false })) {
    console.error(`  ! cover not found at ${coverPath}`);
    process.exit(1);
  }
  const coverUrl = await uploadFile(
    "post-images",
    "fene310/podcast/cover.jpg",
    coverPath,
    "image/jpeg",
  );
  if (!coverUrl) process.exit(1);
  console.log(`  ✓ cover at ${coverUrl}`);

  // 2. Channel description tweak (so /channel/fene310 reads right).
  await supabase
    .from("channels")
    .update({
      description:
        "Fene310 — host of Real Negus Wednesday #RNW. Real talks, real " +
        "convos, real life. Here 2 inspire.",
    })
    .eq("slug", "fene310");

  // 3. Wipe prior #RNW episodes so reruns stay clean.
  console.log("\n[podcasts]");
  await supabase.from("podcasts").delete().eq("show_slug", SHOW_SLUG);

  // 4. Insert 5 episodes.
  const episodeRows = EPISODES.map((ep, i) => {
    const muxId = AUDIO_MUX_IDS[i % AUDIO_MUX_IDS.length];
    return {
      title: ep.title,
      description: ep.description,
      audio_url: `https://stream.mux.com/${muxId}/audio.m3u8`,
      duration: ep.duration,
      episode_number: i + 1,
      season_number: 1,
      thumbnail_url: coverUrl,
      is_published: true,
      // Stagger published_at — most recent first, weekly cadence going back.
      published_at: new Date(
        Date.now() - (EPISODES.length - i - 1) * 7 * 86400000,
      ).toISOString(),
      mux_playback_id: muxId,
      mux_status: "ready",
      genre_slug: "culture-stories",
      explicit: false,
      show_slug: SHOW_SLUG,
      show_title: SHOW_TITLE,
      show_description: SHOW_DESCRIPTION,
      creator_id: FENE_USER_ID,
      is_demo: false,
    };
  });
  const { error: insErr } = await supabase
    .from("podcasts")
    .insert(episodeRows);
  if (insErr) {
    console.error(`  ! podcast insert: ${insErr.message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${episodeRows.length} episodes seeded`);

  // 5. Wipe Fene's prior podcast-promo posts (tagged with #RNW marker)
  //    so reruns don't pile up duplicates.
  await supabase
    .from("posts")
    .delete()
    .eq("author_id", FENE_USER_ID)
    .ilike("body", "%#RNW%");
  await supabase
    .from("posts")
    .delete()
    .eq("author_id", FENE_USER_ID)
    .ilike("body", "%Real Negus Wednesday%");

  // 6. Image posts — upload + insert.
  console.log("\n[posts/image]");
  let postIdx = 0;
  for (const p of IMAGE_POSTS) {
    const src = join(ASSETS_DIR, p.file);
    const storageKey = `fene310/podcast-posts/${p.file}`;
    const url = await uploadFile(
      "post-images",
      storageKey,
      src,
      "image/jpeg",
    );
    if (!url) continue;
    const { error } = await supabase.from("posts").insert({
      author_id: FENE_USER_ID,
      body: p.body,
      image_url: url,
      media_type: "image",
      is_published: true,
      created_at: new Date(Date.now() - postIdx * 36 * 3600000).toISOString(),
    });
    if (error) console.warn(`  ! ${p.file}: ${error.message}`);
    else console.log(`  ✓ ${p.file} → post`);
    postIdx++;
  }

  // 7. Text-only posts.
  console.log("\n[posts/text]");
  for (const body of TEXT_POSTS) {
    const { error } = await supabase.from("posts").insert({
      author_id: FENE_USER_ID,
      body,
      media_type: null,
      is_published: true,
      created_at: new Date(Date.now() - postIdx * 36 * 3600000).toISOString(),
    });
    if (error) console.warn(`  ! text post: ${error.message}`);
    else console.log(`  ✓ "${body.slice(0, 40)}…"`);
    postIdx++;
  }

  console.log(
    "\n→ verify:" +
      "\n   /frequency              (Podcasts rail should show Real Negus Wednesday)" +
      `\n   /user/${FENE_HANDLE}    (new image + text posts about #RNW)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
