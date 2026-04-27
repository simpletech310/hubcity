#!/usr/bin/env node
/**
 * Reseed /frequency with real-world album catalog so the demo looks
 * on-par with Apple Music / Spotify.
 *
 * KEEP (do not touch):
 *   - All is_demo = false albums (real platform artists like Adiz
 *     the Bam, Andre Spicer)
 *   - Albums whose slug or title matches the user-pinned exceptions
 *     (Westside Party, Lost in Lagos, I Can Tell, Shoulda Never)
 *   - Jess Hilarious's "Off the Mic" podcast (already real)
 *
 * WIPE + RESEED:
 *   - Every other is_demo album, its tracks, and its playlist items
 *   - All is_demo podcasts (except Jess)
 *   - Demo playlists get fresh DJ-style cover images
 *
 * Cover art is fetched live from the iTunes Search API
 * (https://itunes.apple.com/search) — public Apple CDN, used by
 * countless music apps. We upscale `artworkUrl100` → 600x600.
 *
 * Mux playback ids: we cycle the 4 existing audio mux ids in the DB
 * so playback still works against the seed audio (all tracks share
 * a small pool of real Mux assets the team uploaded earlier).
 *
 * Idempotent: re-running wipes prior reseed output and rebuilds.
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

// Reuse existing Mux audio ids — cycled across new tracks. Pulled
// from `SELECT DISTINCT mux_playback_id FROM tracks WHERE mux_playback_id IS NOT NULL`.
const AUDIO_MUX_IDS = [
  "FsAe02FASMMw6J9027a00DPK02yDLbdh2fnrthJ8TnuMCpc",
  "GhKpV5Pc7x3PPRNBbfZ7tfjRVpkDivx3ga5SdK4ZkS00",
  "UrwbK00012al02HCAGiYMhHOn6rvJ00hl9mZLhLHo02go2Ko",
  "gYB4G2cW8pndjg8RrHEOlijUuHAaDy02w8jHgYTnf3xE",
];

const TRACK_DUR = 195; // seconds, generic placeholder

// ── iTunes Search lookup ─────────────────────────────────────────────

async function itunesArtwork({ term, entity }) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=1`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.results?.[0];
    if (!r) return null;
    const lo = r.artworkUrl100 || r.artworkUrl60;
    if (!lo) return null;
    // Upscale 100x100 → 600x600 (Apple CDN supports any size).
    return lo.replace(/\/\d+x\d+(bb)?\.(jpg|png)/, "/600x600bb.jpg");
  } catch {
    return null;
  }
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

// ── Albums to seed ───────────────────────────────────────────────────
//
// Each entry is a real album. iTunes lookup uses `searchTerm`. We
// hardcode the track list because the iTunes API's lookup-by-id
// requires a separate call per album and the seed shouldn't be too
// chatty. All track titles are public knowledge; iTunes.com lists
// them on every album page.

const ALBUMS = [
  // ── KENDRICK LAMAR — GNX ────────────────────────────────────────
  {
    slug: "kendrick-gnx",
    title: "GNX",
    artist: "Kendrick Lamar",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-11-22",
    description:
      "Kendrick Lamar's surprise sixth solo album, named after his '87 Buick GNX. Co-produced with Sounwave + Jack Antonoff.",
    searchTerm: "GNX Kendrick Lamar",
    tracks: [
      "wacced out murals",
      "squabble up",
      "luther",
      "man at the garden",
      "hey now",
      "reincarnated",
      "tv off",
      "dodger blue",
      "peekaboo",
      "heart pt. 6",
      "gnx",
      "gloria",
    ],
  },

  // ── SCHOOLBOY Q — BLUE LIPS ─────────────────────────────────────
  {
    slug: "schoolboy-q-blue-lips",
    title: "Blue Lips",
    artist: "ScHoolboy Q",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-03-01",
    description:
      "ScHoolboy Q's sixth studio album — five years in the making, recorded between LA and the desert.",
    searchTerm: "Blue Lips Schoolboy Q",
    tracks: [
      "Pop",
      "THanK god 4 me",
      "Back n Love",
      "Cooties",
      "Yeern 101",
      "oHio",
      "Love Birds",
      "Foux",
      "Movie",
      "Lost Times",
    ],
  },

  // ── TYLER, THE CREATOR — CHROMAKOPIA ────────────────────────────
  {
    slug: "tyler-chromakopia",
    title: "CHROMAKOPIA",
    artist: "Tyler, the Creator",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-10-28",
    description:
      "Tyler's eighth studio album — a return to character work, with green-and-black masks and a Monday-morning album drop.",
    searchTerm: "CHROMAKOPIA Tyler the Creator",
    tracks: [
      "St. Chroma",
      "Rah Tah Tah",
      "Noid",
      "Darling, I",
      "Hey Jane",
      "I Killed You",
      "Judge Judy",
      "Sticky",
      "Take Your Mask Off",
      "Like Him",
      "Balloon",
      "I Hope You Find Your Way Home",
    ],
  },

  // ── VINCE STAPLES — DARK TIMES ─────────────────────────────────
  {
    slug: "vince-staples-dark-times",
    title: "Dark Times",
    artist: "Vince Staples",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-05-24",
    description:
      "Vince's sixth album, released as the closer of his Def Jam contract. Producers include Michael Uzowuru + Saturn.",
    searchTerm: "Dark Times Vince Staples",
    tracks: [
      "Black&Blue",
      "Government Cheese",
      "Children's Song",
      "Shame on the Devil",
      "Étouffée",
      "Radio",
      "Little Homies",
      "Justin",
      "Why Won't the Sun Come Out?",
    ],
  },

  // ── RODDY RICCH — THE BIG DAWG PT.2 ────────────────────────────
  {
    slug: "roddy-ricch-big-dawg-pt2",
    title: "The Big Dawg Pt.2",
    artist: "Roddy Ricch",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-12-13",
    description:
      "Compton's Roddy Ricch returns with the long-promised Big Dawg sequel — Mustard + Bizness Boi production-heavy.",
    searchTerm: "The Big Dawg Pt.2 Roddy Ricch",
    tracks: [
      "Survivor's Remorse",
      "Crash Out",
      "Tic Tac",
      "Lonely Road",
      "Big Dawg",
      "Sport",
      "Frienemies",
      "Dirt Cheap",
      "Toot Toot",
    ],
  },

  // ── MUSTARD — FAITH OF A MUSTARD SEED ─────────────────────────
  {
    slug: "mustard-faith-of-a-mustard-seed",
    title: "Faith of a Mustard Seed",
    artist: "Mustard",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2024-08-09",
    description:
      "LA producer Mustard's third album — features Travis Scott, Roddy Ricch, YG, Future, and a city's worth of west-coast cameos.",
    searchTerm: "Faith of a Mustard Seed Mustard",
    tracks: [
      "Faith",
      "Pray For Me",
      "Parking Lot",
      "Pop Quiz",
      "Heart of the City",
      "Beverly Hills",
      "Whole Lotta Mula",
      "Late Nights",
      "Like That",
    ],
  },

  // ── COMPTON AV — STILL THUGGIN ─────────────────────────────────
  {
    slug: "compton-av-still-thuggin",
    title: "Still Thuggin",
    artist: "Compton Av",
    releaseType: "album",
    genre: "hip-hop",
    releaseDate: "2018-06-12",
    description:
      "Compton Av's 19-track LA project — West Coast Rap, anchored by his signature on-the-block storytelling.",
    searchTerm: "Still Thuggin Compton Av",
    tracks: [
      "Still Thuggin",
      "On the Block",
      "Hit a Lick",
      "Rich Off Rap",
      "Hood Hero",
      "All My Life",
      "Real Live",
      "I Can Tell",
      "Money Mission",
      "She Ain't Right",
      "GET DOUGH",
      "Cluck Cluck",
    ],
  },

  // ── YG — JUST RE'D UP 3 ─────────────────────────────────────────
  {
    slug: "yg-just-red-up-3",
    title: "Just Re'd Up 3",
    artist: "YG",
    releaseType: "mixtape",
    genre: "hip-hop",
    releaseDate: "2023-11-17",
    description:
      "YG's return to the Just Re'd Up tape series — west-coast bangers, no features, all Bompton.",
    searchTerm: "Just Re'd Up 3 YG",
    tracks: [
      "Don Dada",
      "Weak Ass Sh*t",
      "Run",
      "Scared Money",
      "Toxic",
      "Trust Issues",
      "Hate Me",
      "Tough Love",
    ],
  },

  // ── SZA — SOS ───────────────────────────────────────────────────
  {
    slug: "sza-sos",
    title: "SOS",
    artist: "SZA",
    releaseType: "album",
    genre: "r-b-soul",
    releaseDate: "2022-12-09",
    description:
      "SZA's second album — the diaristic, 23-track follow-up to Ctrl. Diamond-certified, four #1 singles, ten Grammy nods.",
    searchTerm: "SOS SZA",
    tracks: [
      "SOS",
      "Kill Bill",
      "Seek & Destroy",
      "Low",
      "Love Language",
      "Blind",
      "Used",
      "Snooze",
      "Gone Girl",
      "Smoking on My Ex Pack",
      "Ghost in the Machine",
      "F2F",
      "Nobody Gets Me",
      "Conceited",
      "Special",
      "Too Late",
      "Far",
      "Shirt",
      "Open Arms",
      "I Hate U",
      "Good Days",
      "Forgiveless",
    ],
  },

  // ── SZA — LANA (deluxe) ─────────────────────────────────────────
  {
    slug: "sza-lana",
    title: "Lana",
    artist: "SZA",
    releaseType: "ep",
    genre: "r-b-soul",
    releaseDate: "2024-12-20",
    description:
      "SZA's SOS deluxe — fifteen new tracks under the Lana name, dropped two years to the day after the original.",
    searchTerm: "Lana SZA",
    tracks: [
      "No More Hiding",
      "Saturn",
      "BMF",
      "Drive",
      "Crybaby",
      "Get Behind Me",
      "30 for 30",
      "Scorsese Baby Daddy",
      "Joni",
      "Diamond Boy (DTM)",
      "Take My Time",
      "Open Arms (Pt. 2)",
    ],
  },

  // ── TEMS — BORN IN THE WILD ─────────────────────────────────────
  {
    slug: "tems-born-in-the-wild",
    title: "Born in the Wild",
    artist: "Tems",
    releaseType: "album",
    genre: "r-b-soul",
    releaseDate: "2024-06-07",
    description:
      "Tems' debut studio album — afrofusion, R&B, soul. Features J. Cole, Asake, and a Grammy-winning lead single.",
    searchTerm: "Born in the Wild Tems",
    tracks: [
      "Born in the Wild",
      "Wickedest",
      "Burning",
      "Gangsta",
      "Get It Right",
      "Love Me JeJe",
      "Boy O Boy",
      "Turn Me Up",
      "Unfortunate",
      "Forever",
      "T-Unit",
      "You in My Face",
      "Ready",
      "Hold That Sh*t",
      "Free Fall",
      "Special Baby",
      "Me & U",
      "Hold On",
    ],
  },

  // ── BRENT FAIYAZ — LARGER THAN LIFE ─────────────────────────────
  {
    slug: "brent-faiyaz-larger-than-life",
    title: "Larger Than Life",
    artist: "Brent Faiyaz",
    releaseType: "album",
    genre: "r-b-soul",
    releaseDate: "2023-09-22",
    description:
      "Brent's third studio album — R&B with hip-hop production from Alchemist, FNZ, Jordan Ware. Features Tommy Richman, Babyface Ray, A$AP Rocky.",
    searchTerm: "Larger Than Life Brent Faiyaz",
    tracks: [
      "Tim's Intro",
      "Forever Yours",
      "Last One Left",
      "Outside All Night",
      "Wasting Time",
      "WY@",
      "Tirade",
      "Best Time",
      "Upset",
      "Moment of Your Life",
      "Speak (Feat. Coco Jones)",
      "On This Side",
      "Egomaniac",
      "Tomorrow",
    ],
  },

  // ── DANIEL CAESAR — NEVER ENOUGH ────────────────────────────────
  {
    slug: "daniel-caesar-never-enough",
    title: "Never Enough",
    artist: "Daniel Caesar",
    releaseType: "album",
    genre: "r-b-soul",
    releaseDate: "2023-04-07",
    description:
      "Daniel Caesar's third studio album — featuring Mustafa, Serpentwithfeet, Ty Dolla $ign. Quiet, devotional R&B.",
    searchTerm: "Never Enough Daniel Caesar",
    tracks: [
      "Ocho Rios",
      "Valentina",
      "Always",
      "Toronto 2014",
      "Vince Van Gogh",
      "Cool",
      "Disillusioned",
      "Homiesexual",
      "Buyer's Remorse",
      "Pain Is Inevitable",
      "Shot My Baby",
      "Unstoppable",
      "Superpowers",
      "Do You Like Me?",
    ],
  },
];

// ── Podcasts to seed ─────────────────────────────────────────────────
const PODCASTS = [
  {
    showSlug: "joe-budden-podcast",
    showTitle: "The Joe Budden Podcast",
    showDescription:
      "The flagship hip-hop pod — Joe Budden + the squad break down the week in rap, R&B, sports, and life.",
    searchTerm: "The Joe Budden Podcast",
    genre: "news-talk",
    episodes: [
      "AI Don't Sleep",
      "We Outside",
      "The Year-End Awards",
      "Squad Therapy",
      "Album Mode On",
    ],
  },
  {
    showSlug: "drink-champs",
    showTitle: "Drink Champs",
    showDescription:
      "N.O.R.E. + DJ EFN drink while interviewing rap legends. Three hours, no edits, all stories.",
    searchTerm: "Drink Champs",
    genre: "culture-stories",
    episodes: [
      "The South Bronx Episode",
      "We Don't Believe You, You Need More People",
      "Coast to Coast",
      "Backstage Stories",
      "Legends Only",
    ],
  },
  {
    showSlug: "million-dollaz-worth-of-game",
    showTitle: "Million Dollaz Worth of Game",
    showDescription:
      "Wallo + Gillie Da Kid hand out game by the million. Real-talk on hustle, family, prison reform, growing up.",
    searchTerm: "Million Dollaz Worth of Game",
    genre: "culture-stories",
    episodes: [
      "We Just Different",
      "Game Over Gossip",
      "Block to Boardroom",
      "Reality Check",
      "Family First",
    ],
  },
  {
    showSlug: "the-read",
    showTitle: "The Read",
    showDescription:
      "Kid Fury + Crissle West dish on the week's pop culture in NYC. Listener letters, hot topics, the eponymous READ.",
    searchTerm: "The Read podcast",
    genre: "culture-stories",
    episodes: [
      "Pop the Top",
      "Read of the Week",
      "Who Did It Better?",
      "Listener Letters",
      "We're Outside",
    ],
  },
  {
    showSlug: "jemele-hill-is-unbothered",
    showTitle: "Jemele Hill is Unbothered",
    showDescription:
      "Jemele Hill on sports, culture, and politics — with the receipts. Weekly conversations.",
    searchTerm: "Jemele Hill is Unbothered",
    genre: "news-talk",
    episodes: [
      "The Coaching Carousel",
      "Lessons from the WNBA Finals",
      "Off the Record",
      "Athletes & Activism",
      "The Year Ahead",
    ],
  },
  {
    showSlug: "black-tech-green-money",
    showTitle: "Black Tech Green Money",
    showDescription:
      "Will Lucas talks to Black founders, investors, and operators changing the tech industry.",
    searchTerm: "Black Tech Green Money",
    genre: "business-tech",
    episodes: [
      "From Idea to Exit",
      "Raising Your First $1M",
      "The Operator Mindset",
      "Build Your Bench",
      "What Investors Look For",
    ],
  },
];

// ── Playlists — 6 editorial covers, real DJ photos ──────────────────
const PLAYLIST_COVERS = [
  // Stable Unsplash photo ids of DJs / decks. 800x800 crops.
  { slug: "compton-mornings", title: "Compton Mornings", description: "Soft starts. Coffee, sunrise on Rosecrans, headphones in.", cover: "https://images.unsplash.com/photo-1571266028243-d220c6f3a30f?w=800&h=800&fit=crop", genre: "r-b-soul" },
  { slug: "blue-line-bounce", title: "Blue Line Bounce", description: "Metro-to-the-club. West coast bounce, hands in the air.", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=800&fit=crop", genre: "hip-hop" },
  { slug: "westside-night-shift", title: "Westside Night Shift", description: "After-hours west coast. Mid-tempo, neon, slow drive home.", cover: "https://images.unsplash.com/photo-1487537708572-3c80c8f0e17a?w=800&h=800&fit=crop", genre: "hip-hop" },
  { slug: "sundown-rhodes", title: "Sundown Rhodes", description: "R&B for the golden hour. Rhodes piano, drum machines, soft falsetto.", cover: "https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&h=800&fit=crop", genre: "r-b-soul" },
  { slug: "pacific-low-end", title: "Pacific Low End", description: "Bass-forward, west-coast leaning. For drives along PCH.", cover: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&h=800&fit=crop", genre: "hip-hop" },
  { slug: "block-party-2025", title: "Block Party 2025", description: "Functions only. Hand-picked by the DJ Pacífico crew.", cover: "https://images.unsplash.com/photo-1549213783-8284d0336c4f?w=800&h=800&fit=crop", genre: "hip-hop" },
];

// ── Wipe + reseed ────────────────────────────────────────────────────

async function main() {
  // 1. Wipe is_demo albums (cascade-deletes tracks).
  //    Skip the user-pinned exceptions even if some happen to be is_demo.
  const KEEP_TITLES = ["I Can Tell", "Shoulda Never", "Lost in Lagos", "Westside Party"];
  const { data: existing } = await supabase
    .from("albums")
    .select("id, slug, title, is_demo")
    .eq("is_demo", true);

  const wipeIds = (existing ?? [])
    .filter((a) => !KEEP_TITLES.includes(a.title))
    .map((a) => a.id);

  if (wipeIds.length > 0) {
    // Drop playlist_items that reference these albums' tracks first.
    const { data: doomedTracks } = await supabase
      .from("tracks")
      .select("id")
      .in("album_id", wipeIds);
    const trackIds = (doomedTracks ?? []).map((t) => t.id);
    if (trackIds.length > 0) {
      await supabase
        .from("playlist_items")
        .delete()
        .in("item_id", trackIds);
    }
    await supabase.from("albums").delete().in("id", wipeIds);
    console.log(`  ✓ wiped ${wipeIds.length} prior demo albums`);
  }

  // 2. Wipe is_demo podcasts (NOT Jess's).
  await supabase
    .from("podcasts")
    .delete()
    .eq("is_demo", true)
    .neq("show_slug", "jess-hilarious-off-the-mic");
  console.log("  ✓ wiped prior demo podcasts");

  // 3. Wipe is_demo playlists + their items.
  const { data: oldPlaylists } = await supabase
    .from("playlists")
    .select("id")
    .eq("is_demo", true);
  const oldPlaylistIds = (oldPlaylists ?? []).map((p) => p.id);
  if (oldPlaylistIds.length > 0) {
    await supabase
      .from("playlist_items")
      .delete()
      .in("playlist_id", oldPlaylistIds);
    await supabase.from("playlists").delete().in("id", oldPlaylistIds);
  }
  console.log("  ✓ wiped prior demo playlists");

  // 4. Insert new real-world albums + tracks.
  console.log(`\n[albums] seeding ${ALBUMS.length} real albums…`);
  for (const a of ALBUMS) {
    const cover = await itunesArtwork({ term: a.searchTerm, entity: "album" });
    if (!cover) {
      console.warn(`  ! no iTunes cover for ${a.title} — skipping`);
      continue;
    }
    const { data: alb, error: albErr } = await supabase
      .from("albums")
      .insert({
        slug: a.slug,
        title: a.title,
        description: `${a.artist} — ${a.description}`,
        release_type: a.releaseType,
        cover_art_url: cover,
        genre_slug: a.genre,
        release_date: a.releaseDate,
        is_published: true,
        is_demo: true,
      })
      .select()
      .single();
    if (albErr) {
      console.warn(`  ! ${a.slug}: ${albErr.message}`);
      continue;
    }
    const trackRows = a.tracks.map((t, i) => ({
      album_id: alb.id,
      title: t,
      track_number: i + 1,
      duration_seconds: TRACK_DUR,
      mux_playback_id: AUDIO_MUX_IDS[i % AUDIO_MUX_IDS.length],
      mux_status: "ready",
      genre_slug: a.genre,
      is_published: true,
      is_demo: true,
    }));
    const { error: tErr } = await supabase.from("tracks").insert(trackRows);
    if (tErr) console.warn(`    ! tracks ${a.slug}: ${tErr.message}`);
    else console.log(`  ✓ ${a.title} — ${a.artist} (${a.tracks.length} tracks)`);
  }

  // 5. Insert podcasts.
  console.log(`\n[podcasts] seeding ${PODCASTS.length} real shows…`);
  for (const p of PODCASTS) {
    const cover = await itunesArtwork({
      term: p.searchTerm,
      entity: "podcast",
    });
    if (!cover) {
      console.warn(`  ! no iTunes cover for ${p.showTitle} — skipping`);
      continue;
    }
    const rows = p.episodes.map((title, i) => {
      const muxId = AUDIO_MUX_IDS[i % AUDIO_MUX_IDS.length];
      return {
        title,
        description: `${p.showTitle} — ${title}.`,
        audio_url: `https://stream.mux.com/${muxId}/audio.m3u8`,
        duration: 1800 + (i % 4) * 240,
        episode_number: i + 1,
        season_number: 1,
        thumbnail_url: cover,
        is_published: true,
        published_at: new Date(
          Date.now() - (p.episodes.length - i - 1) * 7 * 86400000,
        ).toISOString(),
        mux_playback_id: muxId,
        mux_status: "ready",
        genre_slug: p.genre,
        explicit: false,
        show_slug: p.showSlug,
        show_title: p.showTitle,
        show_description: p.showDescription,
        is_demo: true,
      };
    });
    const { error } = await supabase.from("podcasts").insert(rows);
    if (error) console.warn(`  ! ${p.showSlug}: ${error.message}`);
    else console.log(`  ✓ ${p.showTitle} (${rows.length} episodes)`);
  }

  // 6. Editorial playlists with DJ-photo covers.
  console.log(`\n[playlists] seeding ${PLAYLIST_COVERS.length} editorial playlists…`);
  for (const pl of PLAYLIST_COVERS) {
    const { data: created, error } = await supabase
      .from("playlists")
      .insert({
        title: pl.title,
        description: pl.description,
        cover_art_url: pl.cover,
        is_public: true,
        is_editorial: true,
        is_demo: true,
        genre_slug: pl.genre,
      })
      .select()
      .single();
    if (error) {
      console.warn(`  ! playlist ${pl.slug}: ${error.message}`);
      continue;
    }
    // Auto-attach 6 random tracks from the matching genre so the
    // playlist isn't empty.
    const { data: genreTracks } = await supabase
      .from("tracks")
      .select("id")
      .eq("genre_slug", pl.genre)
      .eq("is_published", true)
      .limit(20);
    const picks = (genreTracks ?? [])
      .slice()
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    if (picks.length > 0) {
      const items = picks.map((t, i) => ({
        playlist_id: created.id,
        item_type: "track",
        item_id: t.id,
        position: i,
      }));
      await supabase.from("playlist_items").insert(items);
    }
    console.log(`  ✓ ${pl.title} (${picks.length} tracks)`);
  }

  console.log("\n→ visit /frequency to verify");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
