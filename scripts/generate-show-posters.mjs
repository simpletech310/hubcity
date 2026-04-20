#!/usr/bin/env node

/**
 * Generate a custom poster for every creator show using Gemini 2.5
 * Flash Image ("Nano Banana"), upload it to post-images bucket, and
 * write the URL back to shows.poster_url.
 *
 * Idempotent: skips shows whose poster_url already points at a
 * shows/ path in our storage. Re-run after changing prompts or when
 * new shows are seeded.
 *
 * Required env: GEMINI_API_KEY (in .env.local), SUPABASE_* (already set).
 *
 * Usage:
 *   node scripts/generate-show-posters.mjs           # all shows
 *   node scripts/generate-show-posters.mjs fene310   # by creator handle
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

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is missing. Add it to .env.local.");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// Per-creator visual brief. Nudges Gemini toward the right feel without
// forcing the same look across every show.
const VISUAL_HINTS = {
  espresso: "warm spotlight, crowd silhouettes, neon accents, high-contrast nightlife energy",
  fene310: "moody editorial portrait vibe, soft grain, muted West Coast palette, reflective mood",
  kevonstage: "bold pop-art energy, clean studio framing, playful color blocking",
  lil_duval: "sun-soaked, candid travel/comedy feel, cheerful, summery palette",
  scentofhustle: "sleek luxury product photography, minimal background, gold + amber highlights",
  andrespicer: "community-documentary tone, early-morning street light, grounded and real",
  wickdconfections: "close-up dessert macro shots, pastel tones, soft bokeh, sweet and tactile",
};

async function fetchShows(filter) {
  const q = supabase
    .from("shows")
    .select(
      "id, title, tagline, description, format, poster_url, channel:channels!shows_channel_id_fkey(owner_id, owner:profiles!channels_owner_id_fkey(handle, display_name))"
    );
  const { data } = await q;
  const rows = data ?? [];
  if (filter.length === 0) return rows;
  const set = new Set(filter.map((f) => f.toLowerCase()));
  return rows.filter((r) => r.channel?.owner?.handle && set.has(r.channel.owner.handle.toLowerCase()));
}

function promptFor(show) {
  const handle = show.channel?.owner?.handle ?? "creator";
  const name = show.channel?.owner?.display_name ?? "Creator";
  const hint = VISUAL_HINTS[handle] ?? "bold editorial, cinematic, grounded in real textures";
  return `Design a vertical 9:16 show poster for a local creator series titled "${show.title}".
Subtitle idea: "${show.tagline ?? show.description ?? ""}".
Host: ${name} (@${handle}). Format: ${show.format ?? "show"}.
Visual direction: ${hint}. Dark, moody background with a single strong color accent. Composition should leave clean negative space near the top and bottom for a future title treatment — DO NOT render any text, letters, logos, numbers, or signs in the image. Photographic realism preferred, no illustrations, no UI mockups.`;
}

function inferStoragePath(handle, showId) {
  return `shows/${handle}/${showId}.png`;
}

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [
      {
        parts: [{ text: prompt }],
      },
    ],
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini ${res.status}: ${t.slice(0, 300)}`);
  }
  const json = await res.json();
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const p of parts) {
    if (p.inline_data?.data) return Buffer.from(p.inline_data.data, "base64");
    if (p.inlineData?.data) return Buffer.from(p.inlineData.data, "base64");
  }
  throw new Error("Gemini returned no image data");
}

async function uploadPoster(path, buffer) {
  const { error } = await supabase.storage
    .from("post-images")
    .upload(path, buffer, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: true,
    });
  if (error) throw new Error(`Upload ${path}: ${error.message}`);
  return supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;
}

/**
 * Fallback: when Gemini is rate-limited / billing-gated, pick a
 * visually distinctive post image from the creator (offset past the
 * first couple so it doesn't match the avatar) and use that as the
 * poster. Keeps each show's poster unique from the profile tiles.
 */
async function fallbackPostImage(ownerId, showIndex = 0) {
  const { data } = await supabase
    .from("posts")
    .select("image_url")
    .eq("author_id", ownerId)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .range(2, 12);
  const urls = (data ?? []).map((r) => r.image_url).filter(Boolean);
  if (urls.length === 0) return null;
  // Pick deterministically based on showIndex so re-runs stay stable.
  return urls[showIndex % urls.length];
}

async function processShow(show, ownerIndex) {
  const handle = show.channel?.owner?.handle;
  const ownerId = show.channel?.owner_id;
  if (!handle || !ownerId) {
    console.warn(`  ! ${show.id}: no owner handle`);
    return;
  }
  const label = `${handle} — ${show.title}`;
  const path = inferStoragePath(handle, show.id);
  const currentUrlMatchesPath = show.poster_url?.includes(`/shows/${handle}/`);
  if (currentUrlMatchesPath) {
    console.log(`  = ${label}: already has a generated poster`);
    return;
  }

  try {
    console.log(`  → ${label}: asking Gemini...`);
    const png = await callGemini(promptFor(show));
    const url = await uploadPoster(path, png);
    await supabase.from("shows").update({ poster_url: url }).eq("id", show.id);
    console.log(`  ✓ ${label}`);
  } catch (e) {
    const msg = String(e.message ?? e);
    const is429 = /429|quota|RESOURCE_EXHAUSTED/i.test(msg);
    if (!is429) {
      console.warn(`  ✗ ${label}: ${msg.slice(0, 200)}`);
      return;
    }
    const alt = await fallbackPostImage(ownerId, ownerIndex);
    if (!alt) {
      console.warn(`  ✗ ${label}: Gemini quota + no post image fallback`);
      return;
    }
    await supabase.from("shows").update({ poster_url: alt }).eq("id", show.id);
    console.log(`  ~ ${label}: Gemini quota; using curated post image`);
  }
}

async function main() {
  const filter = process.argv.slice(2);
  const shows = await fetchShows(filter);
  const withOwner = shows.filter((s) => s.channel?.owner?.handle);
  console.log(`Generating posters for ${withOwner.length} show${withOwner.length === 1 ? "" : "s"} (of ${shows.length} total)`);
  let idx = 0;
  for (const s of withOwner) {
    try {
      await processShow(s, idx++);
    } catch (e) {
      console.warn(`  ✗ ${s.title}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
