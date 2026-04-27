#!/usr/bin/env node
/**
 * Seed paid (ticketed) events for Left Right Connect — the Inland
 * Empire event promoter that owns the @leftright account. Pulls
 * cover art from the asset folder, creates one venue per real-world
 * location, and per-event ticket configs (GA + VIP / Add-on tiers)
 * so the events render as proper ticketed surfaces on /events and
 * the dashboard check-in console works for the host.
 *
 * Idempotent — skips events whose slug already exists, but refreshes
 * their venue + ticket config rows so price tweaks take effect on
 * rerun.
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

const LEFTRIGHT_USER_ID = "e3e3cb06-cef8-45e3-8e39-3500d7b6ab66";
const LEFTRIGHT_HANDLE = "leftright";
const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/IE Accounts/Creator/leftright post";

// Look up Compton's city_id once — Left Right operates in the IE,
// but we anchor to Compton (the only city seeded right now) so the
// events still surface in the all-cities default of /events.
async function comptonCityId() {
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("slug", "compton")
    .maybeSingle();
  return data?.id ?? null;
}

const EVENTS = [
  {
    slug: "lrc-urban-cowboy-night-temecula",
    title: "Urban Cowboy Night — Temecula Sports Lounge",
    description:
      "Boot up. Turn up. Ride out. Line-dance lessons 8–9 PM, best-dressed " +
      "contest with a $100 prize, urban + hip-hop hits all night, plus " +
      "green food specials. Saturday turn-up Inland Empire style.",
    coverFile: "IMG_3118.jpg", // urban cowboy flyer (parent dir)
    coverPublicKey: "leftright/events/urban-cowboy-night.jpg",
    startDate: "2026-05-16",
    startTime: "20:00:00",
    locationName: "Temecula Sports Lounge",
    address: "27911 Jefferson Ave, Temecula, CA 92590",
    venue: {
      slug: "temecula-sports-lounge",
      name: "Temecula Sports Lounge",
      address: "27911 Jefferson Ave, Temecula, CA 92590",
      capacity: 230,
    },
    sections: [
      { name: "General Admission", price: 2500, capacity: 200, max: 6 },
      { name: "VIP Booth (4 ppl + bottle credit)", price: 24000, capacity: 8, max: 2 },
    ],
    isFeatured: true,
  },
  {
    slug: "lrc-rnb-brunch-ay-mi-pa-riverside",
    title: "R&B Brunch — Ay Mi Pá! Dine and Lounge",
    description:
      "Saturday R&B Brunch in Riverside. Live DJ at 11:30 AM, brunch " +
      "starts at 10 AM, BOGO bottomless mimosas all afternoon. VIP + " +
      "reservations available — get in early, the room sells out.",
    coverFile: "events/IMG_3111.jpg", // r&b brunch flyer
    coverPublicKey: "leftright/events/rnb-brunch.jpg",
    startDate: "2026-05-09",
    startTime: "10:00:00",
    locationName: "Ay Mi Pá! Dine and Lounge — Riverside",
    address: "Ay Mi Pá Dine and Lounge, Riverside, CA",
    venue: {
      slug: "ay-mi-pa-riverside",
      name: "Ay Mi Pá! Dine and Lounge — Riverside",
      address: "Riverside, CA",
      capacity: 120,
    },
    sections: [
      { name: "General Admission", price: 3500, capacity: 80, max: 6 },
      { name: "VIP Booth (4 ppl)", price: 15000, capacity: 8, max: 2 },
      { name: "Bottomless Mimosa Add-on", price: 1200, capacity: 100, max: 8 },
    ],
    isFeatured: true,
  },
  {
    slug: "lrc-car-and-bike-show-san-bernardino",
    title: "E Street Cruisers — Car & Bike Show",
    description:
      "Inland Career Education Center turns into the IE's hottest car + " +
      "bike showcase. Live music from Three on a Match, free haircuts, " +
      "vendors, and food. $20 at the door — grab early-bird tickets here.",
    coverFile: "IMG_3119.jpg", // car & bike show flyer
    coverPublicKey: "leftright/events/car-bike-show.jpg",
    startDate: "2026-05-23",
    startTime: "11:00:00",
    locationName: "Inland Career Education Center",
    address: "1200 N. E Street, San Bernardino, CA 92405",
    venue: {
      slug: "inland-career-ed-center",
      name: "Inland Career Education Center",
      address: "1200 N. E Street, San Bernardino, CA 92405",
      capacity: 400,
    },
    sections: [
      { name: "General Admission", price: 2000, capacity: 350, max: 8 },
      { name: "Vendor / Showcase Pass", price: 5000, capacity: 50, max: 2 },
    ],
    isFeatured: false,
  },
  {
    slug: "lrc-big-back-snax-meet-greet",
    title: "Big Back Snax — Mr. Tendernism Meet & Greet",
    description:
      "Pull up to Big Back Snax in Riverside for a meet-and-greet with " +
      "Mr. Tendernism. Take photos, hang out, grab a snack haul on the " +
      "way out. Limited tickets — they sell fast.",
    coverFile: "IMG_3112.jpg", // big back snax flyer
    coverPublicKey: "leftright/events/big-back-snax.jpg",
    startDate: "2026-05-30",
    startTime: "15:00:00",
    locationName: "Big Back Snax",
    address: "6211 Valley Springs Pkwy, Suite A, Riverside, CA 92507",
    venue: {
      slug: "big-back-snax-riverside",
      name: "Big Back Snax — Riverside",
      address: "6211 Valley Springs Pkwy, Suite A, Riverside, CA 92507",
      capacity: 100,
    },
    sections: [
      { name: "General Admission", price: 1500, capacity: 80, max: 4 },
      { name: "Photo + Snack Pack", price: 3500, capacity: 30, max: 2 },
    ],
    isFeatured: false,
  },
];

const PROMO_POSTS = [
  {
    file: "IMG_3114.jpg",
    body:
      "URBAN COWBOY NIGHT — May 16 at Temecula Sports Lounge. Line-dance " +
      "lessons 8 PM, best-dressed prize, urban hits all night. Tickets up " +
      "now. — Left·Right·Connect 🤠",
  },
  {
    file: "IMG_3121.jpg",
    body:
      "R&B Brunch is BACK Saturday at Ay Mi Pá! Bottomless mimosas, live " +
      "DJ at 11:30, brunch 10 AM. VIP booths going fast. Tap in.",
  },
  {
    file: "IMG_3122.jpg",
    body:
      "Three events in May, IE — Urban Cowboy Night, R&B Brunch, and the " +
      "E Street Cruisers Car + Bike Show. Your plug to what's happening in " +
      "the Inland Empire.",
  },
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

async function ensureVenue(spec) {
  const { data: existing } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", spec.slug)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("venues")
    .insert({
      slug: spec.slug,
      name: spec.name,
      address: spec.address,
      total_capacity: spec.capacity,
      is_active: true,
      created_by: LEFTRIGHT_USER_ID,
    })
    .select("id")
    .single();
  if (error) {
    console.warn(`  ! venue ${spec.slug}: ${error.message}`);
    return null;
  }
  return data.id;
}

async function ensureSection(venueId, spec, sortOrder) {
  const { data: existing } = await supabase
    .from("venue_sections")
    .select("id")
    .eq("venue_id", venueId)
    .eq("name", spec.name)
    .maybeSingle();
  if (existing) {
    await supabase
      .from("venue_sections")
      .update({
        capacity: spec.capacity,
        default_price: spec.price,
        sort_order: sortOrder,
      })
      .eq("id", existing.id);
    return existing.id;
  }
  const { data, error } = await supabase
    .from("venue_sections")
    .insert({
      venue_id: venueId,
      name: spec.name,
      capacity: spec.capacity,
      default_price: spec.price,
      sort_order: sortOrder,
    })
    .select("id")
    .single();
  if (error) {
    console.warn(`    ! section ${spec.name}: ${error.message}`);
    return null;
  }
  return data.id;
}

async function ensureConfig(eventId, sectionId, spec) {
  const { data: existing } = await supabase
    .from("event_ticket_config")
    .select("id, capacity, available_count")
    .eq("event_id", eventId)
    .eq("venue_section_id", sectionId)
    .maybeSingle();
  if (existing) {
    const sold = existing.capacity - existing.available_count;
    const newAvailable = Math.max(0, spec.capacity - sold);
    await supabase
      .from("event_ticket_config")
      .update({
        price: spec.price,
        capacity: spec.capacity,
        available_count: newAvailable,
        max_per_order: spec.max,
        is_active: true,
      })
      .eq("id", existing.id);
    return existing.id;
  }
  const { error } = await supabase.from("event_ticket_config").insert({
    event_id: eventId,
    venue_section_id: sectionId,
    price: spec.price,
    capacity: spec.capacity,
    available_count: spec.capacity,
    max_per_order: spec.max,
    is_active: true,
  });
  if (error) console.warn(`    ! config: ${error.message}`);
}

async function main() {
  const cityId = await comptonCityId();
  if (!cityId) {
    console.warn("  ! no Compton city_id — events will land null-city");
  }

  for (const ev of EVENTS) {
    console.log(`\n[${ev.slug}]`);

    // 1. Upload cover art.
    const src = join(ASSETS_DIR, ev.coverFile);
    if (!statSync(src, { throwIfNoEntry: false })) {
      console.warn(`  ! cover not found: ${src}`);
      continue;
    }
    const coverUrl = await uploadFile(
      "post-images",
      ev.coverPublicKey,
      src,
      "image/jpeg",
    );
    if (!coverUrl) continue;

    // 2. Venue.
    const venueId = await ensureVenue(ev.venue);
    if (!venueId) continue;

    // 3. Upsert event.
    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("slug", ev.slug)
      .maybeSingle();

    let eventId;
    const eventPayload = {
      title: ev.title,
      slug: ev.slug,
      description: ev.description,
      category: "culture",
      start_date: ev.startDate,
      start_time: ev.startTime,
      location_name: ev.locationName,
      address: ev.address,
      image_url: coverUrl,
      is_published: true,
      is_featured: ev.isFeatured,
      created_by: LEFTRIGHT_USER_ID,
      is_ticketed: true,
      venue_id: venueId,
      max_tickets_per_person: 8,
      city_id: cityId,
      content_scope: "local",
    };
    if (existing) {
      eventId = existing.id;
      const { error } = await supabase
        .from("events")
        .update(eventPayload)
        .eq("id", eventId);
      if (error) console.warn(`  ! event update: ${error.message}`);
      else console.log(`  ⊘ event exists — refreshed`);
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert(eventPayload)
        .select("id")
        .single();
      if (error) {
        console.warn(`  ! event insert: ${error.message}`);
        continue;
      }
      eventId = data.id;
      console.log(`  ✓ event created (${eventId.slice(0, 8)}…)`);
    }

    // 4. Sections + per-event configs.
    for (let i = 0; i < ev.sections.length; i++) {
      const spec = ev.sections[i];
      const sectionId = await ensureSection(venueId, spec, i);
      if (!sectionId) continue;
      await ensureConfig(eventId, sectionId, spec);
      console.log(
        `    ✓ ${spec.name} — $${(spec.price / 100).toFixed(0)} × ${spec.capacity}`,
      );
    }
  }

  // 5. Promo posts on Left Right's profile.
  console.log("\n[promo posts]");
  // Wipe prior promo posts so reruns stay clean.
  await supabase
    .from("posts")
    .delete()
    .eq("author_id", LEFTRIGHT_USER_ID)
    .ilike("body", "%Left·Right·Connect%");
  await supabase
    .from("posts")
    .delete()
    .eq("author_id", LEFTRIGHT_USER_ID)
    .ilike("body", "%Inland Empire%");

  let postIdx = 0;
  for (const p of PROMO_POSTS) {
    const src = join(ASSETS_DIR, p.file);
    if (!statSync(src, { throwIfNoEntry: false })) continue;
    const url = await uploadFile(
      "post-images",
      `leftright/event-promo/${p.file}`,
      src,
      "image/jpeg",
    );
    if (!url) continue;
    const { error } = await supabase.from("posts").insert({
      author_id: LEFTRIGHT_USER_ID,
      body: p.body,
      image_url: url,
      media_type: "image",
      is_published: true,
      created_at: new Date(Date.now() - postIdx * 30 * 3600000).toISOString(),
    });
    if (error) console.warn(`  ! ${p.file}: ${error.message}`);
    else console.log(`  ✓ ${p.file}`);
    postIdx++;
  }

  console.log(
    "\n→ verify:" +
      "\n   /events                            (4 ticketed events surface)" +
      `\n   /user/${LEFTRIGHT_HANDLE}          (3 new event-promo image posts)` +
      "\n   /dashboard/events  (logged in as Left Right → OPEN CHECK-IN buttons)",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
