#!/usr/bin/env node

/**
 * Generate a show concept + episodes for every creator channel using
 * OpenAI, then insert a `shows` row and 3 `channel_videos` rows per
 * creator. Reuses existing Mux playback IDs (real, working assets
 * already in channel_videos) so the videos actually play instead of
 * returning 404s.
 *
 * Each creator's posts inform the AI prompt and supply the show poster
 * (first post image). Idempotent per creator slug: skips creators who
 * already have a show on their channel.
 *
 * Usage:
 *   node scripts/seed-creator-shows.mjs        # all creators
 *   node scripts/seed-creator-shows.mjs fene310 espresso   # specific handles
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
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
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Per-creator vibe brief (user-authored hints that nudge the model) ─
const VIBES = {
  espresso: "Live event recaps, pop-ups, and fun-times city nightlife. High-energy, cinematic.",
  fene310: "Conversational podcast format about community issues in Compton and the West Coast. Thoughtful, honest.",
  kevonstage: "Comedy commentary with cultural takes. Funny, sharp, timely.",
  lil_duval: "Lifestyle and comedy shorts. Smile-alive energy, light.",
  scentofhustle: "Hustle and fragrance stories. Sleek, aspirational, practical.",
  andrespicer: "Civic-minded storytelling about District 3. Plainspoken, community-first.",
  wickdconfections: "Behind-the-counter sweets and confectionery process. Sensory, playful.",
};

// Hand-authored fallback concepts used when OpenAI is rate-limited /
// over quota. Matches the vibe brief above so the seed keeps shipping
// content instead of failing. Replace these by deleting the show rows
// and rerunning after OpenAI comes back.
const FALLBACK_CONCEPTS = {
  espresso: {
    title: "Pop-Up Files",
    tagline: "The parties that made the city talk.",
    description: "Cinematic recaps of the week's pop-ups, launches, and late-night events. Short, loud, unfiltered.",
    format: "vlog",
    runtime_minutes: 12,
    episodes: [
      { title: "Rooftop Season Opener", description: "Doors at 9, line at 8 — how the season's first rooftop actually went." },
      { title: "Warehouse Takeover", description: "Sound system tested, neighbors surveyed, stories from the floor." },
      { title: "Sunday Day Party", description: "A slower set, better food, and the regulars who run it." },
    ],
  },
  fene310: {
    title: "310 Talk",
    tagline: "Community issues, straight from the block.",
    description: "A long-form podcast on community issues shaping Compton and the greater 310. Honest conversations with the people doing the work.",
    format: "podcast",
    runtime_minutes: 28,
    episodes: [
      { title: "Who Owns The Block", description: "Housing, ownership, and what's really keeping people rooted." },
      { title: "School Board Unfiltered", description: "A trustee sits down to answer what parents actually want to know." },
      { title: "Youth Money Talk", description: "Three young founders on building here without leaving." },
    ],
  },
  kevonstage: {
    title: "Sharp Takes",
    tagline: "Too real to scroll past.",
    description: "Short comedy commentary on the week's culture — pop, politics, and the things your group chat can't stop sending.",
    format: "comedy",
    runtime_minutes: 10,
    episodes: [
      { title: "The Group Chat Said", description: "The takes that somehow made it past everyone's filter." },
      { title: "Church Announcements", description: "A lovingly irreverent recap of this week's announcements." },
      { title: "Marriage Memos", description: "What the internet got wrong about being married." },
    ],
  },
  lil_duval: {
    title: "Smile You Alive",
    tagline: "Bright side, no paywall.",
    description: "Lifestyle and comedy shorts with Lil Duval energy. Travel, laughs, and the cheat codes for a better day.",
    format: "lifestyle",
    runtime_minutes: 8,
    episodes: [
      { title: "Best Hotel In The City", description: "A review nobody paid for." },
      { title: "The Cookout Rules", description: "What you bring, what you don't touch, what time you really arrive." },
      { title: "Tour Bus Diaries", description: "Two cities, four stops, one very small nap." },
    ],
  },
  scentofhustle: {
    title: "Note Set",
    tagline: "Fragrance, hustle, and the story behind the scent.",
    description: "Sleek fragrance drops and the hustle behind them. Founder conversations, top notes, and the playlist.",
    format: "short",
    runtime_minutes: 9,
    episodes: [
      { title: "Vanilla Was The Plan", description: "How a late-night pivot became the flagship scent." },
      { title: "Boutique Run", description: "Shelf placement, margins, and the real cost of a pop-up." },
      { title: "Under The Lid", description: "What actually goes into a 10ml." },
    ],
  },
  andrespicer: {
    title: "District Daily",
    tagline: "Your block, on the record.",
    description: "Civic storytelling from District 3. Town-hall recaps, resource walkthroughs, and conversations with the neighbors showing up.",
    format: "civic",
    runtime_minutes: 15,
    episodes: [
      { title: "Street Lights & Patience", description: "The small-ticket repairs that change the whole block." },
      { title: "Youth Resource Walk", description: "A Saturday morning walking to every program on the list." },
      { title: "Town Hall, Unedited", description: "The questions, the answers, the follow-ups that went on-camera." },
    ],
  },
  wickdconfections: {
    title: "Pan to Plate",
    tagline: "Small batch, big mood.",
    description: "Behind-the-counter look at a confectionery's week. Process shots, taste tests, and drops before they sell out.",
    format: "short",
    runtime_minutes: 8,
    episodes: [
      { title: "The Brown Butter Run", description: "A small-batch cookie drop from scale to tray." },
      { title: "Custom Orders Only", description: "A birthday cake's 36 hours, in order." },
      { title: "Sold Out Sunday", description: "What happens when the whole case clears before noon." },
    ],
  },
};

// Real Mux playback IDs already sitting in channel_videos. We reuse them
// round-robin so every seeded video actually plays. Free tier, no new
// uploads.
const MUX_PLAYBACK_POOL = [
  "VJkFgNyGAVe8YlQpI01PXWkG4qdg61Yx21Btud2s01pkw",
  "ukDevHNJhcOPHE2gkXy1FhGkXKW00o2rXdP02YNzwhjFE",
  "Wj9SOCl4ZddthbzZDlX01SS1AR95mmVJMMduJKURPO7g",
  "Wpv2mhduKBybbRufvVSSVUqec8i602vyrJPu56sLG402g",
  "AmwF6SmlvNJUSdG3UiCJqa101fJTPom1rCxvQ2OLzWSA",
  "f4Ug00QD4QexEgZGgQDng3qqrte5gR6RByNVK131oWZE",
  "FusUwGulDYINjFmmiWwIqy7JRw5Jtc7PKoR00luhEqW4",
];

function muxThumb(playbackId, time = 5) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&height=360&time=${time}&fit_mode=smartcrop`;
}

async function listCreators(filter) {
  const q = supabase
    .from("profiles")
    .select("id, handle, display_name, bio, avatar_url, role")
    .eq("role", "content_creator")
    .not("handle", "is", null);
  const { data } = await q;
  const rows = data ?? [];
  if (filter.length === 0) return rows;
  const set = new Set(filter.map((f) => f.toLowerCase()));
  return rows.filter((r) => r.handle && set.has(r.handle.toLowerCase()));
}

async function recentPostImages(authorId, n = 5) {
  const { data } = await supabase
    .from("posts")
    .select("image_url, body")
    .eq("author_id", authorId)
    .eq("is_published", true)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(n);
  return data ?? [];
}

async function creatorChannel(ownerId) {
  const { data } = await supabase
    .from("channels")
    .select("id, slug, name")
    .eq("owner_id", ownerId)
    .maybeSingle();
  return data;
}

async function showExists(channelId) {
  const { count } = await supabase
    .from("shows")
    .select("id", { count: "exact", head: true })
    .eq("channel_id", channelId);
  return (count ?? 0) > 0;
}

async function generateShowConcept(creator) {
  const vibe = VIBES[creator.handle] ?? `Original content from ${creator.display_name}. Match their bio and style.`;
  const system = `You write show concepts for a local creator platform. Return STRICT JSON only, no prose, no markdown. Keep it punchy and specific; no filler.`;
  const user = `Creator: @${creator.handle}
Display name: ${creator.display_name}
Bio: ${creator.bio ?? "(none)"}
Vibe brief: ${vibe}

Generate a single original show for this creator. JSON shape:
{
  "title": "<=4 words, no quotes, no emoji",
  "tagline": "<=12 words",
  "description": "2 short sentences about the show",
  "format": "one of: talk, podcast, vlog, short, event, music, comedy, lifestyle, civic",
  "runtime_minutes": integer 8-30,
  "episodes": [
    {"title": "<=6 words", "description": "1 sentence about the episode"},
    {"title": "...", "description": "..."},
    {"title": "...", "description": "..."}
  ]
}`;
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.9,
    response_format: { type: "json_object" },
  });
  const content = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(content);
}

async function seedForCreator(creator, muxPool, poolIdxRef) {
  const channel = await creatorChannel(creator.id);
  if (!channel) {
    console.warn(`  ! ${creator.handle}: no channel`);
    return;
  }
  if (await showExists(channel.id)) {
    console.log(`  = ${creator.handle}: show already exists, skipping`);
    return;
  }

  const images = await recentPostImages(creator.id);
  const posterUrl = images[0]?.image_url ?? null;

  let concept;
  try {
    console.log(`  → ${creator.handle}: asking OpenAI...`);
    concept = await generateShowConcept(creator);
  } catch (e) {
    const fallback = FALLBACK_CONCEPTS[creator.handle];
    if (!fallback) {
      console.warn(`  ! ${creator.handle}: OpenAI failed and no fallback: ${e.message}`);
      return;
    }
    console.log(`  ~ ${creator.handle}: OpenAI failed (${e.status ?? e.code ?? "err"}), using fallback`);
    concept = fallback;
  }

  const showSlug = `${creator.handle}-${concept.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;

  const { data: showRow, error: showErr } = await supabase
    .from("shows")
    .insert({
      channel_id: channel.id,
      slug: showSlug,
      title: concept.title,
      tagline: concept.tagline ?? null,
      description: concept.description ?? null,
      poster_url: posterUrl,
      runtime_minutes: concept.runtime_minutes ?? null,
      format: concept.format ?? null,
      creator_id: creator.id,
      is_active: true,
      sort_order: 0,
    })
    .select("id")
    .single();
  if (showErr) {
    console.warn(`  ! ${creator.handle}: show insert: ${showErr.message}`);
    return;
  }

  const episodes = Array.isArray(concept.episodes) ? concept.episodes.slice(0, 3) : [];
  let ep = 1;
  for (const e of episodes) {
    const playbackId = muxPool[poolIdxRef.i % muxPool.length];
    poolIdxRef.i++;
    const { error: vErr } = await supabase.from("channel_videos").insert({
      channel_id: channel.id,
      show_id: showRow.id,
      episode_number: ep,
      title: e.title ?? `Episode ${ep}`,
      description: e.description ?? null,
      mux_playback_id: playbackId,
      thumbnail_url: muxThumb(playbackId, 3 + ep * 2),
      video_type: "original",
      status: "ready",
      is_published: true,
      published_at: new Date(Date.now() - ep * 86400000).toISOString(),
      duration: (concept.runtime_minutes ?? 15) * 60,
      access_type: "free",
    });
    if (vErr) console.warn(`    ! episode ${ep}: ${vErr.message}`);
    ep++;
  }

  console.log(`  ✓ ${creator.handle}: "${concept.title}" + ${episodes.length} eps`);
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY missing. Add it to .env.local.");
    process.exit(1);
  }
  const filter = process.argv.slice(2);
  const creators = await listCreators(filter);
  console.log(`Seeding shows for ${creators.length} creator${creators.length === 1 ? "" : "s"}`);

  const poolIdxRef = { i: 0 };
  for (const c of creators) {
    try {
      await seedForCreator(c, MUX_PLAYBACK_POOL, poolIdxRef);
    } catch (e) {
      console.warn(`  ✗ ${c.handle}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
