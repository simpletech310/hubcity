#!/usr/bin/env node

/**
 * Populate the Frequency hub with a demo catalog. Same content as
 * migration 106 but executed via the Supabase JS client so it actually
 * runs end-to-end (the migration was never executed in the dashboard).
 *
 * Reuses real Mux audio playback IDs already present on tracks /
 * podcasts in the DB. Cycles through up to 4 known-working IDs so
 * there's audio variety. Per 092: "mux_playback_id may be reused
 * across demo rows" — this is the intended pattern.
 *
 * Seeds:
 *   - 12 albums (singles / EPs / albums / mixtapes) across genres
 *   - 1–3 tracks per album
 *   - 6 podcast shows × 3 episodes each (18 episodes total)
 *   - 6 editorial playlists, each filled with up to 6 genre-matched tracks
 *
 * All rows get is_demo = TRUE so they can be purged with one query.
 * Idempotent. Safe to re-run.
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

// ── Cover art bank ─────────────────────────────────────────────────────
const COVERS = {
  hiphop1:   "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=800&fit=crop",
  hiphop2:   "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
  rnb1:      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&h=800&fit=crop",
  rnb2:      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800&h=800&fit=crop",
  gospel:    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&h=800&fit=crop",
  jazz:      "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=800&h=800&fit=crop",
  latin:     "https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800&h=800&fit=crop",
  reggae:    "https://images.unsplash.com/photo-1471478331149-c72f17e33c73?w=800&h=800&fit=crop",
  electro:   "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&h=800&fit=crop",
  faith:     "https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800&h=800&fit=crop",
  culture1:  "https://images.unsplash.com/photo-1485579149621-3123dd979885?w=800&h=800&fit=crop",
  culture2:  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=800&fit=crop",
};

const PCOVERS = {
  civic:    "https://images.unsplash.com/photo-1589903308904-1010c2294adc?w=800&h=800&fit=crop",
  business: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&h=800&fit=crop",
  culture:  "https://images.unsplash.com/photo-1494059980473-813e73ee784b?w=800&h=800&fit=crop",
  sports:   "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=800&fit=crop",
  faith:    "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=800&fit=crop",
  youth:    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=800&fit=crop",
};

const PLCOVERS = {
  morning:  "https://images.unsplash.com/photo-1504700610630-ac6aba3536d3?w=800&h=800&fit=crop",
  workout:  "https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&h=800&fit=crop",
  sunday:   "https://images.unsplash.com/photo-1465225314224-587cd83d322b?w=800&h=800&fit=crop",
  lowrider: "https://images.unsplash.com/photo-1468581264429-2548ef9eb732?w=800&h=800&fit=crop",
  focus:    "https://images.unsplash.com/photo-1453738773917-9c3eff1db985?w=800&h=800&fit=crop",
  block:    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop",
};

// ── Album / track tree ─────────────────────────────────────────────────
const ALBUMS = [
  {
    slug: "hub-city-anthem-rmx",
    title: "Hub City Anthem (Remix)",
    description: "A west-coast remix flip of the Compton anthem.",
    release_type: "single",
    cover: COVERS.hiphop1,
    genre: "hip-hop",
    release_date: "2026-04-12",
    tracks: [
      { title: "Hub City Anthem (Remix)", duration: 195 },
    ],
  },
  {
    slug: "long-beach-nights-ep",
    title: "Long Beach Nights",
    description: "Late-night R&B from the 710 corridor — three slow burners.",
    release_type: "ep",
    cover: COVERS.rnb1,
    genre: "r-b-soul",
    release_date: "2026-03-22",
    tracks: [
      { title: "Velvet Hour",     duration: 222 },
      { title: "3AM Phone Call",  duration: 198 },
      { title: "Dominguez Drive", duration: 244 },
    ],
  },
  {
    slug: "greater-temple-live",
    title: "Greater Temple — Live in Compton",
    description: "Sunday service, recorded live. Choir, horns, and testimony.",
    release_type: "album",
    cover: COVERS.gospel,
    genre: "gospel",
    release_date: "2026-02-14",
    tracks: [
      { title: "Praise Procession", duration: 312 },
      { title: "I Surrender",       duration: 268 },
      { title: "Choir Reprise",     duration: 187 },
    ],
  },
  {
    slug: "blue-line-quartet",
    title: "The Blue Line Quartet",
    description: "Standards reimagined for the LA Metro. Recorded in one take.",
    release_type: "album",
    cover: COVERS.jazz,
    genre: "jazz",
    release_date: "2026-01-30",
    tracks: [
      { title: "Wilmington Walk", duration: 412 },
      { title: "Slauson Stride",  duration: 376 },
    ],
  },
  {
    slug: "cumbia-del-bulevar",
    title: "Cumbia del Bulevar",
    description: "A Compton-Acapulco cumbia for backyard parties.",
    release_type: "single",
    cover: COVERS.latin,
    genre: "latin",
    release_date: "2026-04-05",
    tracks: [
      { title: "Cumbia del Bulevar", duration: 233 },
    ],
  },
  {
    slug: "westside-roots-vol-1",
    title: "Westside Roots, Vol. 1",
    description: "A reggae mixtape of LA-rooted artists, hosted by DJ Pacífico.",
    release_type: "mixtape",
    cover: COVERS.reggae,
    genre: "reggae",
    release_date: "2026-03-08",
    tracks: [
      { title: "Sound the Horn",   duration: 211 },
      { title: "Skank in the Sun", duration: 246 },
      { title: "Dub for the City", duration: 305 },
    ],
  },
  {
    slug: "ports-and-power-lines",
    title: "Ports & Power Lines",
    description: "Industrial-tinted house, synthesized from LA infrastructure.",
    release_type: "ep",
    cover: COVERS.electro,
    genre: "electronic",
    release_date: "2026-04-18",
    tracks: [
      { title: "Substation",  duration: 354 },
      { title: "710 Loop",    duration: 392 },
      { title: "Phasewalker", duration: 421 },
    ],
  },
  {
    slug: "letters-from-the-pulpit",
    title: "Letters from the Pulpit",
    description: "Spoken-word and song. A young pastor's first project.",
    release_type: "album",
    cover: COVERS.faith,
    genre: "faith",
    release_date: "2026-02-28",
    tracks: [
      { title: "Letter One: Hope",   duration: 256 },
      { title: "Letter Two: Endure", duration: 287 },
    ],
  },
  {
    slug: "rosecrans-roses",
    title: "Rosecrans Roses",
    description: "A coming-of-age album from a Centennial High senior.",
    release_type: "album",
    cover: COVERS.hiphop2,
    genre: "hip-hop",
    release_date: "2026-03-15",
    tracks: [
      { title: "Sunset on Rosecrans", duration: 203 },
      { title: "Pop's Cadillac",      duration: 218 },
      { title: "Graduation Day",      duration: 184 },
    ],
  },
  {
    slug: "palmer-park-summers",
    title: "Palmer Park Summers",
    description: "A breezy single about block-party romance.",
    release_type: "single",
    cover: COVERS.rnb2,
    genre: "r-b-soul",
    release_date: "2026-04-20",
    tracks: [
      { title: "Palmer Park Summers", duration: 209 },
    ],
  },
  {
    slug: "voices-of-the-hub",
    title: "Voices of the Hub",
    description: "Spoken-word + ambient: stories from elders, students, and shop owners.",
    release_type: "mixtape",
    cover: COVERS.culture1,
    genre: "culture-stories",
    release_date: "2026-01-12",
    tracks: [
      { title: "The Barber",         duration: 312 },
      { title: "The Crossing Guard", duration: 274 },
      { title: "The Quinceañera",    duration: 298 },
    ],
  },
  {
    slug: "north-of-rosecrans",
    title: "North of Rosecrans",
    description: "Six poems about home, set to live drums and bass.",
    release_type: "ep",
    cover: COVERS.culture2,
    genre: "culture-stories",
    release_date: "2026-04-08",
    tracks: [
      { title: "North of Rosecrans",  duration: 187 },
      { title: "Linden & Long Beach", duration: 199 },
    ],
  },
];

const PODCASTS = [
  {
    show_slug: "council-cast",
    show_title: "Council Cast",
    show_description: "A weekly recap of the Compton City Council — what passed, what didn't, and what to watch.",
    cover: PCOVERS.civic,
    genre: "news-talk",
    episodes: [
      { title: "Ep. 1 — The Budget That Almost Wasn't", description: "How a 3-2 vote rewired the FY26 budget.", duration: 1820, days_ago: 21 },
      { title: "Ep. 2 — Public Comment, Public Stakes",  description: "A 90-minute public comment night, distilled.", duration: 1545, days_ago: 14 },
      { title: "Ep. 3 — The Park Bond Comes Home",       description: "What the new park bond actually pays for.", duration: 1980, days_ago: 7 },
    ],
  },
  {
    show_slug: "hub-city-hustle",
    show_title: "Hub City Hustle",
    show_description: "Conversations with Compton entrepreneurs — barbershops, food trucks, fitness, fashion.",
    cover: PCOVERS.business,
    genre: "business-tech",
    episodes: [
      { title: "From Backyard Cookout to Brand", description: "Two siblings turn a Saturday tradition into a catering business.", duration: 2210, days_ago: 20 },
      { title: "A Barber, A Block, A Brand",     description: "Building a barbershop that doubles as a community hub.", duration: 1880, days_ago: 13 },
      { title: "Element 78 — Move with Purpose", description: "How a fitness brand started in a Compton garage.", duration: 1965, days_ago: 6 },
    ],
  },
  {
    show_slug: "after-service",
    show_title: "After Service",
    show_description: "Compton pastors and faith leaders, off the pulpit.",
    cover: PCOVERS.faith,
    genre: "faith",
    episodes: [
      { title: "On Forgiveness", description: "Three pastors talk about the hardest sermons.", duration: 2400, days_ago: 24 },
      { title: "On Showing Up",  description: "Why Sunday isn't the only day that matters.", duration: 2150, days_ago: 17 },
      { title: "On Raising Boys", description: "Mentorship in the church and beyond.", duration: 2300, days_ago: 10 },
    ],
  },
  {
    show_slug: "centennial-sidelines",
    show_title: "Centennial Sidelines",
    show_description: "Compton and Centennial High athletics — Friday-night recaps and weekend previews.",
    cover: PCOVERS.sports,
    genre: "culture-stories",
    episodes: [
      { title: "Week 1 Recap",          description: "A statement opener for the Apaches.", duration: 1620, days_ago: 23 },
      { title: "The Crosstown Preview", description: "Centennial vs Compton, and what's on the line.", duration: 1480, days_ago: 16 },
      { title: "Senior Night Stories",  description: "Three seniors share what this season means.", duration: 1750, days_ago: 9 },
    ],
  },
  {
    show_slug: "block-stories",
    show_title: "Block Stories",
    show_description: "Oral histories from the Hub. One block, one episode.",
    cover: PCOVERS.culture,
    genre: "culture-stories",
    episodes: [
      { title: "Rosecrans & Wilmington",    description: "The intersection that built three generations.", duration: 2050, days_ago: 22 },
      { title: "Compton Blvd & Long Beach", description: "The corner everyone has a story about.", duration: 2210, days_ago: 15 },
      { title: "Alondra Park",              description: "How the park became the center of a neighborhood.", duration: 1995, days_ago: 8 },
    ],
  },
  {
    show_slug: "first-bell",
    show_title: "First Bell",
    show_description: "CUSD teachers, principals, and parents on what's working in classrooms.",
    cover: PCOVERS.youth,
    genre: "kids",
    episodes: [
      { title: "Reading at Grade Level",  description: "A 4th-grade teacher on the work behind the data.", duration: 1840, days_ago: 19 },
      { title: "After-School That Works", description: "Three programs that move the needle.", duration: 1720, days_ago: 12 },
      { title: "The Senior-Year Push",    description: "Counselors on FAFSA, applications, and follow-up.", duration: 1995, days_ago: 5 },
    ],
  },
];

const PLAYLISTS = [
  { id: "a0aa0001-0000-4000-8000-000000000001", title: "Compton Mornings", description: "Soft starts. Coffee, sunrise on Rosecrans, headphones in.", cover: PLCOVERS.morning,  genre: "r-b-soul",  match_genres: ["r-b-soul","culture-stories"] },
  { id: "a0aa0001-0000-4000-8000-000000000002", title: "Workout Heat",     description: "For the run, the lift, the rep that hurts. Element 78 approved.", cover: PLCOVERS.workout, genre: "hip-hop",   match_genres: ["hip-hop","electronic"] },
  { id: "a0aa0001-0000-4000-8000-000000000003", title: "Sunday Service",   description: "Greater Temple, choirs, and praise from the pulpit.", cover: PLCOVERS.sunday,  genre: "gospel",    match_genres: ["gospel","faith"] },
  { id: "a0aa0001-0000-4000-8000-000000000004", title: "Lowrider Sundays", description: "Cruising music: oldies, soul, slow jams, sun.", cover: PLCOVERS.lowrider, genre: "r-b-soul",  match_genres: ["r-b-soul","latin","jazz"] },
  { id: "a0aa0001-0000-4000-8000-000000000005", title: "Deep Focus",       description: "Ambient, jazz, and electronic for long-form work.", cover: PLCOVERS.focus,   genre: "electronic", match_genres: ["jazz","electronic","culture-stories"] },
  { id: "a0aa0001-0000-4000-8000-000000000006", title: "Block Party 2026", description: "The summer rotation. Hip-hop, cumbia, reggae, and a horn or two.", cover: PLCOVERS.block, genre: "hip-hop", match_genres: ["hip-hop","reggae","latin"] },
];

// ── Main ───────────────────────────────────────────────────────────────
async function main() {
  // 1. Pick a pool of real Mux audio playback IDs from existing tracks/podcasts.
  const tr = await supabase
    .from("tracks")
    .select("mux_playback_id")
    .eq("mux_status", "ready")
    .not("mux_playback_id", "is", null)
    .not("mux_playback_id", "ilike", "demo-%");
  const pd = await supabase
    .from("podcasts")
    .select("mux_playback_id")
    .eq("mux_status", "ready")
    .not("mux_playback_id", "is", null)
    .not("mux_playback_id", "ilike", "demo-%");
  const pool = Array.from(
    new Set([
      ...(tr.data ?? []).map((r) => r.mux_playback_id).filter(Boolean),
      ...(pd.data ?? []).map((r) => r.mux_playback_id).filter(Boolean),
    ])
  );
  if (pool.length === 0) {
    console.error("No real Mux audio playback IDs found in DB. Run finish-adiz-mux.mjs first.");
    process.exit(1);
  }
  console.log(`Pool of ${pool.length} Mux playback IDs to rotate across catalog:`);
  for (const pb of pool) console.log("  -", pb);
  let rr = 0;
  const nextPb = () => pool[(rr++) % pool.length];

  // 2. Albums + tracks
  console.log("\n[albums] seeding 12 albums + tracks...");
  let albumCount = 0;
  let trackCount = 0;
  for (const a of ALBUMS) {
    const { data: row, error } = await supabase
      .from("albums")
      .upsert(
        {
          slug: a.slug,
          title: a.title,
          description: a.description,
          release_type: a.release_type,
          cover_art_url: a.cover,
          genre_slug: a.genre,
          release_date: a.release_date,
          access_type: "free",
          is_published: true,
          is_demo: true,
        },
        { onConflict: "slug" }
      )
      .select("id")
      .single();
    if (error) throw new Error(`album ${a.slug}: ${error.message}`);
    albumCount++;
    for (let i = 0; i < a.tracks.length; i++) {
      const t = a.tracks[i];
      const pb = nextPb();
      const { error: terr } = await supabase
        .from("tracks")
        .upsert(
          {
            album_id: row.id,
            title: t.title,
            track_number: i + 1,
            duration_seconds: t.duration,
            mux_playback_id: pb,
            mux_status: "ready",
            genre_slug: a.genre,
            is_published: true,
            is_demo: true,
          },
          { onConflict: "album_id,track_number" }
        );
      if (terr) throw new Error(`track ${a.slug}[${i + 1}]: ${terr.message}`);
      trackCount++;
    }
  }
  console.log(`  ✓ ${albumCount} albums, ${trackCount} tracks`);

  // 3. Podcasts
  console.log("\n[podcasts] seeding 6 shows × 3 episodes...");
  let epCount = 0;
  for (const show of PODCASTS) {
    for (let i = 0; i < show.episodes.length; i++) {
      const ep = show.episodes[i];
      // Skip if (show_slug, episode_number) already exists
      const { data: existing } = await supabase
        .from("podcasts")
        .select("id")
        .eq("show_slug", show.show_slug)
        .eq("episode_number", i + 1)
        .limit(1);
      if (existing?.length) continue;

      const pb = nextPb();
      const publishedAt = new Date(Date.now() - ep.days_ago * 86400_000).toISOString();
      const { error: perr } = await supabase.from("podcasts").insert({
        show_slug: show.show_slug,
        show_title: show.show_title,
        show_description: show.show_description,
        title: ep.title,
        description: ep.description,
        audio_url: `https://stream.mux.com/${pb}/audio.m3u8`,
        mux_playback_id: pb,
        mux_status: "ready",
        thumbnail_url: show.cover,
        duration: ep.duration,
        episode_number: i + 1,
        season_number: 1,
        genre_slug: show.genre,
        is_published: true,
        is_demo: true,
        published_at: publishedAt,
      });
      if (perr) throw new Error(`podcast ${show.show_slug}[${i + 1}]: ${perr.message}`);
      epCount++;
    }
  }
  console.log(`  ✓ ${epCount} episodes inserted`);

  // 4. Playlists
  console.log("\n[playlists] seeding 6 editorial lists...");
  for (const pl of PLAYLISTS) {
    const { error: plerr } = await supabase
      .from("playlists")
      .upsert(
        {
          id: pl.id,
          title: pl.title,
          description: pl.description,
          cover_art_url: pl.cover,
          is_public: true,
          is_editorial: true,
          is_demo: true,
          genre_slug: pl.genre,
        },
        { onConflict: "id" }
      );
    if (plerr) throw new Error(`playlist ${pl.title}: ${plerr.message}`);
  }
  // Wipe and rebuild items
  await supabase.from("playlist_items").delete().in("playlist_id", PLAYLISTS.map((p) => p.id));
  for (const pl of PLAYLISTS) {
    const { data: tracks } = await supabase
      .from("tracks")
      .select("id, created_at")
      .eq("is_published", true)
      .in("genre_slug", pl.match_genres)
      .order("created_at", { ascending: true })
      .limit(6);
    if (!tracks?.length) continue;
    const items = tracks.map((t, i) => ({
      playlist_id: pl.id,
      position: i + 1,
      item_type: "track",
      item_id: t.id,
    }));
    const { error: ierr } = await supabase.from("playlist_items").insert(items);
    if (ierr) throw new Error(`playlist_items ${pl.title}: ${ierr.message}`);
  }
  console.log(`  ✓ 6 playlists with up to 6 tracks each`);

  console.log("\n=== DONE ===");
  const { count: albumTotal } = await supabase.from("albums").select("*", { count: "exact", head: true }).eq("is_published", true);
  const { count: trackTotal } = await supabase.from("tracks").select("*", { count: "exact", head: true }).eq("is_published", true);
  const { count: podTotal }   = await supabase.from("podcasts").select("*", { count: "exact", head: true }).eq("is_published", true);
  const { count: plTotal }    = await supabase.from("playlists").select("*", { count: "exact", head: true }).eq("is_public", true);
  console.log(JSON.stringify({
    total_published_albums: albumTotal,
    total_published_tracks: trackTotal,
    total_published_episodes: podTotal,
    total_public_playlists: plTotal,
    pool_used: pool,
  }, null, 2));
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
