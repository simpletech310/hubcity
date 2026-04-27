#!/usr/bin/env node
/**
 * Fill out the Compton Art & History Museum's portfolio + events.
 *
 *   1. Add 8 profile_gallery_images for the museum, reusing the
 *      photos already uploaded to post-images/compton-museum/. These
 *      surface as "ART" tiles in the museum's portfolio grid on the
 *      /creators discover card and on its profile.
 *   2. Insert 5 events on the museum's calendar covering the
 *      programming pattern a real local museum runs: an opening
 *      night, a curator walk-through, a family workshop, a youth
 *      art crit, and a volunteer day. Each event uses a real museum
 *      photo as its cover image, is tagged for the right interests,
 *      and is dated forward so they show up on /events.
 *
 * Idempotent — gallery rows are only inserted if no row already
 * exists for the same image_url, and events are upserted by slug.
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

const MUSEUM_HANDLE = "compton-museum";

const STORAGE_PUBLIC_URL = (path) =>
  supabase.storage.from("post-images").getPublicUrl(path).data.publicUrl;

// Reuse museum photos that were already uploaded by
// scripts/seed-compton-museum-posts.mjs. Each gallery item picks a
// different photo so the portfolio doesn't repeat itself.
const GALLERY = [
  { file: "IMG_2737.jpg", caption: "Black Compton wall — second floor installation." },
  { file: "IMG_2739.jpg", caption: "Music & Movement gallery, west annex." },
  { file: "IMG_2741.jpg", caption: "Field-trip photo set, spring rotation." },
  { file: "IMG_2742.jpg", caption: "Late-afternoon light through the rotunda." },
  { file: "IMG_2744.jpg", caption: "A People's Compton — flyers archive." },
  { file: "IMG_2745.jpg", caption: "Volunteer Tuesdays — Cesar Chavez collection." },
  { file: "IMG_2747.jpg", caption: "Restored 1958 Compton Comets letterman jacket." },
  { file: "IMG_2750.jpg", caption: "First Friday Pop-Up, exterior shot." },
];

const TODAY = new Date();
function dateInDays(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

const EVENTS = [
  {
    slug: "compton-museum-first-friday-popup-2026",
    title: "First Friday Pop-Up at the Museum",
    description:
      "Vendors, music, and a free guided tour at 7pm. Bring the family. Bring a friend who's never been. Doors open 5pm; tour starts 7pm sharp.",
    category: "culture",
    start_date: dateInDays(4),
    start_time: "17:00",
    end_time: "21:00",
    location_name: "Compton Art & History Museum",
    address: "205 W Compton Blvd, Compton, CA 90220",
    image_file: "IMG_2750.jpg",
    tags: ["arts", "community", "family"],
    is_featured: true,
  },
  {
    slug: "voices-of-compton-opening-night",
    title: "Voices of Compton — Opening Night",
    description:
      "Opening night for our spring exhibition: oral histories, photographs, and field recordings spanning 50 years of Compton organizing. Curator's remarks at 6:30pm. Light reception to follow.",
    category: "culture",
    start_date: dateInDays(11),
    start_time: "18:00",
    end_time: "21:00",
    location_name: "East Wing Gallery",
    address: "205 W Compton Blvd, Compton, CA 90220",
    image_file: "IMG_2744.jpg",
    tags: ["arts", "community"],
    is_featured: true,
  },
  {
    slug: "family-saturday-make-your-own-mural",
    title: "Family Saturday — Make Your Own Mural",
    description:
      "A free hands-on art workshop for kids and parents. We'll build a tiled neighborhood mural together — every family takes home one tile. All materials provided. Drop in any time between 11am and 2pm.",
    category: "community",
    start_date: dateInDays(18),
    start_time: "11:00",
    end_time: "14:00",
    location_name: "Museum Education Studio",
    address: "205 W Compton Blvd, Compton, CA 90220",
    image_file: "IMG_2741.jpg",
    tags: ["family", "youth", "arts"],
    is_featured: false,
  },
  {
    slug: "compton-in-the-90s-curators-walkthrough",
    title: "Compton in the 90s — Curator's Walk-Through",
    description:
      "Join lead curator Dr. Lila Reyes for a 60-minute walk-through of our Music & Movement gallery. From Eazy and Dre to Kendrick — the sound of this city, told through artifacts you can stand next to. Limited to 30 attendees; please RSVP.",
    category: "culture",
    start_date: dateInDays(25),
    start_time: "14:00",
    end_time: "15:30",
    location_name: "Music & Movement Gallery",
    address: "205 W Compton Blvd, Compton, CA 90220",
    image_file: "IMG_2739.jpg",
    tags: ["arts", "music"],
    is_featured: false,
  },
  {
    slug: "compton-museum-volunteer-day-spring",
    title: "Volunteer Day at the Museum",
    description:
      "Help us re-catalog the Cesar Chavez collection — coffee, lunch, and a deeper relationship with this city's history on the house. No experience required; we'll teach you what to do. Sign up via the museum website.",
    category: "community",
    start_date: dateInDays(32),
    start_time: "10:00",
    end_time: "16:00",
    location_name: "Archives Room, Lower Level",
    address: "205 W Compton Blvd, Compton, CA 90220",
    image_file: "IMG_2745.jpg",
    tags: ["community", "education"],
    is_featured: false,
  },
];

async function main() {
  // Resolve the museum profile.
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, display_name, handle")
    .eq("handle", MUSEUM_HANDLE)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error(`@${MUSEUM_HANDLE} not found`);
  console.log(
    `Author: ${profile.display_name} (@${profile.handle}) ${profile.id}\n`
  );

  // ── Gallery ─────────────────────────────────────────────
  const { data: existingGallery } = await supabase
    .from("profile_gallery_images")
    .select("image_url")
    .eq("owner_id", profile.id);
  const seenGallery = new Set(
    (existingGallery ?? []).map((g) => g.image_url).filter(Boolean)
  );

  console.log(`[gallery] inserting ${GALLERY.length} art tiles...`);
  let galleryInserted = 0;
  for (let i = 0; i < GALLERY.length; i++) {
    const item = GALLERY[i];
    const url = STORAGE_PUBLIC_URL(`compton-museum/${item.file}`);
    if (seenGallery.has(url)) {
      console.log(`  skip ${item.file} — already in gallery`);
      continue;
    }
    const { error: gErr } = await supabase
      .from("profile_gallery_images")
      .insert({
        owner_id: profile.id,
        image_url: url,
        caption: item.caption,
        display_order: i,
      });
    if (gErr) throw new Error(`gallery ${item.file}: ${gErr.message}`);
    galleryInserted++;
    console.log(`  ✓ ${item.file} → ${item.caption}`);
  }
  console.log(`  total gallery items added: ${galleryInserted}\n`);

  // ── Events ──────────────────────────────────────────────
  console.log(`[events] upserting ${EVENTS.length} museum events...`);
  let eventsUpserted = 0;
  for (const e of EVENTS) {
    const image_url = STORAGE_PUBLIC_URL(`compton-museum/${e.image_file}`);
    const { error: eErr } = await supabase
      .from("events")
      .upsert(
        {
          slug: e.slug,
          title: e.title,
          description: e.description,
          category: e.category,
          start_date: e.start_date,
          start_time: e.start_time,
          end_time: e.end_time,
          location_name: e.location_name,
          address: e.address,
          image_url,
          tags: e.tags,
          is_featured: e.is_featured,
          is_published: true,
          created_by: profile.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
    if (eErr) throw new Error(`event ${e.slug}: ${eErr.message}`);
    eventsUpserted++;
    console.log(`  ✓ ${e.start_date} · ${e.title}`);
  }

  console.log(`\n=== DONE ===  gallery=${galleryInserted}  events=${eventsUpserted}`);
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
