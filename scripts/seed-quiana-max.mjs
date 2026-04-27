#!/usr/bin/env node
/**
 * Seed two new Compton artist accounts — Quiana Lewis + Max Sansing.
 *
 * For each artist this script creates:
 *   1. Auth user (HubCity2026!) + content_creator profile (verified, is_creator)
 *   2. Avatar from first image, 6 image posts, every video as a reel
 *      (one video also lands as a video post for the profile feed)
 *   3. TWO businesses per artist so the storefront flow works end-to-end:
 *        a) Retail "Art Prints" shop — image_urls + menu_items for each
 *           print (~6 SKUs). business_type=retail, accepts_orders=true.
 *        b) Service "Mural Studio" — bookable mural commission service.
 *           business_type=service, accepts_bookings=true. The artist's
 *           profile owns both businesses.
 *   4. Two museum_exhibits + ~6 gallery_items per artist so /culture
 *      lights up. One library_item (artist statement). One notable_people
 *      entry so /culture/people surfaces them.
 *   5. One upcoming event per artist (gallery opening) so /events shows
 *      them in Compton's culture rail.
 *
 * Re-running upserts on stable ids (deterministic UUIDs derived from
 * the handle) so it's safe to retry. Existing posts/reels/menu_items
 * for these creators are wiped before re-seeding to keep counts clean.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, resolve, join, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// ── Env loading ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  /* rely on env */
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const COMPTON_CITY_ID = "398a39cc-367b-4604-b6b2-1042fde1a041";
// Compton Art & History Museum — culture content attaches here.
const COMPTON_MUSEUM_ORG_ID = "e536741f-3de9-4849-9f18-f729cab3b68d";
const COMPTON_LAT = 33.8959;
const COMPTON_LNG = -118.22;
const PASSWORD = "HubCity2026!";

const ASSETS_ROOT =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Creator";

// Supabase Storage default per-object cap is 50MB. We stay under that
// so the upload doesn't error; oversized files (e.g. Max's 56MB .mov)
// get skipped with a warning instead of failing the whole artist.
const MAX_UPLOAD_BYTES = 45 * 1024 * 1024;

// ── Helpers ───────────────────────────────────────────────────────────

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

function isImage(p) {
  return IMAGE_EXT.has(extname(p).toLowerCase());
}
function isVideo(p) {
  return VIDEO_EXT.has(extname(p).toLowerCase());
}
function contentTypeFor(p) {
  return (
    {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".webp": "image/webp",
      ".mov": "video/quicktime",
      ".mp4": "video/mp4",
      ".webm": "video/webm",
      ".m4v": "video/mp4",
    }[extname(p).toLowerCase()] || "application/octet-stream"
  );
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function staggeredTimestamp(maxDaysAgo, seedOffset = 0) {
  const ms =
    Math.floor(Math.random() * maxDaysAgo * 86400000) + seedOffset * 60000;
  return new Date(Date.now() - ms).toISOString();
}

async function uploadFile(bucket, storagePath, filePath) {
  const size = statSync(filePath).size;
  if (size > MAX_UPLOAD_BYTES) {
    const mb = (size / 1024 / 1024).toFixed(1);
    console.warn(
      `    ⊘ skip ${basename(filePath)} (${mb}MB > ${MAX_UPLOAD_BYTES / 1024 / 1024}MB cap)`,
    );
    return null;
  }
  const buf = readFileSync(filePath);
  // Retry up to 3 times on transient errors (gateway timeouts seen in
  // the first attempt for ~2% of uploads).
  let lastErr = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
      contentType: contentTypeFor(filePath),
      cacheControl: "3600",
      upsert: true,
    });
    if (!error) {
      return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    }
    lastErr = error;
    // Wait a beat before retry.
    await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  console.warn(`    ! upload ${bucket}/${storagePath}: ${lastErr?.message ?? "unknown"} (after 3 attempts)`);
  return null;
}

// ── Artist config ─────────────────────────────────────────────────────

const ARTISTS = [
  {
    handle: "quiana-lewis",
    email: "quiana.lewis@hubcityapp.com",
    displayName: "Quiana Lewis",
    bio: "Compton-born artist. Murals, oil portraits, and gallery shows that put the West Side on the wall.",
    folder: "Quiana lewis artist account",
    profileTags: ["muralist", "painter", "compton", "portraiture"],
    discipline: "Muralist & Painter",
    studio: {
      name: "Quiana Lewis Studio",
      slugBase: "quiana-lewis-studio",
      address: "1108 N Wilmington Ave, Compton, CA 90220",
      district: 2,
      latOffset: 0.005,
      lngOffset: -0.003,
      description:
        "Limited-edition prints, original works, and mural commissions from Compton-rooted artist Quiana Lewis. Pickup at the studio or commission a custom wall — Compton, LA, Long Beach.",
    },
    services: [
      { name: "Mural Consultation", duration: 60, price: 0, description: "Site visit + scope of work. Free consult before any commission." },
      { name: "Indoor Mural — up to 8 ft", duration: 240, price: 250000, description: "Single-wall indoor mural up to 8 ft on the long edge. Includes prep + sealing." },
      { name: "Exterior Mural — up to 20 ft", duration: 480, price: 850000, description: "Multi-day exterior commission, weather permitting. Anti-graffiti finish included." },
      { name: "Custom Portrait — Oil on Canvas (24x30)", duration: 120, price: 200000, description: "Commissioned portrait painted from reference. 6-week turnaround." },
      { name: "Studio Visit + Coffee", duration: 45, price: 2500, description: "Tour the studio, see works in progress, talk craft. Refundable as store credit." },
    ],
    artworks: [
      { title: "Westside Madonna", year: "2025", medium: "Oil on canvas", dimensions: "48 × 60 in" },
      { title: "Crenshaw Light", year: "2025", medium: "Acrylic on panel", dimensions: "36 × 48 in" },
      { title: "Compton Boulevard, 7AM", year: "2024", medium: "Oil on canvas", dimensions: "30 × 40 in" },
      { title: "Granny's Hands", year: "2024", medium: "Oil on linen", dimensions: "24 × 36 in" },
      { title: "Block Party (Triptych)", year: "2024", medium: "Acrylic + spray", dimensions: "60 × 144 in" },
      { title: "MLK & Long Beach", year: "2023", medium: "Oil on canvas", dimensions: "40 × 50 in" },
      { title: "Auntie's Garden", year: "2023", medium: "Oil on panel", dimensions: "24 × 30 in" },
      { title: "Sunday Service", year: "2023", medium: "Acrylic on canvas", dimensions: "36 × 48 in" },
    ],
    prints: [
      { name: "Westside Madonna — 18×24 Print", price: 8500, blurb: "Giclée print on archival paper. Signed + numbered, edition of 50." },
      { name: "Crenshaw Light — 18×24 Print", price: 8500, blurb: "Open edition giclée. Ships rolled in a tube." },
      { name: "Compton Blvd, 7AM — 11×14 Print", price: 4500, blurb: "Smaller format giclée — perfect over a desk." },
      { name: "Block Party — 24×36 Print", price: 12500, blurb: "Triptych on a single sheet. Signed + numbered." },
      { name: "Auntie's Garden — Postcard Set (5)", price: 1500, blurb: "Pack of 5 postcards. Mix of prints from the 2023 season." },
      { name: "Studio Tee — Quiana Lewis", price: 3500, blurb: "Heavyweight cotton tee. Studio logo on chest, painting print on back." },
    ],
    exhibits: [
      {
        title: "Quiana Lewis: Westside Witness",
        subtitle: "Oil portraits + mural studies",
        description:
          "A two-year survey of Quiana Lewis' portrait work — neighbors, elders, and block icons rendered at scale.",
        curatorNote:
          "Curated for the Compton Museum's Living Artists series. On view through summer.",
        era: "2024–2025",
        tags: ["muralist", "portrait", "compton"],
      },
      {
        title: "Walls of the West Side",
        subtitle: "Mural process + studies",
        description:
          "Sketches, color studies, and finished panels from Quiana's recent commissions across LA County.",
        era: "2023–2025",
        tags: ["mural", "studies", "process"],
      },
    ],
    libraryItem: {
      title: "Artist Statement — Quiana Lewis",
      author: "Quiana Lewis",
      itemType: "article",
      yearPublished: 2025,
      description:
        "On painting Compton from inside Compton — a working artist's notes on craft, neighborhood, and the long arc of the work.",
    },
    notable: {
      title: "Visual Artist · Muralist",
      bio: "Born and raised in Compton, Quiana Lewis paints at the scale of city walls and the intimacy of family kitchens. Her portraits anchor a growing body of West Side mural work.",
      category: "arts",
      era: "2020s",
      achievements: [
        "Compton Civic Mural Commission (2024)",
        "Solo: Westside Witness, Compton Museum (2025)",
        "LA Cultural Affairs grant recipient",
      ],
    },
    upcomingEvent: {
      title: "Quiana Lewis — Westside Witness Opening Reception",
      description:
        "Live mural demo, opening reception, and Q&A with the artist. Free and open to the public — refreshments by Element 78.",
      daysFromNow: 21,
      startTime: "19:00:00",
      locationName: "Compton Civic Center · Gallery Hall",
      address: "205 S Willowbrook Ave, Compton, CA 90220",
    },
  },
  {
    handle: "max-sansing",
    email: "max.sansing@hubcityapp.com",
    displayName: "Max Sansing",
    bio: "Mixed-media artist with deep Compton roots. Murals, portrait paintings, and gallery work that reads the street.",
    folder: "maxsansing accoun creator",
    profileTags: ["muralist", "painter", "mixed-media", "portraiture"],
    discipline: "Mixed-media Artist",
    studio: {
      name: "Max Sansing Studio",
      slugBase: "max-sansing-studio",
      address: "320 W Rosecrans Ave, Compton, CA 90222",
      district: 3,
      latOffset: 0.008,
      lngOffset: 0.002,
      description:
        "Originals, prints, and mural commissions from Max Sansing's Compton studio. Pickup, local delivery, or commission a wall — Sansing has painted in Chicago, LA, and Compton.",
    },
    services: [
      { name: "Mural Consultation", duration: 60, price: 0, description: "Free site visit and scope of work for any commission." },
      { name: "Indoor Mural — up to 10 ft", duration: 240, price: 350000, description: "Single-wall indoor commission up to 10 ft on the long edge." },
      { name: "Exterior Mural — up to 30 ft", duration: 600, price: 1200000, description: "Multi-day exterior mural with anti-graffiti coating." },
      { name: "Custom Mixed-media Portrait (30x40)", duration: 150, price: 320000, description: "Commissioned mixed-media portrait. 8-week turnaround." },
      { name: "Studio Tour + Critique", duration: 60, price: 7500, description: "Tour the studio + 30-min portfolio critique. Refundable as store credit." },
    ],
    artworks: [
      { title: "Pop's Living Room", year: "2025", medium: "Acrylic + spray on canvas", dimensions: "48 × 72 in" },
      { title: "Long Beach Blue", year: "2025", medium: "Oil + collage", dimensions: "36 × 48 in" },
      { title: "King's Kitchen", year: "2024", medium: "Acrylic on canvas", dimensions: "40 × 40 in" },
      { title: "Headlights, Compton", year: "2024", medium: "Mixed media", dimensions: "24 × 36 in" },
      { title: "First Communion", year: "2024", medium: "Oil on linen", dimensions: "30 × 40 in" },
      { title: "Sansing Boys", year: "2023", medium: "Acrylic on panel", dimensions: "36 × 48 in" },
      { title: "Westside Series #4", year: "2023", medium: "Spray + acrylic", dimensions: "48 × 60 in" },
    ],
    prints: [
      { name: "Pop's Living Room — 18×24 Print", price: 9500, blurb: "Archival giclée. Signed + numbered, edition of 75." },
      { name: "Long Beach Blue — 18×24 Print", price: 8500, blurb: "Open edition giclée." },
      { name: "King's Kitchen — 12×12 Print", price: 4500, blurb: "Square giclée. Frames clean over a console." },
      { name: "Headlights, Compton — 11×14 Print", price: 4000, blurb: "Smaller format. Studio packaging." },
      { name: "Sansing Boys — 24×36 Print", price: 14000, blurb: "Large format giclée. Numbered edition of 30." },
      { name: "Studio Hoodie — Max Sansing", price: 8500, blurb: "Heavyweight zip hoodie. Signature mark on back." },
    ],
    exhibits: [
      {
        title: "Max Sansing: Compton Interior",
        subtitle: "Family rooms, kitchens, headlights",
        description:
          "Domestic Compton scenes painted at full scale. Sansing's first solo show on the West Side.",
        curatorNote:
          "Pairs with the Westside Witness exhibit on Floor 2.",
        era: "2024–2025",
        tags: ["muralist", "interior", "compton", "mixed-media"],
      },
      {
        title: "Mural Studies — Max Sansing",
        subtitle: "Sketches, prep walls, and finished panels",
        description:
          "Process docs from Max's mural commissions across LA + Chicago.",
        era: "2022–2025",
        tags: ["mural", "process"],
      },
    ],
    libraryItem: {
      title: "On Painting Where You're From — Max Sansing",
      author: "Max Sansing",
      itemType: "article",
      yearPublished: 2025,
      description:
        "Notes on color, composition, and growing up between Chicago and Compton — an essay accompanying the Compton Interior exhibit.",
    },
    notable: {
      title: "Visual Artist · Muralist",
      bio: "Max Sansing splits time between Chicago and Compton, painting at the scale of buildings while keeping intimate detail in his portraiture.",
      category: "arts",
      era: "2020s",
      achievements: [
        "Compton Civic Mural Project — Lead Artist (2024)",
        "Solo: Compton Interior, Compton Museum (2025)",
        "Featured: LA Times Arts (2024)",
      ],
    },
    upcomingEvent: {
      title: "Max Sansing — Compton Interior Opening",
      description:
        "Walk-through of the new exhibit with the artist, plus a live painting demo and Q&A.",
      daysFromNow: 35,
      startTime: "19:00:00",
      locationName: "Compton Civic Center · Gallery Hall",
      address: "205 S Willowbrook Ave, Compton, CA 90220",
    },
  },
];

// ── Per-artist seed flow ──────────────────────────────────────────────

async function ensureBucket(name) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) {
    await supabase.storage.createBucket(name, { public: true });
  }
}

async function ensureProfile(artist) {
  const id = handleToUuid(artist.handle);

  const { error: authErr } = await supabase.auth.admin.createUser({
    id,
    email: artist.email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: {
      handle: artist.handle,
      display_name: artist.displayName,
    },
  });
  if (
    authErr &&
    !/already.*registered|duplicate|exists|user.+already/i.test(authErr.message)
  ) {
    throw new Error(`auth.createUser ${artist.handle}: ${authErr.message}`);
  }

  const { error: pErr } = await supabase.from("profiles").upsert(
    {
      id,
      display_name: artist.displayName,
      handle: artist.handle,
      bio: artist.bio,
      role: "content_creator",
      city_id: COMPTON_CITY_ID,
      city: "Compton",
      state: "CA",
      district: artist.studio.district,
      is_creator: true,
      creator_approved_at: new Date().toISOString(),
      verification_status: "verified",
      profile_tags: artist.profileTags,
    },
    { onConflict: "id" },
  );
  if (pErr) throw new Error(`profiles.upsert ${artist.handle}: ${pErr.message}`);

  return id;
}

async function wipePriorContent(profileId, slugs) {
  // Posts + reels owned by the artist
  await supabase.from("posts").delete().eq("author_id", profileId);
  await supabase.from("reels").delete().eq("author_id", profileId);
  // Their gallery items / exhibits / library items / notable people
  await supabase.from("gallery_items").delete().eq("artist_id", profileId);
  await supabase.from("museum_exhibits").delete().eq("created_by", profileId);
  await supabase.from("library_items").delete().eq("created_by", profileId);
  await supabase.from("notable_people").delete().eq("created_by", profileId);
  // Profile gallery feeds the /creators portfolio strip
  await supabase.from("profile_gallery_images").delete().eq("owner_id", profileId);
  await supabase
    .from("events")
    .delete()
    .eq("created_by", profileId)
    .eq("category", "culture");
  // Their businesses + menu_items (cascade handles menu_items)
  for (const s of slugs) {
    await supabase.from("businesses").delete().eq("slug", s);
  }
}

async function uploadAllImages(handle, folder) {
  const entries = readdirSync(folder)
    .filter(
      (e) =>
        !e.startsWith(".") && !statSync(join(folder, e)).isDirectory(),
    )
    .sort();
  const images = entries.filter(isImage);
  const videos = entries.filter(isVideo);

  const imageUrls = [];
  for (let i = 0; i < images.length; i += 1) {
    const fname = images[i];
    const safe = fname.replace(/\s+/g, "_");
    const path = `${handle}/${i.toString().padStart(2, "0")}-${safe}`;
    const url = await uploadFile("post-images", path, join(folder, fname));
    if (url) imageUrls.push({ url, fname });
  }

  const videoUrls = [];
  for (let i = 0; i < videos.length; i += 1) {
    const fname = videos[i];
    const safe = fname.replace(/\s+/g, "_");
    const path = `${handle}/${i.toString().padStart(2, "0")}-${safe}`;
    const url = await uploadFile("reels", path, join(folder, fname));
    if (url) videoUrls.push({ url, fname, path });
  }

  return { imageUrls, videoUrls };
}

async function seedArtist(artist) {
  console.log(`\n[${artist.handle}] starting`);

  const profileId = await ensureProfile(artist);
  console.log(`  ✓ profile ${profileId}`);

  // Wipe both the new (combined-studio) slug and the legacy split
  // (-studio + -murals) slugs so reruns clean up cleanly even if the
  // previous run created two separate businesses.
  await wipePriorContent(profileId, [
    artist.studio.slugBase,
    `${artist.handle}-murals`,
  ]);
  console.log("  ✓ wiped prior content");

  const folder = join(ASSETS_ROOT, artist.folder);
  const { imageUrls, videoUrls } = await uploadAllImages(artist.handle, folder);
  console.log(
    `  ✓ uploaded ${imageUrls.length} images + ${videoUrls.length} videos`,
  );

  if (imageUrls.length === 0) {
    console.warn(`  ! no images uploaded — bailing on ${artist.handle}`);
    return;
  }

  // 1. Avatar = first image
  await supabase
    .from("profiles")
    .update({ avatar_url: imageUrls[0].url })
    .eq("id", profileId);

  // 2. Cover = second image (if present)
  if (imageUrls[1]) {
    await supabase
      .from("profiles")
      .update({ cover_url: imageUrls[1].url })
      .eq("id", profileId);
  }

  // 3. Image posts — first 6 images. media_type MUST be set or the
  //    profile post-card / pulse feed renders an empty card.
  let ts = 0;
  for (const { url } of imageUrls.slice(0, 6)) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: "",
      image_url: url,
      media_type: "image",
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }

  // 4. Video posts — first 2 videos as posts on the profile feed.
  //    PostCard requires `media_type='video'` AND `video_status='ready'`
  //    before it'll render the inline player.
  for (const { url } of videoUrls.slice(0, 2)) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: "",
      image_url: null,
      video_url: url,
      media_type: "video",
      video_status: "ready",
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }

  // 5. Reels — every video becomes a reel/moment. We don't have Mux
  //    in this seed flow so the videos won't auto-generate a poster
  //    frame; cycle through the artist's image posts as poster
  //    fallbacks so the /creators work-strip + /moments grid render
  //    actual thumbnails instead of empty squares.
  const posterPool = imageUrls.map((i) => i.url);
  for (let vi = 0; vi < videoUrls.length; vi += 1) {
    const { url, path } = videoUrls[vi];
    const poster = posterPool[vi % Math.max(posterPool.length, 1)] ?? null;
    await supabase.from("reels").insert({
      author_id: profileId,
      video_url: url,
      video_path: path,
      poster_url: poster,
      caption: `${artist.displayName} — studio cut`,
      hashtags: ["compton", "art", "studio"],
      is_story: false,
      is_published: true,
      created_at: staggeredTimestamp(14, ts++),
    });
  }

  // 6. Single combined business — sells prints (accepts_orders) AND
  //    books mural commissions (accepts_bookings). Both flags set so
  //    the public detail page renders SHOP + BOOK side-by-side.
  const studioImageUrls = imageUrls.slice(0, 8).map((i) => i.url);

  const { data: studioBiz, error: studioBizErr } = await supabase
    .from("businesses")
    .insert({
      owner_id: profileId,
      name: artist.studio.name,
      slug: artist.studio.slugBase,
      category: "retail",
      business_type: "retail",
      business_sub_type: "brick_and_mortar",
      description: artist.studio.description,
      address: artist.studio.address,
      latitude: COMPTON_LAT + artist.studio.latOffset,
      longitude: COMPTON_LNG + artist.studio.lngOffset,
      district: artist.studio.district,
      city_id: COMPTON_CITY_ID,
      image_urls: studioImageUrls,
      badges: ["black_owned", "locally_owned", "compton_original"],
      hours: {
        tue: { open: "11:00", close: "18:00" },
        wed: { open: "11:00", close: "18:00" },
        thu: { open: "11:00", close: "19:00" },
        fri: { open: "11:00", close: "19:00" },
        sat: { open: "10:00", close: "18:00" },
      },
      accepts_orders: true,
      accepts_bookings: true,
      is_published: true,
      is_featured: true,
    })
    .select()
    .single();
  if (studioBizErr) {
    console.warn(`  ! studio biz: ${studioBizErr.message}`);
    return;
  }
  console.log(`  ✓ dual-mode studio ${studioBiz.slug}`);

  // 6a. Prints → menu_items (the "Shop" surface)
  const printRows = artist.prints.map((p, idx) => ({
    business_id: studioBiz.id,
    name: p.name,
    description: p.blurb,
    price: p.price,
    image_url: imageUrls[idx % imageUrls.length].url,
    category: "Prints",
    sort_order: idx,
    is_available: true,
  }));
  const { error: printsErr } = await supabase
    .from("menu_items")
    .insert(printRows);
  if (printsErr) console.warn(`    ! menu_items: ${printsErr.message}`);
  else console.log(`    ✓ ${printRows.length} print SKUs`);

  // 6b. Mural commissions → services (the "Book" surface)
  const serviceRows = artist.services.map((s, idx) => ({
    business_id: studioBiz.id,
    name: s.name,
    description: s.description,
    price: s.price,
    duration: s.duration,
    sort_order: idx,
    is_available: true,
  }));
  const { error: svcErr } = await supabase
    .from("services")
    .insert(serviceRows);
  if (svcErr) console.warn(`    ! services: ${svcErr.message}`);
  else console.log(`    ✓ ${serviceRows.length} bookable services`);

  // 7. Museum exhibits
  const exhibitIds = [];
  for (const [idx, ex] of artist.exhibits.entries()) {
    const slug = `${slugify(ex.title)}`;
    const cover = imageUrls[idx * 4]?.url ?? imageUrls[0].url;
    const { data, error } = await supabase
      .from("museum_exhibits")
      .upsert(
        {
          title: ex.title,
          slug,
          subtitle: ex.subtitle,
          description: ex.description,
          curator_note: ex.curatorNote,
          era: ex.era,
          cover_image_url: cover,
          tags: ex.tags,
          is_featured: idx === 0,
          is_published: true,
          display_order: idx,
          created_by: profileId,
          organization_id: COMPTON_MUSEUM_ORG_ID,
        },
        { onConflict: "slug" },
      )
      .select()
      .single();
    if (error) {
      console.warn(`    ! exhibit ${slug}: ${error.message}`);
      continue;
    }
    exhibitIds.push(data.id);
  }
  console.log(`  ✓ ${exhibitIds.length} exhibits`);

  // 8. Gallery items — one per artwork in artist.artworks (link to first exhibit)
  const galleryRows = artist.artworks.map((a, idx) => ({
    title: a.title,
    slug: `${artist.handle}-${slugify(a.title)}`,
    description: `${a.medium}, ${a.dimensions}.`,
    item_type: "artwork",
    image_urls: [imageUrls[(idx + 2) % imageUrls.length].url],
    artist_name: artist.displayName,
    artist_id: profileId,
    year_created: a.year,
    medium: a.medium,
    dimensions: a.dimensions,
    exhibit_id: exhibitIds[idx % Math.max(exhibitIds.length, 1)] ?? null,
    tags: artist.profileTags,
    is_published: true,
    display_order: idx,
    created_by: profileId,
    organization_id: COMPTON_MUSEUM_ORG_ID,
  }));
  const { error: galleryErr } = await supabase
    .from("gallery_items")
    .upsert(galleryRows, { onConflict: "slug" });
  if (galleryErr) console.warn(`  ! gallery_items: ${galleryErr.message}`);
  else console.log(`  ✓ ${galleryRows.length} gallery items`);

  // 8b. profile_gallery_images — feeds the /creators portfolio strip
  //     (separate from museum gallery_items, indexed by owner_id).
  const profGalleryRows = artist.artworks.map((a, idx) => ({
    owner_id: profileId,
    image_url: imageUrls[(idx + 2) % imageUrls.length].url,
    caption: a.title,
    display_order: idx,
  }));
  const { error: pgErr } = await supabase
    .from("profile_gallery_images")
    .insert(profGalleryRows);
  if (pgErr) console.warn(`  ! profile_gallery_images: ${pgErr.message}`);
  else console.log(`    ✓ ${profGalleryRows.length} profile-gallery images`);

  // 9. Library item (artist statement)
  const libSlug = `${artist.handle}-statement`;
  await supabase.from("library_items").upsert(
    {
      title: artist.libraryItem.title,
      slug: libSlug,
      author: artist.libraryItem.author,
      description: artist.libraryItem.description,
      item_type: artist.libraryItem.itemType,
      cover_image_url: imageUrls[1]?.url ?? imageUrls[0].url,
      year_published: artist.libraryItem.yearPublished,
      exhibit_id: exhibitIds[0] ?? null,
      tags: artist.profileTags,
      is_published: true,
      display_order: 0,
      created_by: profileId,
      organization_id: COMPTON_MUSEUM_ORG_ID,
    },
    { onConflict: "slug" },
  );
  console.log("  ✓ library item");

  // 10. Notable people entry
  const notableSlug = artist.handle;
  await supabase.from("notable_people").upsert(
    {
      name: artist.displayName,
      slug: notableSlug,
      title: artist.notable.title,
      bio: artist.notable.bio,
      category: artist.notable.category,
      portrait_url: imageUrls[0].url,
      image_urls: imageUrls.slice(0, 5).map((i) => i.url),
      notable_achievements: artist.notable.achievements,
      external_links: { profile: `/user/${artist.handle}` },
      era: artist.notable.era,
      exhibit_id: exhibitIds[0] ?? null,
      tags: artist.profileTags,
      is_published: true,
      display_order: 0,
      created_by: profileId,
      organization_id: COMPTON_MUSEUM_ORG_ID,
    },
    { onConflict: "slug" },
  );
  console.log("  ✓ notable people entry");

  // 11. Upcoming event (gallery opening)
  const start = new Date();
  start.setDate(start.getDate() + artist.upcomingEvent.daysFromNow);
  const startDate = start.toISOString().slice(0, 10);
  const evSlug = `${artist.handle}-opening-${Date.now().toString(36)}`;
  await supabase.from("events").insert({
    title: artist.upcomingEvent.title,
    slug: evSlug,
    description: artist.upcomingEvent.description,
    category: "culture",
    start_date: startDate,
    start_time: artist.upcomingEvent.startTime,
    location_name: artist.upcomingEvent.locationName,
    address: artist.upcomingEvent.address,
    image_url: imageUrls[3]?.url ?? imageUrls[0].url,
    is_published: true,
    is_featured: true,
    created_by: profileId,
    city_id: COMPTON_CITY_ID,
    visibility: "public",
  });
  console.log("  ✓ opening event");

  console.log(`[${artist.handle}] ✓ done`);
}

async function main() {
  await ensureBucket("post-images");
  await ensureBucket("post-videos");
  await ensureBucket("reels");
  await ensureBucket("profile-avatars");

  for (const artist of ARTISTS) {
    try {
      await seedArtist(artist);
    } catch (err) {
      console.error(`✗ ${artist.handle}: ${err.message}`);
    }
  }
  console.log("\n→ visit /creators, /culture/exhibits, /culture/gallery, /culture/people to verify.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
