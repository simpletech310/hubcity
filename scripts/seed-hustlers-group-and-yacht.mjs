#!/usr/bin/env node
/**
 * Seed the new "Hustlers" community group + the June Newport yacht
 * event built around it.
 *
 * What this seeds:
 *   1. Uploads scent-of-hustle photos + boat-party photos to
 *      post-images/scentofhustle/ + post-images/scentofhustle/yacht/
 *      and uploads the screen-recording .mov files to the reels bucket.
 *   2. Creates the "Hustlers" community_group (category=business, LA city)
 *      with Scent of Hustle as the founding admin (role='admin' in
 *      group_members).
 *   3. Drops 6 group_posts into the group's wall (mix of fragrance/
 *      hustle photos + a yacht-event teaser post).
 *   4. Drops 4 standalone posts to Scent of Hustle's profile feed so
 *      the group has visible activity from its founder.
 *   5. Inserts 2 reels (moments) — both group-scoped via reels.group_id
 *      so they show up under § HUSTLERS MOMENTS, and they also surface
 *      on the global /moments feed.
 *   6. Creates a "Newport Harbor — Luxury Yacht Charter" venue + four
 *      venue_sections that map to tiered packages:
 *        - DECK PASS         $250  (200 caps)
 *        - PREMIUM           $500  (80 caps)
 *        - VIP CABANA        $1200 (24 caps)
 *        - CAPTAIN'S TABLE   $2500 (8 caps)
 *   7. Creates the event "Hustlers Yacht Mixer · Newport" on the
 *      second Saturday of June, is_ticketed=true, links each
 *      venue_section via event_ticket_config so the /events/[id]/tickets
 *      page renders all four packages with their prices + remaining
 *      stock.
 *
 * Idempotent: re-running upserts the group on slug, removes prior
 * Hustlers group_posts/reels/posts authored by Scent of Hustle, deletes
 * the prior yacht event + venue if they exist, and rebuilds.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve, extname } from "node:path";
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

// ── Asset paths ────────────────────────────────────────────
const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/LA Accounts/Creator/scent of hustle post";

// 8 fragrance/hustle posts for the founder's wall + group activity
const SOH_IMAGES = [
  "IMG_2877.jpg",
  "IMG_2878.jpg",
  "IMG_2879.jpg",
  "IMG_2880.jpg",
  "IMG_2881.jpg",
  "IMG_2883.jpg",
  "IMG_2884.jpg",
  "IMG_2885.jpg",
  "IMG_2886.jpg",
  "IMG_2887.jpg",
];

// 3 boat-party / yacht images for the event cover and teaser posts
const YACHT_IMAGES = [
  "boat party 2.webp",
  "bost party 3.jpg",
  "bost party1.jpg",
];

// 2 short videos that become "moments" (reels) — pinned under the group
const MOMENT_VIDEOS = [
  "ScreenRecording_04-26-2026 21-52-04_1.mov",
  "ScreenRecording_04-26-2026 21-52-34_1.mov",
];

// Captions
const SOH_POST_CAPTIONS = [
  "Day 1 hustle. Day 365 hustle. The note doesn't change. 🪙",
  "Notes don't make the man. Habits do. ✍🏾",
  "Read the room before you spray it.",
  "Top notes: ambition. Heart notes: discipline. Base notes: family.",
  "Some scents are loud on purpose. So is your move.",
  "If you're not building anything, what are you wearing it for?",
  "Smell like the version of yourself that closed.",
];

const GROUP_POST_CAPTIONS = [
  // First post = the welcome / founder's note
  "Welcome to Hustlers. We talk money, moves, and the stuff between paychecks. Drop in. The group's only as strong as the people who show up. 🤝",
  // Yacht event teaser (paired with boat party 1 image)
  "📌 Pinned · We're locking in the first official Hustlers mixer — June 13, on a private 110-foot yacht out of Newport. Four package tiers, full bar, sunset playlist. Tickets opening tonight to group members first. 🛥️",
  // Hustle / fragrance crossover
  "Lesson 14 from running a label: pricing is psychology. People remember the receipt. ✍🏾",
  // Money post
  "Your first $10k is paid for in mistakes. Your first $100k is paid for in patience. Your first $1m is paid for in the network you stopped apologizing for. 🪙",
  // Recap / community
  "Sunday roundtable was 47 deep. Topic: how to talk about money inside your family without breaking it. Recap dropping in the group thread on Tuesday. 🎙️",
  // Yacht reminder (paired with boat party 2)
  "Reminder: Hustlers Yacht Mixer — June 13. Tickets are climbing fast through DECK PASS. VIP Cabana is half gone. Don't sleep. ⛵",
];

const MOMENT_CAPTIONS = [
  "Hustlers Newport mixer · 60 sec preview 🛥️",
  "Inside the group · 6 days till boarding ⛵",
];

// ── Storage helpers ────────────────────────────────────────
const CT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mov": "video/quicktime",
  ".mp4": "video/mp4",
};

async function uploadToBucket(bucket, storagePath, filePath) {
  const buf = readFileSync(filePath);
  const ext = extname(filePath).toLowerCase();
  const contentType = CT[ext] ?? "application/octet-stream";
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`upload ${bucket}/${storagePath}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

// ── Utility: format MB ────────────────────────────────────
function mb(p) {
  try {
    return (statSync(p).size / 1024 / 1024).toFixed(1);
  } catch {
    return "?";
  }
}

// ── Main ──────────────────────────────────────────────────
async function main() {
  console.log("=== Hustlers group + Yacht event seed ===\n");

  // 1. Resolve foundation rows
  const { data: city, error: cityErr } = await supabase
    .from("cities")
    .select("id, name")
    .eq("slug", "los-angeles")
    .maybeSingle();
  if (cityErr || !city) throw new Error("los-angeles city not found");

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("id, display_name, handle")
    .eq("handle", "scentofhustle")
    .maybeSingle();
  if (profErr || !profile) throw new Error("scentofhustle profile not found");

  console.log(`City: ${city.name} (${city.id})`);
  console.log(`Founder: ${profile.display_name} (${profile.id})\n`);

  // 2. Upload assets
  console.log("[uploads] photos → post-images/scentofhustle/");
  const sohImageUrls = [];
  for (const f of SOH_IMAGES) {
    const url = await uploadToBucket(
      "post-images",
      `scentofhustle/${f}`,
      `${ASSETS_DIR}/${f}`,
    );
    sohImageUrls.push(url);
    console.log(`  ✓ ${f}`);
  }

  console.log("\n[uploads] yacht photos → post-images/scentofhustle/yacht/");
  const yachtImageUrls = [];
  for (const f of YACHT_IMAGES) {
    const url = await uploadToBucket(
      "post-images",
      `scentofhustle/yacht/${f}`,
      `${ASSETS_DIR}/${f}`,
    );
    yachtImageUrls.push(url);
    console.log(`  ✓ ${f}`);
  }

  console.log("\n[uploads] moments → reels/scentofhustle/");
  const momentVideoUrls = [];
  for (const f of MOMENT_VIDEOS) {
    const fp = `${ASSETS_DIR}/${f}`;
    console.log(`  · ${f} (${mb(fp)} MB) uploading...`);
    const url = await uploadToBucket(
      "reels",
      `scentofhustle/${f.replace(/\s+/g, "_")}`,
      fp,
    );
    momentVideoUrls.push({
      video_url: url,
      video_path: `scentofhustle/${f.replace(/\s+/g, "_")}`,
    });
    console.log(`    → ${url}`);
  }

  // 3. Hustlers community group (upsert on slug)
  console.log("\n[group] upserting Hustlers community group...");
  const { data: group, error: groupErr } = await supabase
    .from("community_groups")
    .upsert(
      {
        slug: "hustlers",
        name: "Hustlers",
        description:
          "A financial group for the people building it themselves. Money, moves, and the stuff between paychecks. Founded by Scent of Hustle.",
        category: "business",
        image_url: yachtImageUrls[0] ?? sohImageUrls[0],
        avatar_url: sohImageUrls[0],
        is_public: true,
        is_active: true,
        city_id: city.id,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (groupErr) throw new Error(`group upsert: ${groupErr.message}`);
  console.log(`  ✓ Hustlers (${group.id})`);

  // Founder + admin membership
  await supabase.from("group_members").upsert(
    { group_id: group.id, user_id: profile.id, role: "admin" },
    { onConflict: "group_id,user_id" },
  );
  console.log(`  ✓ Scent of Hustle added as admin`);

  // 4. Wipe prior Hustlers content authored by the founder so re-runs are clean
  console.log("\n[reset] clearing prior group_posts + group reels + global posts");
  await supabase.from("group_posts").delete().eq("group_id", group.id);
  await supabase.from("reels").delete().eq("author_id", profile.id).eq("group_id", group.id);
  // Wipe posts that were seeded by THIS script (match a marker hashtag)
  await supabase
    .from("posts")
    .delete()
    .eq("author_id", profile.id)
    .contains("hashtags", ["hustlers"]);

  // 5. Group posts (6)
  console.log("\n[group_posts] inserting 6 group posts...");
  const groupPostBodies = GROUP_POST_CAPTIONS;
  const groupPostImages = [
    sohImageUrls[0], // welcome
    yachtImageUrls[2], // pinned yacht teaser → boat-party 1
    sohImageUrls[2], // pricing lesson
    sohImageUrls[5], // milestones
    sohImageUrls[7], // sunday roundtable
    yachtImageUrls[0], // yacht reminder → boat-party 2
  ];
  for (let i = 0; i < groupPostBodies.length; i++) {
    const { error } = await supabase.from("group_posts").insert({
      group_id: group.id,
      author_id: profile.id,
      body: groupPostBodies[i],
      image_url: groupPostImages[i],
      media_type: "image",
      is_pinned: i === 1, // pin the yacht-event teaser
      is_published: true,
    });
    if (error) throw new Error(`group_post ${i}: ${error.message}`);
    console.log(`  ✓ post ${i + 1}${i === 1 ? " (pinned)" : ""}`);
  }

  // 6. Global feed posts (4) — Scent of Hustle's profile activity
  console.log("\n[posts] inserting 4 global posts on profile feed...");
  for (let i = 0; i < 4; i++) {
    const { error } = await supabase.from("posts").insert({
      author_id: profile.id,
      body: SOH_POST_CAPTIONS[i] ?? "Scent of Hustle.",
      image_url: sohImageUrls[i + 1] ?? sohImageUrls[0],
      hashtags: ["hustlers", "scentofhustle", "luxury"],
      is_published: true,
    });
    if (error) throw new Error(`post ${i}: ${error.message}`);
    console.log(`  ✓ post ${i + 1}`);
  }

  // 7. Reels (2 group-scoped moments)
  console.log("\n[reels] inserting 2 group moments...");
  for (let i = 0; i < momentVideoUrls.length; i++) {
    const v = momentVideoUrls[i];
    const { error } = await supabase.from("reels").insert({
      author_id: profile.id,
      group_id: group.id,
      video_url: v.video_url,
      video_path: v.video_path,
      poster_url: yachtImageUrls[i] ?? sohImageUrls[i],
      caption: MOMENT_CAPTIONS[i] ?? "Hustlers · moment",
      hashtags: ["hustlers", "yachtmixer", "newport"],
      is_published: true,
    });
    if (error) throw new Error(`reel ${i}: ${error.message}`);
    console.log(`  ✓ moment ${i + 1}`);
  }

  // 8. Venue + sections (Newport Harbor yacht charter)
  console.log("\n[venue] upserting Newport Harbor venue + 4 sections...");
  const venueSlug = "newport-harbor-yacht-charter";
  const { data: venue, error: venueErr } = await supabase
    .from("venues")
    .upsert(
      {
        slug: venueSlug,
        name: "Newport Harbor — Luxury Yacht Charter",
        address: "Lido Marina Village, Newport Beach, CA 92663",
        latitude: 33.6157,
        longitude: -117.9283,
        image_url: yachtImageUrls[0],
        total_capacity: 312,
        is_active: true,
        created_by: profile.id,
      },
      { onConflict: "slug" },
    )
    .select("id")
    .single();
  if (venueErr) throw new Error(`venue: ${venueErr.message}`);
  console.log(`  ✓ Venue (${venue.id})`);

  // Reset prior sections (re-runs)
  await supabase.from("venue_sections").delete().eq("venue_id", venue.id);

  const SECTIONS = [
    {
      name: "Deck Pass",
      description:
        "General admission. Open deck access, sunset playlist, full hosted bar from 6–10pm. The pulse of the party.",
      capacity: 200,
      default_price: 25000, // $250
      sort_order: 1,
      color: "#C5A04E",
    },
    {
      name: "Premium",
      description:
        "Reserved upper-deck lounge seating, dedicated server, premium bar package, late-night charcuterie spread.",
      capacity: 80,
      default_price: 50000, // $500
      sort_order: 2,
      color: "#9F7E36",
    },
    {
      name: "VIP Cabana",
      description:
        "Private four-person cabana on the bow with bottle service, dedicated host, plated dinner, and a captain meet-and-greet.",
      capacity: 24,
      default_price: 120000, // $1200
      sort_order: 3,
      color: "#4A2E0A",
    },
    {
      name: "Captain's Table",
      description:
        "Eight-seat private dining room with the founder. Custom menu, paired tasting flight, after-party mainland transfer included.",
      capacity: 8,
      default_price: 250000, // $2500
      sort_order: 4,
      color: "#1A1512",
    },
  ];

  const sectionRows = [];
  for (const s of SECTIONS) {
    const { data: row, error: secErr } = await supabase
      .from("venue_sections")
      .insert({ venue_id: venue.id, ...s })
      .select("id, name, default_price, capacity")
      .single();
    if (secErr) throw new Error(`section ${s.name}: ${secErr.message}`);
    sectionRows.push(row);
    console.log(`  ✓ ${s.name} · $${(s.default_price / 100).toFixed(0)} × ${s.capacity}`);
  }

  // 9. Event (Hustlers Yacht Mixer · second Saturday of June)
  console.log("\n[event] upserting Hustlers Yacht Mixer event...");

  // Compute the second Saturday of June for the next available year
  const now = new Date();
  const targetYear =
    now.getMonth() > 5 || (now.getMonth() === 5 && now.getDate() > 14)
      ? now.getFullYear() + 1
      : now.getFullYear();
  const june1 = new Date(Date.UTC(targetYear, 5, 1));
  const firstSatOffset = (6 - june1.getUTCDay() + 7) % 7;
  const secondSat = new Date(Date.UTC(targetYear, 5, 1 + firstSatOffset + 7));
  const eventDate = secondSat.toISOString().slice(0, 10);

  const eventSlug = `hustlers-yacht-mixer-${targetYear}`;

  // Wipe prior event by slug so re-runs rebuild ticket configs cleanly
  await supabase.from("events").delete().eq("slug", eventSlug);

  const { data: event, error: evErr } = await supabase
    .from("events")
    .insert({
      slug: eventSlug,
      title: "Hustlers Yacht Mixer · Newport",
      description:
        "The first official Hustlers mixer — six hours on a private 110-foot yacht out of Newport Harbor. Sunset cruise from Lido Marina Village, full hosted bar, plated dinner for VIP and above, captain's-table founder dinner for the eight. Dress code: yacht-club black. Limited capacity per tier — packages sell out in order: Deck Pass → Premium → VIP Cabana → Captain's Table. Founders, freelancers, builders, and the people who run their own books.",
      category: "community",
      start_date: eventDate,
      start_time: "18:00:00",
      end_date: eventDate,
      end_time: "23:30:00",
      location_name: "Newport Harbor — Lido Marina Village",
      address: "Lido Marina Village, Newport Beach, CA 92663",
      latitude: 33.6157,
      longitude: -117.9283,
      image_url: yachtImageUrls[0],
      is_published: true,
      is_featured: true,
      is_ticketed: true,
      visibility: "public",
      venue_id: venue.id,
      max_tickets_per_person: 8,
      ticket_sales_start: new Date().toISOString(),
      ticket_sales_end: new Date(secondSat.getTime() - 6 * 60 * 60 * 1000).toISOString(),
      city_id: city.id,
      group_id: group.id,
      created_by: profile.id,
    })
    .select("id, slug, start_date")
    .single();
  if (evErr) throw new Error(`event: ${evErr.message}`);
  console.log(`  ✓ ${event.slug} on ${event.start_date} (id=${event.id})`);

  // 10. Event ticket configs (one per section)
  console.log("\n[event_ticket_config] linking event ↔ sections...");
  for (const s of sectionRows) {
    const { error: cfgErr } = await supabase.from("event_ticket_config").insert({
      event_id: event.id,
      venue_section_id: s.id,
      price: s.default_price,
      capacity: s.capacity,
      available_count: s.capacity,
      max_per_order: Math.min(8, s.capacity),
      is_active: true,
    });
    if (cfgErr) throw new Error(`cfg ${s.name}: ${cfgErr.message}`);
    console.log(`  ✓ ${s.name} · $${(s.default_price / 100).toFixed(0)} × ${s.capacity}`);
  }

  console.log("\n=== DONE ===");
  console.log({
    group: { id: group.id, slug: "hustlers" },
    event: {
      id: event.id,
      slug: event.slug,
      date: event.start_date,
      url: `/events/${event.id}`,
      tickets_url: `/events/${event.id}/tickets`,
    },
    venue: { id: venue.id, slug: venueSlug },
    counts: {
      group_posts: 6,
      profile_posts: 4,
      moments: 2,
      packages: SECTIONS.length,
    },
  });
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
