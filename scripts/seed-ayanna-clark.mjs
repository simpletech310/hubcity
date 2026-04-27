#!/usr/bin/env node
/**
 * Seed Ayanna Clark — children's-book illustrator + paint-and-sip host.
 *
 * What lands:
 *   1. Auth user + content_creator profile (verified).
 *   2. Single dual-mode business "Ayanna Clark Illustrations" that
 *      sells children's books (accepts_orders) AND books paint-and-
 *      sip parties (accepts_bookings). business_type = retail with
 *      both flags on so the dashboard surfaces Catalog + Bookings.
 *   3. Posts (12 image · 2 video · 4 text), reels with poster
 *      fallbacks, profile_gallery_images for the /creators strip.
 *   4. menu_items for each book in /Books (cover from the asset).
 *   5. services for the paint-and-sip lineup + illustration commissions.
 *   6. service_addons under each Paint & Sip service so customers
 *      can stack extras (wine pairing, custom canvas, party favors).
 *   7. 4 ticketed paint-and-sip events using the Events flyers.
 *
 * Idempotent: re-runs wipe prior posts / reels / events / menu_items
 * / services / addons / business + re-create.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

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

const HANDLE = "ayanna-clark";
const EMAIL = "ayanna.clark@hubcityapp.com";
const DISPLAY_NAME = "Ayanna Clark";
const PASSWORD = "HubCity2026!";
const BUSINESS_SLUG = "ayanna-clark-illustrations";
const COMPTON_CITY_ID = "398a39cc-367b-4604-b6b2-1042fde1a041";
const COMPTON_LAT = 33.8959;
const COMPTON_LNG = -118.22;

const ASSETS_ROOT =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Creator/Ayanna Clark Illustrations";

const MAX_UPLOAD_BYTES = 45 * 1024 * 1024;

// ── Helpers ──────────────────────────────────────────────────────────

function handleToUuid(handle) {
  const h = createHash("sha256")
    .update(`hubcity-creator:${handle}`)
    .digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "4" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".webm", ".m4v"]);
const isImage = (p) => IMAGE_EXT.has(extname(p).toLowerCase());
const isVideo = (p) => VIDEO_EXT.has(extname(p).toLowerCase());
const contentTypeFor = (p) =>
  ({
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".m4v": "video/mp4",
  })[extname(p).toLowerCase()] || "application/octet-stream";

function staggeredTimestamp(maxDaysAgo, seedOffset = 0) {
  const ms =
    Math.floor(Math.random() * maxDaysAgo * 86400000) + seedOffset * 60000;
  return new Date(Date.now() - ms).toISOString();
}

async function uploadFile(bucket, storagePath, filePath) {
  const size = statSync(filePath).size;
  if (size > MAX_UPLOAD_BYTES) {
    console.warn(`    ⊘ skip ${basename(filePath)} (${(size / 1024 / 1024).toFixed(1)}MB)`);
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

async function ensureBucket(name) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) await supabase.storage.createBucket(name, { public: true });
}

// ── Books — names + blurbs (covers come from /Books folder, in order) ───
const BOOK_NAMES = [
  { name: "Hair Like Mine", blurb: "A tender bedtime read about loving every coil. Ages 4–8. Hardcover, 32 pages." },
  { name: "Compton Crawl", blurb: "An ABC tour of the city — from Avalon to Zamora. Ages 3–6." },
  { name: "Auntie Said What?", blurb: "A laugh-out-loud picture book about kitchen-table wisdom. Ages 5–8." },
  { name: "The Brown Girl Code", blurb: "Affirmation board book for the youngest readers. Ages 0–3." },
  { name: "Recess on the Roof", blurb: "An imaginative middle-grade reader about a school nobody believes in. Ages 7–10." },
  { name: "Mom's Hands Make Magic", blurb: "An illustrated love letter to working moms. Ages 4–8." },
  { name: "Daddy's Day at Work", blurb: "Following a dad through Compton on a Tuesday. Ages 3–6." },
];

// ── Services + add-ons ──────────────────────────────────────────────
const SERVICES = [
  {
    name: "Paint & Sip — Adult Group",
    description:
      "2-hour paint-and-sip night for groups of 8–25 adults. All supplies included. BYO drinks (we provide cups + ice).",
    duration: 120,
    price: 4500, // $45/person
    sortOrder: 0,
    addons: [
      { name: "Wine Pairing (per guest)", description: "Two-pour pairing curated for the night's painting.", price: 1500 },
      { name: "Custom Canvas Size — 18×24", description: "Upgrade from the standard 11×14 canvas.", price: 1200 },
      { name: "Personalized Apron (per guest)", description: "Take-home apron with your group's name printed on it.", price: 1800 },
      { name: "Photographer (1hr)", description: "On-site photographer for the first hour. Edited gallery delivered.", price: 15000 },
    ],
  },
  {
    name: "Paint & Sip — Kids' Party",
    description:
      "90-minute kids' birthday paint party for 6–18 children (ages 5+). Smocks, paint, snacks, party favors all included.",
    duration: 90,
    price: 3500,
    sortOrder: 1,
    addons: [
      { name: "Cupcakes for All", description: "Homemade cupcakes from Pucker Up — 1 per child.", price: 800 },
      { name: "Custom Birthday Canvas", description: "The birthday kid takes home a personalized canvas signed by the group.", price: 2500 },
      { name: "Take-home Art Kits", description: "Each kid leaves with a kit to keep painting at home.", price: 1500 },
    ],
  },
  {
    name: "Paint & Sip — Corporate / Team Building",
    description:
      "2.5-hour facilitated team-building paint session for 10–40 colleagues. Includes ice-breaker exercises.",
    duration: 150,
    price: 6500,
    sortOrder: 2,
    addons: [
      { name: "Catering Add-on", description: "Light bites + non-alcoholic drinks from Element 78 Café.", price: 2200 },
      { name: "Branded Canvases", description: "Each canvas pre-printed with the company logo as the painting base.", price: 1800 },
      { name: "Recap Video", description: "30-second highlight video, edited within 48 hours.", price: 25000 },
    ],
  },
  {
    name: "Custom Illustration — Single Page",
    description:
      "One full-color custom illustration in Ayanna's signature style. 8×10 inches. 4-week turnaround.",
    duration: 60,
    price: 35000,
    sortOrder: 3,
    addons: [
      { name: "Hand-lettered Signature", description: "Add a hand-painted name or quote to the illustration.", price: 4500 },
      { name: "Print-ready Files", description: "Receive 300 DPI print files in addition to the original.", price: 2500 },
    ],
  },
  {
    name: "Children's Book — Cover Illustration",
    description:
      "Full cover (front + spine + back) illustration for a self-published or independent children's book.",
    duration: 60,
    price: 120000,
    sortOrder: 4,
    addons: [
      { name: "Interior Spread (per page)", description: "Add additional interior illustrations à la carte.", price: 25000 },
      { name: "Express Delivery (2 weeks)", description: "Cuts standard turnaround in half.", price: 30000 },
    ],
  },
];

// ── Events (paint & sip) ────────────────────────────────────────────
const EVENTS = [
  {
    title: "Paint & Sip — Mother's Day Edition",
    description:
      "Bring the moms, the aunties, the godmothers. Two hours, all-inclusive paint + light bites. 21+.",
    daysFromNow: 18,
    startTime: "18:30:00",
    flyerIdx: 0,
    isFeatured: true,
  },
  {
    title: "Paint & Sip — Couples Night",
    description:
      "A two-canvas couple's night — paint side-by-side, take home a matching set. 21+.",
    daysFromNow: 28,
    startTime: "19:00:00",
    flyerIdx: 1,
    isFeatured: true,
  },
  {
    title: "Kids' Paint Party — Saturday Drop-off",
    description:
      "Drop the kids off for 90 minutes of paint + snacks while you take a break. Ages 5–11.",
    daysFromNow: 12,
    startTime: "11:00:00",
    flyerIdx: 2,
    isFeatured: false,
  },
  {
    title: "Paint & Sip — Juneteenth Special",
    description:
      "Juneteenth-themed paint night honoring Black artists. All-inclusive, 21+.",
    daysFromNow: 50,
    startTime: "19:00:00",
    flyerIdx: 3,
    isFeatured: false,
  },
];

// ── Wipe + reseed ───────────────────────────────────────────────────

async function wipePrior(profileId) {
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
    .like("slug", "ayanna-%");

  // Business cascade-deletes menu_items + services. service_addons
  // cascade off services. Just delete the business.
  await supabase.from("businesses").delete().eq("slug", BUSINESS_SLUG);
}

async function ensureProfile(profileId) {
  const { error: authErr } = await supabase.auth.admin.createUser({
    id: profileId,
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { handle: HANDLE, display_name: DISPLAY_NAME },
  });
  if (
    authErr &&
    !/already.*registered|duplicate|exists|user.+already/i.test(authErr.message)
  ) {
    throw new Error(`auth.createUser: ${authErr.message}`);
  }

  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      id: profileId,
      display_name: DISPLAY_NAME,
      handle: HANDLE,
      bio: "Children's-book illustrator. Paint-and-sip host. Compton-rooted, Black-girl-magic curriculum on every page.",
      role: "content_creator",
      city_id: COMPTON_CITY_ID,
      city: "Compton",
      state: "CA",
      district: 2,
      is_creator: true,
      creator_approved_at: new Date().toISOString(),
      verification_status: "verified",
      profile_tags: ["illustrator", "children-books", "paint-and-sip", "compton"],
    },
    { onConflict: "id" },
  );
  if (pErr) throw new Error(`profiles.upsert: ${pErr.message}`);
}

async function uploadAssets() {
  const root = readdirSync(ASSETS_ROOT)
    .filter(
      (e) =>
        !e.startsWith(".") && !statSync(join(ASSETS_ROOT, e)).isDirectory(),
    )
    .sort();
  const images = root.filter(isImage);
  const videos = root.filter(isVideo);

  const imageUrls = [];
  for (let i = 0; i < images.length; i += 1) {
    const safe = images[i].replace(/\s+/g, "_");
    const url = await uploadFile(
      "post-images",
      `${HANDLE}/${i.toString().padStart(2, "0")}-${safe}`,
      join(ASSETS_ROOT, images[i]),
    );
    if (url) imageUrls.push(url);
  }

  const videoUrls = [];
  for (let i = 0; i < videos.length; i += 1) {
    const safe = videos[i].replace(/\s+/g, "_");
    const path = `${HANDLE}/${i.toString().padStart(2, "0")}-${safe}`;
    const url = await uploadFile("reels", path, join(ASSETS_ROOT, videos[i]));
    if (url) videoUrls.push({ url, path });
  }

  // Books folder → cover image per SKU
  const booksDir = join(ASSETS_ROOT, "Books");
  const bookFiles = readdirSync(booksDir)
    .filter((e) => !e.startsWith(".") && isImage(e))
    .sort();
  const bookCovers = [];
  for (let i = 0; i < bookFiles.length; i += 1) {
    const safe = bookFiles[i].replace(/\s+/g, "_");
    const url = await uploadFile(
      "post-images",
      `${HANDLE}/books/${i.toString().padStart(2, "0")}-${safe}`,
      join(booksDir, bookFiles[i]),
    );
    if (url) bookCovers.push(url);
  }

  // Events folder → flyer per event
  const eventsDir = join(ASSETS_ROOT, "Events");
  const eventFiles = readdirSync(eventsDir)
    .filter((e) => !e.startsWith(".") && isImage(e))
    .sort();
  const eventFlyers = [];
  for (let i = 0; i < eventFiles.length; i += 1) {
    const safe = eventFiles[i].replace(/\s+/g, "_");
    const url = await uploadFile(
      "post-images",
      `${HANDLE}/events/${i.toString().padStart(2, "0")}-${safe}`,
      join(eventsDir, eventFiles[i]),
    );
    if (url) eventFlyers.push(url);
  }

  return { imageUrls, videoUrls, bookCovers, eventFlyers };
}

async function seedBusiness(profileId, imageUrls) {
  const galleryImageUrls = imageUrls.slice(0, 8);
  const { data: biz, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: profileId,
      name: "Ayanna Clark Illustrations",
      slug: BUSINESS_SLUG,
      category: "retail",
      business_type: "retail",
      business_sub_type: "brick_and_mortar",
      description:
        "Children's books, custom illustration, and paint-and-sip parties. Order a book, commission a portrait, or book a private party — all from one Compton-based studio.",
      address: "1604 N Long Beach Blvd, Compton, CA 90221",
      latitude: COMPTON_LAT + 0.013,
      longitude: COMPTON_LNG - 0.005,
      district: 2,
      city_id: COMPTON_CITY_ID,
      image_urls: galleryImageUrls,
      badges: ["black_owned", "women_owned", "locally_owned", "compton_original"],
      hours: {
        tue: { open: "10:00", close: "18:00" },
        wed: { open: "10:00", close: "18:00" },
        thu: { open: "10:00", close: "20:00" },
        fri: { open: "10:00", close: "20:00" },
        sat: { open: "11:00", close: "19:00" },
      },
      accepts_orders: true,
      accepts_bookings: true,
      is_published: true,
      is_featured: true,
    })
    .select()
    .single();
  if (error) throw new Error(`businesses.insert: ${error.message}`);
  return biz;
}

async function seedBooks(businessId, bookCovers) {
  const rows = BOOK_NAMES.slice(0, bookCovers.length).map((b, i) => ({
    business_id: businessId,
    name: b.name,
    description: b.blurb,
    price: 2500 + i * 500, // $25, $30, $35, …
    image_url: bookCovers[i],
    category: "Books",
    sort_order: i,
    is_available: true,
  }));
  const { error } = await supabase.from("menu_items").insert(rows);
  if (error) console.warn(`  ! books: ${error.message}`);
  else console.log(`  ✓ ${rows.length} book SKUs`);
}

async function seedServicesAndAddons(businessId) {
  let totalAddons = 0;
  for (const svcSpec of SERVICES) {
    const { data: svc, error } = await supabase
      .from("services")
      .insert({
        business_id: businessId,
        name: svcSpec.name,
        description: svcSpec.description,
        duration: svcSpec.duration,
        price: svcSpec.price,
        sort_order: svcSpec.sortOrder,
        is_available: true,
      })
      .select()
      .single();
    if (error) {
      console.warn(`  ! service ${svcSpec.name}: ${error.message}`);
      continue;
    }
    if (svcSpec.addons && svcSpec.addons.length > 0) {
      const addonRows = svcSpec.addons.map((a, i) => ({
        service_id: svc.id,
        name: a.name,
        description: a.description,
        price: a.price,
        sort_order: i,
        is_available: true,
      }));
      const { error: addonErr } = await supabase
        .from("service_addons")
        .insert(addonRows);
      if (addonErr) console.warn(`    ! addons: ${addonErr.message}`);
      else totalAddons += addonRows.length;
    }
  }
  console.log(`  ✓ ${SERVICES.length} services + ${totalAddons} add-ons`);
}

async function seedPostsAndReels(profileId, imageUrls, videoUrls) {
  let ts = 0;
  const captions = [
    "",
    "New page, new spread. Cocoa-and-curls energy 🎨",
    "Studio Saturday — three covers in the queue this week.",
    "Behind the easel for the next book.",
    "Color test for the Auntie spread 🟠🟡",
    "When the gold leaf lands right ✨",
    "Print proof in. The blue is THE blue.",
    "",
    "Class of 2026 — kids' workshop @ The Compton Library",
    "Final pages going to the printer Friday.",
    "Smocks ready. Paint ready. Whose birthday is it? 🎈",
    "Newborn portrait commission, hand-lettered name + dedication.",
  ];
  for (let i = 0; i < Math.min(12, imageUrls.length); i += 1) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: captions[i] ?? "",
      image_url: imageUrls[i],
      media_type: "image",
      is_published: true,
      created_at: staggeredTimestamp(28, ts++),
    });
  }
  // Two video posts
  const vidCaptions = [
    "Time-lapse of the Compton Crawl cover ✨",
    "Saturday paint-and-sip — that crowd was UNDEFEATED",
  ];
  for (let i = 0; i < Math.min(2, videoUrls.length); i += 1) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: vidCaptions[i] ?? "",
      video_url: videoUrls[i].url,
      media_type: "video",
      video_status: "ready",
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }
  // 4 text posts
  for (const body of [
    "Booking Mother's Day paint nights NOW. Slots filling. Tap the book button to reserve.",
    "Got asked if I'd illustrate someone's first novel — yes, please. Tap services or DM.",
    "If your kid's birthday is in June, we have ONE Saturday slot left. Don't sleep.",
    "New book preview Friday on the Hub City app. Stay close.",
  ]) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body,
      media_type: null,
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }

  // Reels — every video, with a poster fallback from image posts.
  for (let i = 0; i < videoUrls.length; i += 1) {
    const { url, path } = videoUrls[i];
    const poster = imageUrls[i % imageUrls.length] ?? null;
    await supabase.from("reels").insert({
      author_id: profileId,
      video_url: url,
      video_path: path,
      poster_url: poster,
      caption: vidCaptions[i] ?? "Studio cut",
      hashtags: ["illustration", "compton", "paintandsip"],
      is_story: false,
      is_published: true,
      created_at: staggeredTimestamp(14, ts++),
    });
  }

  // profile_gallery_images for /creators portfolio strip.
  const galleryRows = imageUrls.slice(0, 8).map((url, i) => ({
    owner_id: profileId,
    image_url: url,
    caption: captions[i] || `Studio shot ${i + 1}`,
    display_order: i,
  }));
  await supabase.from("profile_gallery_images").insert(galleryRows);

  console.log(
    `  ✓ ${Math.min(12, imageUrls.length)} image posts + 2 video posts + 4 text + ${videoUrls.length} reels + ${galleryRows.length} gallery`,
  );
}

async function seedEvents(profileId, eventFlyers) {
  for (const ev of EVENTS) {
    const start = new Date();
    start.setDate(start.getDate() + ev.daysFromNow);
    const slug = `ayanna-${ev.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60)}-${Date.now().toString(36)}`;
    const flyer = eventFlyers[ev.flyerIdx] ?? eventFlyers[0] ?? null;
    const { error } = await supabase.from("events").insert({
      title: ev.title,
      slug,
      description: ev.description,
      category: "culture",
      start_date: start.toISOString().slice(0, 10),
      start_time: ev.startTime,
      location_name: "Ayanna Clark Studio",
      address: "1604 N Long Beach Blvd, Compton, CA 90221",
      image_url: flyer,
      is_published: true,
      is_featured: ev.isFeatured,
      created_by: profileId,
      city_id: COMPTON_CITY_ID,
      visibility: "public",
    });
    if (error) console.warn(`  ! event ${ev.title}: ${error.message}`);
  }
  console.log(`  ✓ ${EVENTS.length} events`);
}

async function main() {
  await ensureBucket("post-images");
  await ensureBucket("reels");

  const profileId = handleToUuid(HANDLE);
  await ensureProfile(profileId);
  console.log(`\n[ayanna-clark] profile ${profileId}`);

  await wipePrior(profileId);
  console.log("  ✓ wiped prior content");

  const { imageUrls, videoUrls, bookCovers, eventFlyers } = await uploadAssets();
  console.log(
    `  ✓ uploaded ${imageUrls.length} images, ${videoUrls.length} videos, ${bookCovers.length} book covers, ${eventFlyers.length} flyers`,
  );

  if (imageUrls.length === 0) {
    throw new Error("no images uploaded — bailing");
  }

  // Avatar + cover from first two images.
  await supabase
    .from("profiles")
    .update({ avatar_url: imageUrls[0], cover_url: imageUrls[1] ?? null })
    .eq("id", profileId);

  const biz = await seedBusiness(profileId, imageUrls);
  console.log(`  ✓ business ${biz.slug}`);

  await seedBooks(biz.id, bookCovers);
  await seedServicesAndAddons(biz.id);
  await seedPostsAndReels(profileId, imageUrls, videoUrls);
  await seedEvents(profileId, eventFlyers);

  console.log(
    `\n→ verify on /user/${HANDLE}, /business/${BUSINESS_SLUG}, /events`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
