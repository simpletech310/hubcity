#!/usr/bin/env node
/**
 * Seed FREQUENCY demo content — 6 albums + 4 podcast shows + 3 editorial
 * playlists. Every track and episode references the same Mux audio
 * playback_id (the seed asset), so listeners can actually hear something
 * across the entire hub during the demo phase.
 *
 * Generates 13 newsprint-style SVG covers and uploads them to the
 * `audio-art` bucket under `demo/` before inserting the rows.
 *
 * Idempotent: deletes any existing rows where is_demo=true before
 * re-seeding, so re-running yields a clean state.
 *
 * Usage: node scripts/seed-frequency-demos.mjs
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
  { auth: { persistSession: false } }
);

// ── The Mux audio asset every demo row points at ─────────────
const SEED_PLAYBACK_ID = "ZdRWJFV5IB02aoBhdXIniuB4GIvKkR9ybA6R00xDkHRC4";
const SEED_ASSET_ID = "6oiu6KqRc02Vzf01atPwwAvDUFNMQ7vgW9h79a02R35hUM";
const SEED_DURATION = 186;

// ── Catalog ─────────────────────────────────────────────────
const ALBUMS = [
  {
    slug: "compton-sessions-vol-1",
    title: "Compton Sessions, Vol. 1",
    release_type: "mixtape",
    genre_slug: "hip-hop",
    creator: "Knect Studio",
    description:
      "Twelve nights at the Hub, six tracks pressed to a mixtape. Late-summer cuts from the cul-de-sac sessions — moody, sun-bleached, and unbothered.",
    cover: { kind: "stripe", primary: "#F2A900", accent: "#0A0A0C" },
    tracks: [
      { title: "Westside Air",                 features: [],          credits: { producer: "TJ", mix: "Hub City Audio" } },
      { title: "Don't Wait Up",                features: ["Mona"],    credits: { producer: "Smoke", mix: "Hub City Audio" } },
      { title: "Crown Loose",                  features: [],          credits: { producer: "Twin", mix: "Smoke" } },
      { title: "After the Light",              features: ["E. Ray"],  credits: { producer: "Hush", mix: "Hub City Audio" } },
      { title: "Long Way Home",                features: [],          credits: { producer: "TJ", mix: "TJ" } },
      { title: "Compton Sessions (Outro)",     features: [],          credits: { producer: "TJ", mix: "TJ" } },
    ],
  },
  {
    slug: "westside-gold",
    title: "Westside Gold",
    release_type: "album",
    genre_slug: "hip-hop",
    creator: "Hubsmith",
    description:
      "Five tracks of gold-foil bravado. Recorded in three takes between Rosecrans and Alondra. For the corner crew, the choir, and anyone who's ever waited at the bus stop with a notebook.",
    cover: { kind: "diag", primary: "#0A0A0C", accent: "#F2A900" },
    tracks: [
      { title: "Foil Boys",          features: [],            credits: { producer: "Knect", mix: "Hub City Audio" } },
      { title: "10 Deep on Alondra", features: ["Twin"],      credits: { producer: "Knect", mix: "Smoke" } },
      { title: "Rolex Hubcap",       features: [],            credits: { producer: "TJ", mix: "TJ" } },
      { title: "Compton Royal",      features: ["Mona"],      credits: { producer: "Knect", mix: "Hub City Audio" } },
      { title: "Gold Chain Memoir",  features: [],            credits: { producer: "Smoke", mix: "Hub City Audio" } },
    ],
  },
  {
    slug: "soft-light-ep",
    title: "Soft Light",
    release_type: "ep",
    genre_slug: "r-b-soul",
    creator: "Mona Reine",
    description:
      "Four-song EP about waiting up. Late-night R&B with a gospel underbelly — written in the kitchen, recorded in the closet, sequenced for the drive home.",
    cover: { kind: "circle", primary: "#EDE6D6", accent: "#0A0A0C" },
    tracks: [
      { title: "Soft Light (Intro)",  features: [],          credits: { producer: "Hush", mix: "Hush" } },
      { title: "If You Stay",         features: [],          credits: { producer: "Hush", mix: "Hush" } },
      { title: "Tell Me Twice",       features: ["E. Ray"],  credits: { producer: "Hush", mix: "Hub City Audio" } },
      { title: "Until It's Quiet",    features: [],          credits: { producer: "Hush", mix: "Hush" } },
    ],
  },
  {
    slug: "after-service",
    title: "After Service",
    release_type: "album",
    genre_slug: "gospel",
    creator: "First AME Choir",
    description:
      "Six hymns recorded after Sunday service at First AME. Live takes, room mics, no overdubs — what the choir sounded like once the cameras were off.",
    cover: { kind: "halo", primary: "#F2A900", accent: "#0A0A0C" },
    tracks: [
      { title: "Doxology (Reprise)",        features: [],          credits: { director: "Sister Vera", mix: "Hub City Audio" } },
      { title: "He Is Worthy",              features: [],          credits: { director: "Sister Vera", mix: "Hub City Audio" } },
      { title: "I'll Make It Through",      features: ["Bro. James"], credits: { director: "Sister Vera", mix: "Hub City Audio" } },
      { title: "Stand By Me (Live)",        features: [],          credits: { director: "Sister Vera", mix: "Hub City Audio" } },
      { title: "There Is a River",          features: [],          credits: { director: "Sister Vera", mix: "Hub City Audio" } },
      { title: "Take Me Home",              features: [],          credits: { director: "Sister Vera", mix: "Hub City Audio" } },
    ],
  },
  {
    slug: "first-friday-single",
    title: "First Friday",
    release_type: "single",
    genre_slug: "latin",
    creator: "Los Cuates",
    description:
      "A single in two languages, one chorus. Released the first Friday of every month — this one's number three. Cumbia rhythm, mariachi horns, late-bus energy.",
    cover: { kind: "diag", primary: "#F2A900", accent: "#0A0A0C" },
    tracks: [
      { title: "First Friday", features: ["Sol Marina"], credits: { producer: "Los Cuates", mix: "Hub City Audio" } },
    ],
  },
  {
    slug: "late-night-static-single",
    title: "Late Night Static",
    release_type: "single",
    genre_slug: "electronic",
    creator: "STATIC FM",
    description:
      "One track. Eight minutes. No drops. A patient, tape-warm slow burn for 1AM commutes and 4AM kitchens.",
    cover: { kind: "stripe", primary: "#0A0A0C", accent: "#F2A900" },
    tracks: [
      { title: "Late Night Static", features: [], credits: { producer: "STATIC FM", mix: "STATIC FM" } },
    ],
  },
];

const PODCASTS = [
  {
    show_slug: "compton-daily",
    show_title: "Compton Daily",
    show_description:
      "A 10-minute morning briefing on what's actually happening in the city — council notes, traffic shifts, weather, school closures, and the one story everyone will talk about by lunchtime.",
    genre_slug: "news-talk",
    creator: "Compton Daily",
    cover: { kind: "stripe", primary: "#0A0A0C", accent: "#F2A900" },
    episodes: [
      { title: "Monday: Council recap, Rosecrans repaving, and a heatwave warning", season_number: 1, episode_number: 12,
        description: "Tonight's council meeting ran two hours. We unpack the housing vote, the new pothole hotline, and a heat advisory for Tuesday." },
      { title: "Tuesday: New library hours, MLK Park ribbon-cutting, and a chamber update", season_number: 1, episode_number: 13,
        description: "The branch library quietly extended Saturday hours. Meanwhile, MLK Park's pavilion gets its ribbon-cutting Wednesday at 5." },
      { title: "Wednesday: First Friday lineup, school district meeting, lemonade stands ban?", season_number: 1, episode_number: 14,
        description: "A surprise lineup announcement for First Friday, the school board's quiet vote, and the rumor about lemonade-stand permits." },
    ],
  },
  {
    show_slug: "plate-by-plate",
    show_title: "Plate by Plate",
    show_description:
      "A food show about Compton's family kitchens, taqueros, and church potlucks. Long-form interviews with the people behind the plate, recorded with the dishwasher running.",
    genre_slug: "culture-stories",
    creator: "Plate by Plate",
    cover: { kind: "halo", primary: "#EDE6D6", accent: "#0A0A0C" },
    episodes: [
      { title: "How Two Sisters Run the Best Carnitas Cart in the County", season_number: 2, episode_number: 4,
        description: "Maria and Lulu have been hand-pulling carnitas for 19 years. We cooked with them at 5am and stayed for the rush." },
      { title: "The Hot-Link Sandwich That Built a Neighborhood", season_number: 2, episode_number: 5,
        description: "A hot-link, a long bun, two sauces — and a man who paid his mother's mortgage off it." },
      { title: "Inside the Church Potluck Pipeline", season_number: 2, episode_number: 6,
        description: "Three deacons, four sisters, twelve casseroles. How the potluck became the city's secret food network." },
    ],
  },
  {
    show_slug: "on-the-block",
    show_title: "On The Block",
    show_description:
      "Stories from one block of Compton at a time. Each episode walks a single street and lets the people who live there decide what's worth saying.",
    genre_slug: "culture-stories",
    creator: "On The Block",
    cover: { kind: "diag", primary: "#F2A900", accent: "#0A0A0C" },
    episodes: [
      { title: "Walnut & 134th: The Block That Raised Everyone", season_number: 1, episode_number: 8,
        description: "Five generations on one corner. A barber, a teacher, a coach, and the woman who runs the block club." },
      { title: "Holly Park Drive: Where the Good Trees Are", season_number: 1, episode_number: 9,
        description: "Why Holly Park's jacarandas got planted forty years ago — and why the city almost cut them down twice." },
      { title: "The 600 Block of Castlegate", season_number: 1, episode_number: 10,
        description: "A block long known for its Christmas lights tells the story of the family who started the tradition." },
    ],
  },
  {
    show_slug: "founders-cut",
    show_title: "Founder's Cut",
    show_description:
      "Working interviews with Compton's founders — restaurants, agencies, nonprofits — about the actual mechanics of building a small business in a small city.",
    genre_slug: "business-tech",
    creator: "Founder's Cut",
    cover: { kind: "circle", primary: "#0A0A0C", accent: "#F2A900" },
    episodes: [
      { title: "How a 22-Year-Old Bought the Building Her Salon Was In", season_number: 1, episode_number: 6,
        description: "From renting a chair to owning the strip mall — a step-by-step on the financing path nobody told her about." },
      { title: "The Print Shop That Survived Three Recessions", season_number: 1, episode_number: 7,
        description: "What it actually takes to keep a 40-year shop alive: family equity, a single big client, and saying no to weddings." },
      { title: "The Restaurant That Opened During Pandemic and Doubled Twice", season_number: 1, episode_number: 8,
        description: "A small kitchen, a smart Instagram, and a staff that didn't quit. The numbers behind the story." },
    ],
  },
];

const PLAYLISTS = [
  {
    title: "City Pulse Mix",
    description: "A rolling editorial mix of new singles + hot podcast intros. Updated Fridays.",
    genre_slug: null,
    cover: { kind: "stripe", primary: "#F2A900", accent: "#0A0A0C" },
    items: [
      { kind: "track",   ref: "compton-sessions-vol-1#1" },
      { kind: "track",   ref: "westside-gold#1" },
      { kind: "track",   ref: "soft-light-ep#2" },
      { kind: "episode", ref: "compton-daily#1" },
      { kind: "track",   ref: "first-friday-single#1" },
      { kind: "episode", ref: "plate-by-plate#1" },
    ],
  },
  {
    title: "Sunday in the City",
    description: "Gospel, soul, and reflective voices for slow Sundays.",
    genre_slug: "gospel",
    cover: { kind: "halo", primary: "#F2A900", accent: "#0A0A0C" },
    items: [
      { kind: "track",   ref: "after-service#1" },
      { kind: "track",   ref: "soft-light-ep#1" },
      { kind: "track",   ref: "after-service#3" },
      { kind: "episode", ref: "on-the-block#3" },
    ],
  },
  {
    title: "After Hours",
    description: "Late drives, slow drums, and patient stories.",
    genre_slug: "electronic",
    cover: { kind: "diag", primary: "#0A0A0C", accent: "#F2A900" },
    items: [
      { kind: "track",   ref: "late-night-static-single#1" },
      { kind: "track",   ref: "soft-light-ep#4" },
      { kind: "track",   ref: "compton-sessions-vol-1#4" },
      { kind: "episode", ref: "founders-cut#2" },
    ],
  },
];

// ── SVG cover generator ─────────────────────────────────────
function renderCover(title, subtitle, kicker, opts) {
  const { kind = "stripe", primary = "#F2A900", accent = "#0A0A0C" } = opts || {};
  const bg = kind === "halo" || kind === "circle" ? "#EDE6D6" : (primary === "#0A0A0C" ? "#0A0A0C" : "#EDE6D6");
  const ink = kind === "stripe" || kind === "diag"
    ? (primary === "#0A0A0C" ? "#F2A900" : "#0A0A0C")
    : "#0A0A0C";
  const gold = primary === "#0A0A0C" ? "#F2A900" : primary;
  const goldDark = "#C48800";

  let bgArt = "";
  if (kind === "stripe") {
    bgArt = `
      <rect x="0" y="0" width="800" height="800" fill="${bg}"/>
      <rect x="0" y="540" width="800" height="40" fill="${goldDark}"/>
      <rect x="0" y="590" width="800" height="120" fill="${gold}"/>
      <rect x="0" y="0" width="800" height="14" fill="${ink}"/>
      <rect x="0" y="20" width="800" height="3" fill="${ink}"/>
    `;
  } else if (kind === "diag") {
    bgArt = `
      <rect x="0" y="0" width="800" height="800" fill="${bg}"/>
      <polygon points="0,0 800,0 800,260 0,520" fill="${gold}" opacity="0.95"/>
      <polygon points="0,520 800,260 800,800 0,800" fill="${bg}"/>
      <line x1="0" y1="520" x2="800" y2="260" stroke="${ink}" stroke-width="6"/>
    `;
  } else if (kind === "circle") {
    bgArt = `
      <rect x="0" y="0" width="800" height="800" fill="${bg}"/>
      <circle cx="400" cy="380" r="240" fill="${gold}"/>
      <circle cx="400" cy="380" r="240" fill="none" stroke="${ink}" stroke-width="6"/>
    `;
  } else if (kind === "halo") {
    bgArt = `
      <rect x="0" y="0" width="800" height="800" fill="${bg}"/>
      <circle cx="400" cy="400" r="320" fill="none" stroke="${gold}" stroke-width="38"/>
      <circle cx="400" cy="400" r="320" fill="none" stroke="${ink}" stroke-width="3"/>
      <circle cx="400" cy="400" r="240" fill="none" stroke="${gold}" stroke-width="6"/>
    `;
  }

  // Wrap title to 2 lines if too long
  const words = (title || "").split(" ");
  let line1 = words[0] || "";
  let line2 = "";
  for (let i = 1; i < words.length; i++) {
    if ((line1 + " " + words[i]).length <= 14) line1 = line1 + " " + words[i];
    else line2 = (line2 ? line2 + " " : "") + words[i];
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <defs>
    <style>
      .kicker { font: 700 22px "Archivo Narrow", "Archivo", "Inter", sans-serif; letter-spacing: 0.18em; fill: ${ink}; }
      .title  { font: 700 84px "Archivo Narrow", "Archivo", "Inter", sans-serif; letter-spacing: -0.01em; fill: ${ink}; }
      .sub    { font: italic 28px "DM Serif Display", "Times New Roman", serif; fill: ${ink}; }
      .frame  { stroke: ${ink}; stroke-width: 6; fill: none; }
    </style>
  </defs>
  ${bgArt}
  <rect x="14" y="14" width="772" height="772" class="frame"/>
  <text x="48" y="92" class="kicker">${kicker || "FREQUENCY"}</text>
  <line x1="48" y1="108" x2="752" y2="108" stroke="${ink}" stroke-width="3"/>
  <text x="48" y="200" class="title">${escapeXml(line1.toUpperCase())}</text>
  ${line2 ? `<text x="48" y="288" class="title">${escapeXml(line2.toUpperCase())}</text>` : ""}
  <line x1="48" y1="720" x2="752" y2="720" stroke="${ink}" stroke-width="3"/>
  <text x="48" y="760" class="sub">${escapeXml(subtitle || "")}</text>
</svg>`;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function uploadCover(slug, svgString) {
  const path = `demo/${slug}.svg`;
  const { error } = await supabase.storage.from("audio-art").upload(
    path,
    new Blob([svgString], { type: "image/svg+xml" }),
    { upsert: true, contentType: "image/svg+xml", cacheControl: "31536000" }
  );
  if (error) throw new Error(`Upload ${path}: ${error.message}`);
  const { data } = supabase.storage.from("audio-art").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// ── Run ─────────────────────────────────────────────────────
async function run() {
  console.log("=== FREQUENCY demo seed ===\n");

  // 1. Wipe previous demo rows so reruns are clean
  console.log("Wiping previous demo rows...");
  await supabase.from("playlist_items").delete().in("playlist_id",
    (await supabase.from("playlists").select("id").eq("is_demo", true)).data?.map(r => r.id) ?? []
  );
  await supabase.from("playlists").delete().eq("is_demo", true);
  await supabase.from("tracks").delete().eq("is_demo", true);
  await supabase.from("albums").delete().eq("is_demo", true);
  await supabase.from("podcasts").delete().eq("is_demo", true);
  console.log("  cleared\n");

  // 2. Albums + tracks
  const trackIdByRef = {};      // "<album_slug>#<track_number>" → track id
  const episodeIdByRef = {};    // "<show_slug>#<episode_number>" → episode id

  for (const a of ALBUMS) {
    const subtitle = `${a.creator} · ${a.release_type.toUpperCase()}`;
    const svg = renderCover(a.title, subtitle, a.genre_slug.toUpperCase(), a.cover);
    const { url: cover_art_url, path: cover_art_path } = await uploadCover(a.slug, svg);

    const { data: album, error } = await supabase.from("albums").insert({
      slug: a.slug,
      title: a.title,
      description: a.description,
      release_type: a.release_type,
      cover_art_url,
      cover_art_path,
      genre_slug: a.genre_slug,
      release_date: new Date().toISOString().slice(0, 10),
      access_type: "free",
      is_published: true,
      is_demo: true,
    }).select().single();
    if (error) throw error;
    console.log(`Album: ${a.title}  (${a.tracks.length} tracks)`);

    for (let i = 0; i < a.tracks.length; i++) {
      const t = a.tracks[i];
      const num = i + 1;
      const { data: track, error: terr } = await supabase.from("tracks").insert({
        album_id: album.id,
        title: t.title,
        track_number: num,
        duration_seconds: SEED_DURATION,
        mux_asset_id: SEED_ASSET_ID,
        mux_playback_id: SEED_PLAYBACK_ID,
        mux_status: "ready",
        genre_slug: a.genre_slug,
        explicit: false,
        features: t.features ?? [],
        credits: t.credits ?? null,
        is_published: true,
        is_demo: true,
      }).select().single();
      if (terr) throw terr;
      trackIdByRef[`${a.slug}#${num}`] = track.id;
    }
  }

  // 3. Podcasts
  for (const s of PODCASTS) {
    const subtitle = `${s.creator} · PODCAST`;
    const svg = renderCover(s.show_title, subtitle, "FREQUENCY", s.cover);
    const { url: cover_art_url } = await uploadCover(s.show_slug, svg);

    for (let i = 0; i < s.episodes.length; i++) {
      const ep = s.episodes[i];
      const { data: row, error: perr } = await supabase.from("podcasts").insert({
        title: ep.title,
        description: ep.description,
        audio_url: `https://stream.mux.com/${SEED_PLAYBACK_ID}.m4a`,
        thumbnail_url: cover_art_url,
        duration: SEED_DURATION,
        episode_number: ep.episode_number,
        season_number: ep.season_number,
        is_published: true,
        published_at: new Date(Date.now() - i * 86400_000).toISOString(),
        mux_asset_id: SEED_ASSET_ID,
        mux_playback_id: SEED_PLAYBACK_ID,
        mux_status: "ready",
        genre_slug: s.genre_slug,
        show_slug: s.show_slug,
        show_title: s.show_title,
        show_description: s.show_description,
        is_demo: true,
      }).select().single();
      if (perr) throw perr;
      episodeIdByRef[`${s.show_slug}#${i + 1}`] = row.id;
    }
    console.log(`Podcast: ${s.show_title}  (${s.episodes.length} episodes)`);
  }

  // 4. Editorial playlists
  for (const p of PLAYLISTS) {
    const svg = renderCover(p.title, "EDITORIAL", "FREQUENCY", p.cover);
    const { url: cover_art_url } = await uploadCover(slugify(p.title), svg);

    const { data: pl, error: plerr } = await supabase.from("playlists").insert({
      title: p.title,
      description: p.description,
      cover_art_url,
      genre_slug: p.genre_slug,
      is_public: true,
      is_editorial: true,
      is_demo: true,
    }).select().single();
    if (plerr) throw plerr;

    for (let i = 0; i < p.items.length; i++) {
      const it = p.items[i];
      const id = it.kind === "track" ? trackIdByRef[it.ref] : episodeIdByRef[it.ref];
      if (!id) {
        console.warn(`  ! Missing item ref ${it.kind}/${it.ref} — skipping`);
        continue;
      }
      const { error: ierr } = await supabase.from("playlist_items").insert({
        playlist_id: pl.id,
        position: i + 1,
        item_type: it.kind,
        item_id: id,
      });
      if (ierr) throw ierr;
    }
    console.log(`Playlist: ${p.title}  (${p.items.length} items)`);
  }

  console.log("\n=== DONE ===");
}

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

run().catch((e) => { console.error("seed error:", e); process.exit(1); });
