#!/usr/bin/env node
/**
 * Seed Knect TV with 13 national thematic channels + 13 shows.
 * For each show:
 *   1. Upload source .mov to Mux (cached — shared source files only upload once)
 *   2. Generate poster via OpenAI gpt-image-1 (photoreal vs animated per show)
 *   3. Upload poster to Supabase Storage bucket `show-posters`
 *   4. Upsert channel row, show row, channel_videos episode-1 row
 *
 * Re-runnable: every step upserts by slug. Use `--resume` to skip rows that already have ready videos.
 */

import fs from "fs";
import path from "path";

// ───────── Config ─────────
const MUX_TOKEN_ID = "a9b71f93-1893-4c1f-9766-61c6c0277f2b";
const MUX_TOKEN_SECRET =
  "oKjxTigBfYMsPQj5Os8J8/kpWUYmRj1N634/S0XUodKczfXBy8TtaYFnDR4rjO0KvB5QIUTZmHv";
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString("base64");

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("ERROR: OPENAI_API_KEY must be set in env");
  process.exit(1);
}

const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/new media";

// ───────── The 13 national channels ─────────
const CHANNELS = [
  { slug: "the-cookout",              name: "The Cookout",              type: "food",      tagline: "Food, family, flavor.",                     description: "Soul, culture, and kitchen stories." },
  { slug: "bless-this-house",         name: "Bless This House",         type: "home",      tagline: "Home, design, and real estate.",            description: "Renovation, real estate, and reimagining space." },
  { slug: "ink-and-art",              name: "Ink & Art",                type: "art",       tagline: "Tattoos, murals, and visual culture.",      description: "Artists, custom culture, and creative process." },
  { slug: "fitted",                   name: "Fitted",                   type: "fashion",   tagline: "Fashion, fits, and fresh looks.",           description: "Street style, stylists, and streetwear culture." },
  { slug: "the-wellness-room",        name: "The Wellness Room",        type: "wellness",  tagline: "Mind, body, and soul.",                     description: "Mental health, fitness, and holistic living." },
  { slug: "the-laugh-room",           name: "The Laugh Room",           type: "comedy",    tagline: "Stand-up, sketch, and stories.",            description: "Comedy specials and culture." },
  { slug: "after-hours",              name: "After Hours",              type: "talk",      tagline: "Late-night conversations.",                 description: "Interviews and pop-culture commentary." },
  { slug: "the-come-up",              name: "The Come Up",              type: "business",  tagline: "Entrepreneurship, hustle, and ambition.",   description: "Founders, side hustles, and money moves." },
  { slug: "the-blueprint",            name: "The Blueprint",            type: "tech",      tagline: "Tech, trades, and the new workforce.",      description: "Certifications, trades, and career development." },
  { slug: "classrooms-without-walls", name: "Classrooms Without Walls", type: "education", tagline: "History, culture, and learning.",           description: "Black intellectual life, diaspora, and hidden history." },
  { slug: "the-village",              name: "The Village",              type: "civic",     tagline: "Community, civic life, and local stories.", description: "Grassroots work and civic engagement." },
  { slug: "frequency",                name: "Frequency",                type: "music",     tagline: "New heat, sessions, and music culture.",    description: "Artist spotlights, beats, and the business of music." },
  { slug: "sunday-best",              name: "Sunday Best",              type: "faith",     tagline: "Faith, hope, and inspiration.",             description: "Devotionals, gospel, and community wellness." },
  { slug: "the-field",                name: "The Field + Street Skills",type: "sports",    tagline: "Sports, competition, and culture.",         description: "From the court to the streets, every level." },
];

// ───────── The 13 shows (one per channel) ─────────
const SHOWS = [
  {
    slug: "sunday-plate", channel_slug: "the-cookout", title: "Sunday Plate",
    tagline: "Every family has a recipe.",
    description: "Host recreates a different family's Sunday dinner each episode.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "oringinal content 1.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "warm golden lighting, a table of home-cooked soul food with rising steam, Black grandmother and adult grandson smiling and plating food together in a cozy kitchen, natural textures, documentary-photograph feel",
  },
  {
    slug: "home-room", channel_slug: "bless-this-house", title: "Home Room",
    tagline: "Your space, your story.",
    description: "Families sharing the homes they built and why they matter.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "kids content.mov",
    poster_mode: "animated",
    poster_style_keywords: "bright cheerful 2D cartoon of a diverse Black family of four posing proudly in front of their colorful suburban home, kid waving, flat illustration with clean lines and warm color palette",
  },
  {
    slug: "the-sitting", channel_slug: "ink-and-art", title: "The Sitting",
    tagline: "Every tattoo tells a story.",
    description: "Full tattoo session from concept to completion, with the client's story.",
    runtime_minutes: 51, format: "episodic",
    source_video_file: "fakesmiles.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic close-up of a Black tattoo artist's hands mid-session working on detailed forearm tattoo, client visible in soft focus, moody studio lighting with red accents, visible ink bottles and tools on a steel tray",
  },
  {
    slug: "drip-check", channel_slug: "fitted", title: "Drip Check",
    tagline: "The streets decide the fit.",
    description: "Street-style interviews and outfit breakdowns in Black cities.",
    runtime_minutes: 12, format: "episodic",
    source_video_file: "podcasttalk.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic full-body street-style shot of a stylish young Black man and woman on a sunlit urban sidewalk in vibrant streetwear, shallow depth of field, fashion-editorial composition, golden hour lighting",
  },
  {
    slug: "unbothered", channel_slug: "the-wellness-room", title: "Unbothered",
    tagline: "Mental health, on our own terms.",
    description: "Mental-health conversations specifically for Black women.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "podcasttalk.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic portrait of a poised Black woman in her 30s seated on a terracotta velvet couch, warm sunlit room with plants, calm confident expression, soft cinematic film grain",
  },
  {
    slug: "open-mic-night", channel_slug: "the-laugh-room", title: "Open Mic Night",
    tagline: "The stage never sleeps.",
    description: "Raw open-mic performances from comedy clubs across the country.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "anthony anderson comdey.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic shot of a Black male comedian mid-punchline under a single spotlight on a brick-wall comedy-club stage, audience silhouettes in the foreground, dramatic warm stage lighting, vintage microphone in hand",
  },
  {
    slug: "the-couch", channel_slug: "after-hours", title: "The Couch",
    tagline: "Deeper than the interview circuit.",
    description: "Casual interview show — guests open up beyond their public persona.",
    runtime_minutes: 51, format: "talk",
    source_video_file: "podcasttalk.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic late-night talk-show set with two Black hosts in stylish clothes seated on a deep leather couch, moody blue and gold lighting, floor-to-ceiling window with city lights behind them",
  },
  {
    slug: "started-from", channel_slug: "the-come-up", title: "Started From",
    tagline: "Every empire starts somewhere.",
    description: "Origin stories of Black entrepreneurs and how they built their businesses.",
    runtime_minutes: 51, format: "docuseries",
    source_video_file: "fakesmiles.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic portrait of a confident Black woman entrepreneur in her 30s standing in her modern boutique storefront, arms crossed, proud smile, golden-hour light coming through the window, editorial magazine style",
  },
  {
    slug: "no-degree-required", channel_slug: "the-blueprint", title: "No Degree Required",
    tagline: "Six figures without the debt.",
    description: "Certifications and trades paying six figures without a four-year degree.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "fakesmiles.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic shot of a young Black electrician in a hard hat and utility belt holding a tablet in a modern data center, confident gaze, clean corporate lighting with blue LED accents",
  },
  {
    slug: "little-scholars", channel_slug: "classrooms-without-walls", title: "Little Scholars",
    tagline: "Learning out loud.",
    description: "Hidden Black history made fun for kids and families.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "gracie corner.mov",
    poster_mode: "animated",
    poster_style_keywords: "vibrant modern 2D cartoon of three joyful Black kids in a magical library with floating books, stars, and a glowing globe, flat colors, rounded friendly character proportions, children's-show aesthetic",
  },
  {
    slug: "the-block", channel_slug: "the-village", title: "The Block",
    tagline: "Every street has a story.",
    description: "Hyper-local storytelling from Black neighborhoods across the country.",
    runtime_minutes: 51, format: "docuseries",
    source_video_file: "compton council meeting.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic wide shot of a sunny residential Black neighborhood street with palm trees, kids on bikes, neighbors on porches, documentary photography style, rich saturated colors, mid-afternoon light",
  },
  {
    slug: "new-heat", channel_slug: "frequency", title: "New Heat",
    tagline: "The hottest artists, first.",
    description: "Weekly new music video premieres and artist spotlights.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "compton news.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic portrait of a charismatic young Black rapper in a studio booth wearing gold chains and a designer hoodie, studio microphone in foreground, neon red and purple lighting, music-video aesthetic",
  },
  {
    slug: "word-for-the-week", channel_slug: "sunday-best", title: "Word for the Week",
    tagline: "Start the week on purpose.",
    description: "Short motivational devotionals delivered by Black faith leaders.",
    runtime_minutes: 12, format: "devotional",
    source_video_file: "compton council meeting.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic portrait of a Black pastor in her 50s in a warmly lit sanctuary, open Bible in hand, stained-glass light casting soft blue and amber tones, dignified editorial composition",
  },
  {
    slug: "run-it-back", channel_slug: "the-field", title: "Run It Back",
    tagline: "The plays that made the culture.",
    description: "Breaking down iconic games, plays, and athletes from a Black cultural lens.",
    runtime_minutes: 23, format: "episodic",
    source_video_file: "compton college football.mov",
    poster_mode: "photoreal",
    poster_style_keywords: "photorealistic action shot of a Black college football running back breaking a tackle under Friday-night stadium lights, helmet on, steam rising, low-angle cinematic sports-photography composition",
  },
];

// ───────── Small helpers ─────────
async function muxApi(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: { Authorization: `Basic ${MUX_AUTH}`, "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.mux.com${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mux ${method} ${endpoint} (${res.status}): ${text}`);
  }
  return res.json();
}

async function supabaseApi(endpoint, method = "GET", body = null, extraHeaders = {}) {
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...extraHeaders,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${endpoint} (${res.status}): ${text}`);
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

// Upload a single .mov to Mux, poll for ready, return { assetId, playbackId, duration }
async function uploadMuxVideo(filePath) {
  console.log(`  → Mux upload start: ${path.basename(filePath)}`);
  const { data: upload } = await muxApi("/video/v1/uploads", "POST", {
    new_asset_settings: { playback_policy: ["public"] },
    cors_origin: "*",
  });

  const fileBuffer = fs.readFileSync(filePath);
  const putRes = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": "video/quicktime" },
    body: fileBuffer,
  });
  if (!putRes.ok) throw new Error(`Mux PUT failed: ${putRes.status}`);

  let assetId;
  for (let i = 0; i < 80; i++) {
    const { data } = await muxApi(`/video/v1/uploads/${upload.id}`);
    if (data.status === "asset_created") { assetId = data.asset_id; break; }
    if (data.status === "errored") throw new Error("Mux upload errored");
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!assetId) throw new Error("Mux upload timed out");

  // Wait for asset to be "ready" so we have a real duration
  let asset;
  for (let i = 0; i < 80; i++) {
    const { data } = await muxApi(`/video/v1/assets/${assetId}`);
    if (data.status === "ready") { asset = data; break; }
    if (data.status === "errored") throw new Error("Mux asset errored");
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!asset) throw new Error("Mux asset never reached ready");

  const playbackId = asset.playback_ids?.[0]?.id;
  const duration = asset.duration;
  console.log(`    asset=${assetId} playback=${playbackId} duration=${duration?.toFixed(1)}s`);
  return { assetId, playbackId, duration };
}

// Generate poster via OpenAI gpt-image-1 → return Buffer
async function generatePoster(show) {
  const basePrompt = show.poster_mode === "animated"
    ? `Premium streaming-service poster for "${show.title}". ${show.tagline}. **Vibrant animated cartoon illustration** in the style of modern 2D children's animation (flat colors, clean line art, friendly exaggerated proportions, warm palette). Fully illustrated — NO photographs. Portrait 2:3 aspect ratio. Bold rounded display-sans title "${show.title}" across the bottom third. ${show.poster_style_keywords}. No watermarks, no logos other than the title.`
    : `Premium streaming-service poster for "${show.title}". ${show.tagline}. **Photorealistic**, high-resolution editorial photography, shot on a full-frame cinema camera with shallow depth of field and cinematic lighting. Real-looking people with natural skin texture, authentic expressions, and believable wardrobe. **Do NOT render stylized, illustrated, painterly, or 3D-cartoon humans — this must look like a real photograph.** Portrait 2:3 aspect ratio. Bold modern sans-serif title "${show.title}" across the bottom third. ${show.poster_style_keywords}. No watermarks, no logos other than the title.`;

  console.log(`  → Generating poster (${show.poster_mode})...`);
  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt: basePrompt,
      size: "1024x1536",
      quality: "high",
      n: 1,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image (${res.status}): ${text}`);
  }
  const json = await res.json();
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI returned no image data");
  return Buffer.from(b64, "base64");
}

// Upload poster bytes to Supabase Storage → return public URL
async function uploadPoster(slug, pngBytes) {
  const objectPath = `${slug}.png`;
  const res = await fetch(
    `${SUPABASE_URL}/storage/v1/object/show-posters/${objectPath}`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "image/png",
        "x-upsert": "true",
      },
      body: pngBytes,
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Storage upload (${res.status}): ${text}`);
  }
  return `${SUPABASE_URL}/storage/v1/object/public/show-posters/${objectPath}`;
}

// Upsert a row by unique column; returns the row
async function upsert(tableEndpoint, matchColumn, matchValue, row) {
  const existing = await supabaseApi(
    `${tableEndpoint}?${matchColumn}=eq.${encodeURIComponent(matchValue)}&select=*`
  );
  if (existing && existing.length) {
    const id = existing[0].id;
    const updated = await supabaseApi(
      `${tableEndpoint}?id=eq.${id}`, "PATCH", row
    );
    return updated[0];
  }
  const inserted = await supabaseApi(tableEndpoint, "POST", row);
  return inserted[0];
}

// ───────── Main ─────────
async function main() {
  console.log("=== Knect TV Shows Seeder ===\n");

  // Pre-flight: Mux asset count
  const { data: existingAssets } = await muxApi("/video/v1/assets?limit=100");
  console.log(`Mux account currently has ${existingAssets.length} assets.`);
  if (existingAssets.length >= 10) {
    console.warn("⚠️  Mux account has ≥10 assets. Free tier limit is 10. You may need to upgrade or clean up.\n");
  }

  // 1. Upsert all 13 channels up front
  console.log("\n[1/3] Upserting 13 channels...");
  const channelBySlug = {};
  for (const ch of CHANNELS) {
    const row = await upsert("/rest/v1/channels", "slug", ch.slug, {
      slug: ch.slug,
      name: ch.name,
      type: ch.type,
      scope: "national",
      description: ch.description,
      is_active: true,
      is_verified: true,
    });
    channelBySlug[ch.slug] = row;
    console.log(`  ✓ ${ch.slug.padEnd(28)} (id ${row.id.slice(0, 8)}…)`);
  }

  // 2. Per-show: upload video (cached), generate poster, upload poster, upsert show + video
  console.log("\n[2/3] Processing 13 shows...");
  const muxCache = {}; // source_file → { assetId, playbackId, duration }
  const results = [];

  for (const show of SHOWS) {
    console.log(`\n— ${show.title} (${show.slug}) —`);
    const filePath = path.join(ASSETS_DIR, show.source_video_file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ✗ Source file missing: ${filePath}`);
      continue;
    }

    // Check if this show already has a ready video (for resume)
    const channel = channelBySlug[show.channel_slug];
    const existingShow = await supabaseApi(
      `/rest/v1/shows?slug=eq.${show.slug}&select=id,poster_url`
    );
    let showRow = existingShow?.[0];
    if (showRow) {
      const existingVideo = await supabaseApi(
        `/rest/v1/channel_videos?show_id=eq.${showRow.id}&status=eq.ready&select=id,mux_playback_id`
      );
      if (process.argv.includes("--resume") && existingVideo?.[0]?.mux_playback_id) {
        console.log(`  ⏭  Skip (already ready: ${existingVideo[0].mux_playback_id})`);
        results.push({ show: show.title, status: "skipped", playbackId: existingVideo[0].mux_playback_id });
        continue;
      }
    }

    // 2a. Upload video (cached by source file)
    if (!muxCache[show.source_video_file]) {
      muxCache[show.source_video_file] = await uploadMuxVideo(filePath);
    } else {
      console.log(`  ♻️  Reusing Mux asset for ${show.source_video_file}`);
    }
    const { assetId, playbackId, duration } = muxCache[show.source_video_file];

    // 2b. Generate poster (skip if we already have one on resume)
    let posterUrl = showRow?.poster_url || null;
    if (!posterUrl) {
      const pngBytes = await generatePoster(show);
      posterUrl = await uploadPoster(show.slug, pngBytes);
      console.log(`    poster: ${posterUrl}`);
    } else {
      console.log(`    poster (cached): ${posterUrl}`);
    }

    // 2c. Upsert show row
    showRow = await upsert("/rest/v1/shows", "slug", show.slug, {
      slug: show.slug,
      channel_id: channel.id,
      title: show.title,
      tagline: show.tagline,
      description: show.description,
      poster_url: posterUrl,
      runtime_minutes: show.runtime_minutes,
      format: show.format,
      is_active: true,
      sort_order: SHOWS.indexOf(show),
    });

    // 2d. Upsert episode-1 channel_video row (match on show_id + episode_number)
    const existingEp = await supabaseApi(
      `/rest/v1/channel_videos?show_id=eq.${showRow.id}&episode_number=eq.1&select=id`
    );
    const videoRow = {
      channel_id: channel.id,
      show_id: showRow.id,
      episode_number: 1,
      title: show.title,
      description: show.description,
      video_type: "original",
      mux_asset_id: assetId,
      mux_playback_id: playbackId,
      duration: duration,
      thumbnail_url: posterUrl,
      status: "ready",
      is_featured: SHOWS.indexOf(show) < 4,
      is_published: true,
      published_at: new Date().toISOString(),
    };
    if (existingEp?.length) {
      await supabaseApi(
        `/rest/v1/channel_videos?id=eq.${existingEp[0].id}`, "PATCH", videoRow
      );
    } else {
      await supabaseApi("/rest/v1/channel_videos", "POST", videoRow);
    }

    console.log(`  ✓ Show + episode 1 ready (playback ${playbackId})`);
    results.push({ show: show.title, status: "ok", playbackId, posterUrl });
  }

  // 3. Summary
  console.log("\n[3/3] Summary:");
  console.log(`\n  Unique Mux uploads: ${Object.keys(muxCache).length}`);
  console.log(`  Shows processed:    ${results.length}/${SHOWS.length}`);
  console.log(`\n  ${"Show".padEnd(32)} ${"Status".padEnd(8)} Playback ID`);
  console.log(`  ${"-".repeat(32)} ${"-".repeat(8)} ${"-".repeat(40)}`);
  for (const r of results) {
    console.log(`  ${r.show.padEnd(32)} ${r.status.padEnd(8)} ${r.playbackId || "-"}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
