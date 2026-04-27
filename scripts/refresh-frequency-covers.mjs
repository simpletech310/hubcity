#!/usr/bin/env node
/**
 * Refresh /frequency cover art + titles for the seeded demo catalog.
 *
 * Goal: make the audio hub LOOK like a real hip-hop / R&B catalog
 * — strong album titles, modern track names, current-feeling covers
 * — without touching Mux ids (so playback still works).
 *
 * Skipped intentionally:
 *   - Albums where is_demo = false (real artists like Adiz the Bam,
 *     Andre Spicer — those have actual cover art already).
 *   - Jess Hilarious's "Off the Mic" podcast (real account).
 *
 * Idempotent: re-running just re-applies the same UPDATEs.
 *
 * Cover art is sourced from Unsplash (royalty-free), using stable
 * public photo ids cropped 800x800 — strong portraits, neon urban,
 * studio gear, etc. that read as album art.
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

// 800×800 Unsplash crop. Use stable photo ids — these are public
// works on Unsplash and have been around long enough to trust.
const u = (id) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop`;

// ── Album refreshes ─────────────────────────────────────────────────
const ALBUM_UPDATES = [
  // ── HIP-HOP ───────────────────────────────────────────────────────
  {
    slug: "hub-city-anthem-rmx",
    title: "1500 BLOCK",
    description:
      "A west-coast remix flip — heavy 808s, gold-chain hi-hats, and a chant for the 1500 block.",
    cover: u("1571974599782-87624638275e"),
    tracks: [{ track_number: 1, title: "1500 Block (Remix)" }],
  },
  {
    slug: "rosecrans-roses",
    title: "Rosecrans Roses",
    description:
      "Three-track suite from the corner of Rosecrans + Central. Sunset SP-404 drums, sample-flip Cadillacs.",
    cover: u("1542038784456-1ea8e935640e"),
    tracks: [
      { track_number: 1, title: "On Tha Block" },
      { track_number: 2, title: "Pop's Cadillac" },
      { track_number: 3, title: "Drive Safe (Outro)" },
    ],
  },

  // ── R&B / SOUL ────────────────────────────────────────────────────
  {
    slug: "long-beach-nights-ep",
    title: "Long Beach Nights",
    description:
      "Late-night R&B from the 710 corridor. Three slow burners about staying up too late and texting too much.",
    cover: u("1606145737022-acd2055b7eed"),
    tracks: [
      { track_number: 1, title: "Velvet Hour" },
      { track_number: 2, title: "3AM (Phone on Silent)" },
      { track_number: 3, title: "Dominguez Drive" },
    ],
  },
  {
    slug: "palmer-park-summers",
    title: "Palmer Park Summers",
    description:
      "A summer R&B single. Backyard speakers, Palm trees, somebody's auntie clapping on 2 and 4.",
    cover: u("1500020108869-e4671b51d399"),
    tracks: [{ track_number: 1, title: "Palmer Park (Summers)" }],
  },

  // ── GOSPEL ────────────────────────────────────────────────────────
  {
    slug: "greater-temple-live",
    title: "Greater Temple — Live in Compton",
    description:
      "Sunday service, recorded live. Choir, horns, and three generations of testimony.",
    cover: u("1507692049790-de58290a4334"),
    tracks: [
      { track_number: 1, title: "Praise Procession" },
      { track_number: 2, title: "I Surrender (All)" },
      { track_number: 3, title: "Choir Reprise" },
    ],
  },

  // ── JAZZ ──────────────────────────────────────────────────────────
  {
    slug: "blue-line-quartet",
    title: "The Blue Line Quartet",
    description:
      "Standards reimagined for the LA Metro — recorded in one take across two stops.",
    cover: u("1415201364774-f6f0bb35f28f"),
    tracks: [
      { track_number: 1, title: "Wilmington Walk" },
      { track_number: 2, title: "Slauson Stride" },
    ],
  },

  // ── LATIN ─────────────────────────────────────────────────────────
  {
    slug: "cumbia-del-bulevar",
    title: "Cumbia del Bulevar",
    description:
      "A Compton-Acapulco cumbia for backyard parties — accordion, güiro, bass that hits.",
    cover: u("1493676304819-0d7a8d026dcf"),
    tracks: [{ track_number: 1, title: "Cumbia del Bulevar" }],
  },

  // ── REGGAE ────────────────────────────────────────────────────────
  {
    slug: "westside-roots-vol-1",
    title: "Westside Roots, Vol. 1",
    description:
      "A reggae mixtape of LA-rooted artists, hosted by DJ Pacífico. Roots, lover's rock, and a few dub flips.",
    cover: u("1471478331149-c72f17e33c73"),
    tracks: [
      { track_number: 1, title: "Sound the Horn" },
      { track_number: 2, title: "Skank in the Sun" },
      { track_number: 3, title: "Dub for the City" },
    ],
  },

  // ── ELECTRONIC ────────────────────────────────────────────────────
  {
    slug: "ports-and-power-lines",
    title: "Ports & Power Lines",
    description:
      "Ambient electronic record built around the 710 corridor. Recorded between Long Beach and South Gate.",
    cover: u("1518609878373-06d740f60d8b"),
    tracks: [
      { track_number: 1, title: "Substation" },
      { track_number: 2, title: "710 Loop" },
      { track_number: 3, title: "Phasewalker" },
    ],
  },

  // ── FAITH ─────────────────────────────────────────────────────────
  {
    slug: "letters-from-the-pulpit",
    title: "Letters from the Pulpit",
    description:
      "A gospel album in the form of letters — read aloud, set to choir, soft Rhodes, and sermon notes.",
    cover: u("1438232992991-995b7058bbb3"),
    tracks: [
      { track_number: 1, title: "Letter One: Hope" },
      { track_number: 2, title: "Letter Two: Endure" },
    ],
  },

  // ── CULTURE STORIES ───────────────────────────────────────────────
  {
    slug: "voices-of-the-hub",
    title: "Voices of the Hub",
    description:
      "Mixtape of recorded interviews with everyday Comptonians. Field recordings + soundbed by Hub City Press.",
    cover: u("1494059980473-813e73ee784b"),
    tracks: [
      { track_number: 1, title: "The Barber" },
      { track_number: 2, title: "The Crossing Guard" },
      { track_number: 3, title: "The Quinceañera" },
    ],
  },
  {
    slug: "north-of-rosecrans",
    title: "North of Rosecrans",
    description:
      "Spoken-word EP about the line that splits Compton from everywhere else. Two pieces, one bridge.",
    cover: u("1611345229637-be41b6d99e8d"),
    tracks: [
      { track_number: 1, title: "North of Rosecrans" },
      { track_number: 2, title: "Linden & Long Beach" },
    ],
  },
];

// ── Podcast covers (per show_slug, applies to all episodes) ─────────
const PODCAST_UPDATES = [
  {
    show_slug: "council-cast",
    show_title: "Council Cast",
    show_description:
      "A weekly recap of the Compton City Council — what passed, what didn't, and what to watch next.",
    cover: u("1589903308904-1010c2294adc"),
  },
  {
    show_slug: "hub-city-hustle",
    show_title: "Hub City Hustle",
    show_description:
      "Conversations with Compton entrepreneurs — barbershops, food trucks, fitness, fashion.",
    cover: u("1556761175-5973dc0f32e7"),
  },
  {
    show_slug: "after-service",
    show_title: "After Service",
    show_description:
      "Compton pastors and faith leaders, off the pulpit. Real talk over Sunday coffee.",
    cover: u("1507692049790-de58290a4334"),
  },
  {
    show_slug: "first-bell",
    show_title: "First Bell",
    show_description:
      "Stories from CUSD teachers + students. School year, in real time.",
    cover: u("1503676260728-1c00da094a0b"),
  },
  {
    show_slug: "centennial-sidelines",
    show_title: "Centennial Sidelines",
    show_description:
      "Compton high school sports beat — coaches, recruits, friday night lights.",
    cover: u("1517649763962-0c623066013b"),
  },
  {
    show_slug: "block-stories",
    show_title: "Block Stories",
    show_description:
      "Field-recorded interviews with everyday Comptonians. One block, one story, every week.",
    cover: u("1494059980473-813e73ee784b"),
  },
];

// ── Run ─────────────────────────────────────────────────────────────

async function refreshAlbum(spec) {
  const { data: album } = await supabase
    .from("albums")
    .select("id, slug, is_demo")
    .eq("slug", spec.slug)
    .maybeSingle();
  if (!album) {
    console.warn(`  ! album not found: ${spec.slug}`);
    return;
  }
  if (!album.is_demo) {
    console.warn(`  ⊘ skip ${spec.slug} (real artist, not is_demo)`);
    return;
  }

  await supabase
    .from("albums")
    .update({
      title: spec.title,
      description: spec.description,
      cover_art_url: spec.cover,
      updated_at: new Date().toISOString(),
    })
    .eq("id", album.id);

  for (const t of spec.tracks) {
    await supabase
      .from("tracks")
      .update({ title: t.title })
      .eq("album_id", album.id)
      .eq("track_number", t.track_number);
  }
  console.log(`  ✓ ${spec.slug} (${spec.tracks.length} tracks)`);
}

async function refreshPodcast(spec) {
  const { error } = await supabase
    .from("podcasts")
    .update({
      show_title: spec.show_title,
      show_description: spec.show_description,
      thumbnail_url: spec.cover,
    })
    .eq("show_slug", spec.show_slug)
    .eq("is_demo", true);
  if (error) {
    console.warn(`  ! podcast ${spec.show_slug}: ${error.message}`);
    return;
  }
  console.log(`  ✓ podcast ${spec.show_slug}`);
}

async function main() {
  console.log(`\n[albums] refreshing ${ALBUM_UPDATES.length} demo albums…`);
  for (const a of ALBUM_UPDATES) await refreshAlbum(a);

  console.log(`\n[podcasts] refreshing ${PODCAST_UPDATES.length} demo shows…`);
  for (const p of PODCAST_UPDATES) await refreshPodcast(p);

  console.log("\n→ visit /frequency to verify the new covers + titles");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
