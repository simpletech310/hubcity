#!/usr/bin/env node
/**
 * Seed Long Beach Run Club's profile + content.
 *
 * The auth user / profiles row already exists (handle:
 * `long-beach-runclub-owner`, role city_ambassador). This script
 * fills in:
 *   1. Bio + profile_tags + avatar/cover so the profile reads
 *      finished on /user/<handle>.
 *   2. 12 image posts captioned with run-club voice (each gets the
 *      required media_type='image' so PostCard renders properly).
 *   3. 4 text-only posts.
 *   4. profile_gallery_images for the /creators portfolio strip.
 *   5. 4 upcoming run events at real Long Beach parks / beach
 *      locations, each free + RSVP. is_featured on the next 2 so
 *      they hit the home culture rail.
 *
 * Idempotent: re-running wipes the prior posts / events / gallery
 * for this profile and re-creates everything from scratch.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join, extname, basename } from "node:path";
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

const HANDLE = "long-beach-runclub-owner";
const LB_CITY_ID = "b84256cd-9651-41be-9aec-5db97c825e34";
const ASSETS_ROOT =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Long Beach Accounts/Community/long beach run club group";

const MAX_UPLOAD_BYTES = 45 * 1024 * 1024;

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const isImage = (p) => IMAGE_EXT.has(extname(p).toLowerCase());
const contentTypeFor = (p) =>
  ({
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
  })[extname(p).toLowerCase()] || "application/octet-stream";

function staggeredTimestamp(maxDaysAgo, seedOffset = 0) {
  const ms =
    Math.floor(Math.random() * maxDaysAgo * 86400000) + seedOffset * 60000;
  return new Date(Date.now() - ms).toISOString();
}

async function uploadFile(bucket, storagePath, filePath) {
  const size = statSync(filePath).size;
  if (size > MAX_UPLOAD_BYTES) {
    console.warn(
      `    ⊘ skip ${basename(filePath)} (${(size / 1024 / 1024).toFixed(1)}MB)`,
    );
    return null;
  }
  const buf = readFileSync(filePath);
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
      contentType: contentTypeFor(filePath),
      cacheControl: "3600",
      upsert: true,
    });
    if (!error) {
      return supabase.storage.from(bucket).getPublicUrl(storagePath).data
        .publicUrl;
    }
    if (attempt === 3) {
      console.warn(`    ! ${storagePath}: ${error.message}`);
      return null;
    }
    await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  return null;
}

// 12 image-post captions in run-club voice.
const IMAGE_CAPTIONS = [
  "Sunday miles. Bixby Knolls loop, 6:30am, all paces welcome.",
  "Recovery shake-out at Marine Stadium. Easy 3 + coffee after.",
  "Track Tuesday — 400s at Wilson High. Bring water.",
  "Beach run from Belmont Pier to the Lighthouse. The view does the work for you.",
  "New shoes club + Saturday long run. 8 miles, no drop.",
  "Friday flush. 4 easy miles along Shoreline. Who's in?",
  "",
  "Race-week taper looks like this. See y'all at the start line.",
  "Pre-dawn club. We started at 5 — you should've been here.",
  "Hill repeats up Signal. The view at the top is the reward.",
  "Recap: 47 of us showed up to the pier this morning. PRs all around.",
  "Kids' run + parents' loop, this Saturday at El Dorado Park. Bring snacks.",
];

// 4 text-only posts.
const TEXT_POSTS = [
  "Reminder: every Saturday, 7am, Belmont Shore. Free, all paces, no judgement. Just bring water and a friend.",
  "If you're new to running and Long Beach: come Wednesday. We have a 'first 5K' group that runs no faster than 12 min/mile and we don't leave anyone behind.",
  "Big shout to everyone who showed up for the beach cleanup + recovery run last weekend. 14 bags of trash, 8 miles, and zero excuses.",
  "Race calendar update: Long Beach Half (Oct), Surf City 10 (Feb), and our Run Club 5K (TBD spring). Lock the dates.",
];

// 4 upcoming events at real LB locations.
const EVENT_DEFS = [
  {
    title: "Saturday Long Run · Belmont Shore",
    description:
      "8 miles flat from Belmont Pier to the Lighthouse and back. Coffee at Bagel Cafe after. Free, RSVP for headcount.",
    daysFromNow: 4,
    startTime: "07:00:00",
    locationName: "Belmont Pier",
    address: "39th Pl & E Ocean Blvd, Long Beach, CA 90803",
    flyerIdx: 0,
  },
  {
    title: "Track Tuesday · Wilson High",
    description:
      "Speed workout on the track. Warmup, 6×400 with rest, cooldown. Beginners welcome — we have a slower lane.",
    daysFromNow: 8,
    startTime: "18:30:00",
    locationName: "Wilson High School Track",
    address: "4400 E 10th St, Long Beach, CA 90804",
    flyerIdx: 1,
  },
  {
    title: "Beach Cleanup + Easy Run",
    description:
      "Trash bags + gloves + 4 easy miles. We pick up what we can on the way back. Hosted in partnership with the LB Parks Dept.",
    daysFromNow: 14,
    startTime: "08:00:00",
    locationName: "Junipero Beach",
    address: "Junipero Ave & E Ocean Blvd, Long Beach, CA 90803",
    flyerIdx: 2,
  },
  {
    title: "Sunset 5K · Shoreline",
    description:
      "Casual 5K starting at the bandshell, finishing at sunset. Family-friendly, strollers welcome. Free.",
    daysFromNow: 21,
    startTime: "18:00:00",
    locationName: "Shoreline Aquatic Park",
    address: "200 Aquarium Way, Long Beach, CA 90802",
    flyerIdx: 3,
  },
];

async function ensureBucket(name) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) await supabase.storage.createBucket(name, { public: true });
}

async function main() {
  await ensureBucket("post-images");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", HANDLE)
    .maybeSingle();
  if (!profile) {
    console.error(`Profile not found for handle ${HANDLE}`);
    process.exit(1);
  }
  const profileId = profile.id;
  console.log(`[${HANDLE}] profile ${profileId}`);

  // Wipe prior content so reruns stay clean.
  await supabase.from("posts").delete().eq("author_id", profileId);
  await supabase.from("reels").delete().eq("author_id", profileId);
  await supabase
    .from("profile_gallery_images")
    .delete()
    .eq("owner_id", profileId);
  await supabase
    .from("events")
    .delete()
    .eq("created_by", profileId)
    .like("slug", "lb-rc-%");
  console.log("  ✓ wiped prior content");

  // Upload images
  const entries = readdirSync(ASSETS_ROOT)
    .filter(
      (e) => !e.startsWith(".") && !statSync(join(ASSETS_ROOT, e)).isDirectory(),
    )
    .filter(isImage)
    .sort();

  const imageUrls = [];
  for (let i = 0; i < entries.length; i += 1) {
    const safe = entries[i].replace(/\s+/g, "_");
    const url = await uploadFile(
      "post-images",
      `lb-run-club/${i.toString().padStart(2, "0")}-${safe}`,
      join(ASSETS_ROOT, entries[i]),
    );
    if (url) imageUrls.push(url);
  }
  console.log(`  ✓ uploaded ${imageUrls.length} images`);

  if (imageUrls.length === 0) {
    console.error("  ! no images uploaded — bailing");
    return;
  }

  // Profile fill-in (bio, tags, avatar, cover, district). The owner is
  // a city_ambassador in Long Beach so we keep that role.
  await supabase
    .from("profiles")
    .update({
      bio: "Long Beach Run Club — Saturday long runs, Tuesday track, beach cleanups, and a finish-line beer for everyone who shows. All paces, no judgement.",
      profile_tags: ["running", "fitness", "long-beach", "community"],
      avatar_url: imageUrls[0],
      cover_url: imageUrls[1] ?? imageUrls[0],
      city_id: LB_CITY_ID,
      city: "Long Beach",
      state: "CA",
      verification_status: "verified",
      display_name: "Long Beach Run Club",
    })
    .eq("id", profileId);
  console.log("  ✓ profile fill-in");

  // 12 image posts
  let ts = 0;
  const postRows = [];
  for (let i = 0; i < imageUrls.length; i += 1) {
    postRows.push({
      author_id: profileId,
      body: IMAGE_CAPTIONS[i] ?? "",
      image_url: imageUrls[i],
      media_type: "image",
      is_published: true,
      created_at: staggeredTimestamp(28, ts++),
    });
  }
  // 4 text posts
  for (const body of TEXT_POSTS) {
    postRows.push({
      author_id: profileId,
      body,
      media_type: null,
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }
  const { error: postsErr } = await supabase.from("posts").insert(postRows);
  if (postsErr) console.warn(`  ! posts: ${postsErr.message}`);
  else console.log(`  ✓ ${postRows.length} posts (12 image + 4 text)`);

  // profile_gallery_images for the /creators portfolio strip
  const galleryRows = imageUrls.slice(0, 8).map((url, i) => ({
    owner_id: profileId,
    image_url: url,
    caption: IMAGE_CAPTIONS[i] || `Run ${i + 1}`,
    display_order: i,
  }));
  const { error: galErr } = await supabase
    .from("profile_gallery_images")
    .insert(galleryRows);
  if (galErr) console.warn(`  ! gallery: ${galErr.message}`);
  else console.log(`  ✓ ${galleryRows.length} portfolio gallery images`);

  // 4 events
  for (const ev of EVENT_DEFS) {
    const start = new Date();
    start.setDate(start.getDate() + ev.daysFromNow);
    const slug = `lb-rc-${ev.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)}-${Date.now().toString(36)}`;
    const flyer = imageUrls[ev.flyerIdx % Math.max(imageUrls.length, 1)] ?? null;
    const { error: evErr } = await supabase.from("events").insert({
      title: ev.title,
      slug,
      description: ev.description,
      category: "community",
      start_date: start.toISOString().slice(0, 10),
      start_time: ev.startTime,
      location_name: ev.locationName,
      address: ev.address,
      image_url: flyer,
      is_published: true,
      is_featured: ev.daysFromNow <= 14,
      created_by: profileId,
      city_id: LB_CITY_ID,
      visibility: "public",
    });
    if (evErr) console.warn(`  ! event ${ev.title}: ${evErr.message}`);
  }
  console.log(`  ✓ ${EVENT_DEFS.length} events`);

  console.log("\n→ verify on /user/long-beach-runclub-owner, /events?city=long-beach, /creators?city=long-beach");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
