#!/usr/bin/env node
/**
 * Seed JessHilarious — comedian + media-channel + podcast.
 *
 * What this seeds:
 *   1. Auth user + content_creator profile (verified, is_creator)
 *   2. Avatar + cover image; profile_tags = comedian / standup / la
 *   3. Channel "Jess Hilarious" (type=media, scope=national) so her
 *      videos surface across cities.
 *   4. ~5 channel videos that REUSE existing Mux playback ids in the
 *      DB (we don't run an actual Mux ingest in seed). Event flyers
 *      double as thumbnails so the cards render even before Mux
 *      smartcrop kicks in.
 *   5. 4 ticketed comedy events using the 4 event flyers as cover
 *      images. Each event hangs off a single shared venue
 *      ("Compton Comedy Lounge") with three ticket tiers — General,
 *      VIP, Front Row — wired through event_ticket_config so the
 *      /events/[id]/tickets page renders prices + remaining stock.
 *   6. Image posts (12), video posts (3 of the .mov files), text
 *      posts (4), and the rest of the videos as reels/moments.
 *      Every post gets media_type set so PostCard renders properly
 *      (we learned the hard way during the Quiana/Max seed).
 *   7. profile_gallery_images for the /creators portfolio strip.
 *   8. Podcast "Jess Hilarious — Off the Mic" with 5 episodes,
 *      reusing existing track mux_playback_ids so the podcast page
 *      can hit "Play" without any new Mux uploads.
 *
 * Idempotent: re-runs wipe Jess's prior posts/reels/podcasts/events
 * and re-create them.
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
const COMPTON_LAT = 33.8959;
const COMPTON_LNG = -118.22;
const PASSWORD = "HubCity2026!";
const HANDLE = "jess-hilarious";
const EMAIL = "jess.hilarious@hubcityapp.com";
const DISPLAY_NAME = "Jess Hilarious";

const ASSETS_ROOT =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Big Accounts/JessHilarious";

const MAX_UPLOAD_BYTES = 45 * 1024 * 1024;

// Existing Mux playback ids in the DB — reuse these instead of running
// a real ingest pipeline for seed content. Audio ids drive the podcast,
// video ids drive the channel.
const VIDEO_MUX_IDS = [
  { playback: "EaCHsgmWo7xkN00Pun5uVna7Bb02FzUDtZTY01q00NqRXAg", asset: "XtRa4xIcdOWVIsvKGBnJmOdaT00XZLy2Srh6E6BqDtw8", duration: 169 },
  { playback: "fvOt6Yr4VjM4cMi4wQ7qlSedZfWTr1z00yG4uH5QURmU", asset: "VyDieRQBEj7BOSN7lb7RpoCzNvaRniziY9qWZBoGHp8", duration: 533 },
  { playback: "Pnkvm1o9R3IxVYKnueGeIMcSZNkoMV1Ot2oETkeBj8E", asset: "yAsAYYgYJyTpjGLCWLPDnu3NJZ4P8XQm01DTYxbwbXzk", duration: 191 },
  { playback: "rSMMGbdyVKzX3As01C7014EmA9f4r8f7o0201ujDUuwV101w", asset: "JrLzAETr02G2Bx6lId1UWc022YDRXVPZxYeDPtvbLZfLc", duration: 776 },
  { playback: "s7aVWw1Vt02sNGAdHcmt7Qoe3umHLSwUWKCWezt4428s", asset: "SPenMGu6oC4Cvo4LiYJfc2anPI2LHfJt7x15SiJlBqo", duration: 1125 },
];

const AUDIO_MUX_IDS = [
  "FsAe02FASMMw6J9027a00DPK02yDLbdh2fnrthJ8TnuMCpc",
  "GhKpV5Pc7x3PPRNBbfZ7tfjRVpkDivx3ga5SdK4ZkS00",
  "UrwbK00012al02HCAGiYMhHOn6rvJ00hl9mZLhLHo02go2Ko",
  "gYB4G2cW8pndjg8RrHEOlijUuHAaDy02w8jHgYTnf3xE",
];

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
    console.warn(
      `    ⊘ skip ${basename(filePath)} (${(size / 1024 / 1024).toFixed(1)}MB > cap)`,
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
      return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    }
    if (attempt === 3) {
      console.warn(`    ! upload ${storagePath}: ${error.message}`);
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

// ── Profile ───────────────────────────────────────────────────────────

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
      bio: "Comedian. Talk-show host. The reason your auntie has a podcast app. Touring + filming around LA.",
      role: "content_creator",
      city_id: COMPTON_CITY_ID,
      city: "Compton",
      state: "CA",
      district: 2,
      is_creator: true,
      creator_approved_at: new Date().toISOString(),
      verification_status: "verified",
      profile_tags: ["comedian", "standup", "podcast", "la"],
    },
    { onConflict: "id" },
  );
  if (pErr) throw new Error(`profiles.upsert: ${pErr.message}`);
}

// ── Wipe prior content (idempotent rerun) ─────────────────────────────

async function wipePrior(profileId) {
  await supabase.from("posts").delete().eq("author_id", profileId);
  await supabase.from("reels").delete().eq("author_id", profileId);
  await supabase
    .from("profile_gallery_images")
    .delete()
    .eq("owner_id", profileId);
  await supabase.from("podcasts").delete().eq("creator_id", profileId);

  // Channel + channel_videos cascade
  const { data: oldChan } = await supabase
    .from("channels")
    .select("id")
    .eq("owner_id", profileId);
  if (oldChan?.length) {
    const ids = oldChan.map((c) => c.id);
    await supabase.from("channel_videos").delete().in("channel_id", ids);
    await supabase.from("channels").delete().in("id", ids);
  }

  // Events + ticket configs (config cascade-deletes with event)
  await supabase
    .from("events")
    .delete()
    .eq("created_by", profileId)
    .like("slug", "jess-%");

  // Venue (re-created fresh on rerun so capacity counts stay clean)
  await supabase.from("venues").delete().eq("slug", "compton-comedy-lounge");
}

// ── Asset upload ──────────────────────────────────────────────────────

async function uploadAllAssets() {
  const root = readdirSync(ASSETS_ROOT)
    .filter((e) => !e.startsWith(".") && !statSync(join(ASSETS_ROOT, e)).isDirectory())
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

  // Event flyers (used as event covers + channel-video thumbnails)
  const eventDir = join(ASSETS_ROOT, "events:video posters");
  const eventFiles = readdirSync(eventDir)
    .filter((e) => !e.startsWith(".") && isImage(e))
    .sort();
  const eventFlyerUrls = [];
  for (let i = 0; i < eventFiles.length; i += 1) {
    const safe = eventFiles[i].replace(/\s+/g, "_");
    const url = await uploadFile(
      "post-images",
      `${HANDLE}/events/${i.toString().padStart(2, "0")}-${safe}`,
      join(eventDir, eventFiles[i]),
    );
    if (url) eventFlyerUrls.push(url);
  }

  // Podcast cover
  const podcastDir = join(ASSETS_ROOT, "podcast cover");
  const podcastFiles = readdirSync(podcastDir).filter(
    (e) => !e.startsWith(".") && isImage(e),
  );
  let podcastCoverUrl = null;
  if (podcastFiles[0]) {
    const safe = podcastFiles[0].replace(/\s+/g, "_");
    podcastCoverUrl = await uploadFile(
      "post-images",
      `${HANDLE}/podcast/${safe}`,
      join(podcastDir, podcastFiles[0]),
    );
  }

  return { imageUrls, videoUrls, eventFlyerUrls, podcastCoverUrl };
}

// ── Channel + channel_videos ──────────────────────────────────────────

async function seedChannel(profileId, eventFlyerUrls, imageUrls) {
  const { data: ch, error } = await supabase
    .from("channels")
    .insert({
      owner_id: profileId,
      name: DISPLAY_NAME,
      slug: HANDLE,
      description:
        "Comedy specials, talk-show clips, and behind-the-mic content from Jess Hilarious.",
      type: "media",
      scope: "national",
      avatar_url: imageUrls[0] ?? null,
      banner_url: imageUrls[1] ?? null,
      city_id: COMPTON_CITY_ID,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw new Error(`channels.insert: ${error.message}`);

  // 5 channel videos, each reusing one of the existing Mux ids.
  const videoTitles = [
    { title: "Jess Hilarious — Live at the Comedy Lounge", description: "30 minutes of new material from Jess's spring run." },
    { title: "Off the Mic — Pilot", description: "First episode of the talk-show side project. Guests + bits." },
    { title: "Westside Crowd Work", description: "Crowd work compilation from the Compton run." },
    { title: "Jess Reacts: Auntie Edition", description: "Jess reacts to comments from the comments section." },
    { title: "Late Set, Long Story", description: "A late-set bit that became the story Jess tells everywhere." },
  ];

  const channelVideos = videoTitles.map((v, idx) => ({
    channel_id: ch.id,
    title: v.title,
    description: v.description,
    video_type: idx === 0 ? "featured" : "on_demand",
    mux_playback_id: VIDEO_MUX_IDS[idx % VIDEO_MUX_IDS.length].playback,
    mux_asset_id: VIDEO_MUX_IDS[idx % VIDEO_MUX_IDS.length].asset,
    duration: VIDEO_MUX_IDS[idx % VIDEO_MUX_IDS.length].duration,
    status: "ready",
    is_published: true,
    is_featured: idx === 0,
    thumbnail_url:
      eventFlyerUrls[idx % Math.max(eventFlyerUrls.length, 1)] ??
      imageUrls[idx % imageUrls.length],
    published_at: staggeredTimestamp(30, idx).toString(),
  }));
  const { error: cvErr } = await supabase
    .from("channel_videos")
    .insert(channelVideos);
  if (cvErr) console.warn(`  ! channel_videos: ${cvErr.message}`);
  else console.log(`  ✓ channel + ${channelVideos.length} videos`);

  return ch;
}

// ── Venue + ticketed events ───────────────────────────────────────────

async function seedTicketedEvents(profileId, eventFlyerUrls) {
  // Single shared venue — keeps the ticketing flow simple and lets all
  // four shows share the same "Compton Comedy Lounge" presentation.
  const { data: venue, error: vErr } = await supabase
    .from("venues")
    .insert({
      name: "Compton Comedy Lounge",
      slug: "compton-comedy-lounge",
      address: "1308 N Long Beach Blvd, Compton, CA 90221",
      latitude: COMPTON_LAT + 0.012,
      longitude: COMPTON_LNG - 0.004,
      image_url: eventFlyerUrls[0] ?? null,
      total_capacity: 280,
      is_active: true,
      created_by: profileId,
    })
    .select()
    .single();
  if (vErr) throw new Error(`venues.insert: ${vErr.message}`);

  const tierDefs = [
    { name: "GENERAL", description: "Open seating, full set.", capacity: 200, price: 4500, sortOrder: 0, color: "#1F2A2D" },
    { name: "VIP", description: "Reserved table seating + welcome cocktail.", capacity: 60, price: 8500, sortOrder: 1, color: "#C49A2C" },
    { name: "FRONT ROW", description: "Front row + meet-and-greet after the show.", capacity: 20, price: 15000, sortOrder: 2, color: "#E84855" },
  ];
  const sectionRows = tierDefs.map((t) => ({
    venue_id: venue.id,
    name: t.name,
    description: t.description,
    capacity: t.capacity,
    default_price: t.price,
    sort_order: t.sortOrder,
    color: t.color,
  }));
  const { data: sections, error: secErr } = await supabase
    .from("venue_sections")
    .insert(sectionRows)
    .select();
  if (secErr) throw new Error(`venue_sections.insert: ${secErr.message}`);
  console.log(`  ✓ venue + ${sections.length} ticket tiers`);

  // 4 events — second Saturday of upcoming months, plus a couple of
  // close-in dates so the upcoming rail looks alive.
  const eventDefs = [
    {
      title: "Jess Hilarious LIVE — Compton",
      description:
        "An hour of brand-new material from Jess. Limited seats — get the front row before they're gone.",
      daysFromNow: 12,
      startTime: "20:00:00",
      flyerIdx: 0,
    },
    {
      title: "Jess Hilarious — Mother's Day Special",
      description:
        "A Mother's Day comedy night with Jess + two surprise openers. Bring your auntie. Bring your auntie's auntie.",
      daysFromNow: 26,
      startTime: "19:30:00",
      flyerIdx: 1,
    },
    {
      title: "Jess Hilarious — Off the Mic LIVE Taping",
      description:
        "The talk-show, on stage. Live taping for the next season — guests TBA. Audience members on camera.",
      daysFromNow: 48,
      startTime: "19:00:00",
      flyerIdx: 2,
    },
    {
      title: "Jess Hilarious — Late Set",
      description:
        "Late set, full bar, Jess + a rotating cast of hosts. 21+. No phones in the room.",
      daysFromNow: 62,
      startTime: "22:30:00",
      flyerIdx: 3,
    },
  ];

  for (const ev of eventDefs) {
    const start = new Date();
    start.setDate(start.getDate() + ev.daysFromNow);
    const startDate = start.toISOString().slice(0, 10);
    const slug = `jess-${slugify(ev.title)}-${Date.now().toString(36)}`;
    const flyer = eventFlyerUrls[ev.flyerIdx] ?? eventFlyerUrls[0] ?? null;

    const { data: event, error: evErr } = await supabase
      .from("events")
      .insert({
        title: ev.title,
        slug,
        description: ev.description,
        category: "culture",
        start_date: startDate,
        start_time: ev.startTime,
        location_name: venue.name,
        address: venue.address,
        latitude: venue.latitude,
        longitude: venue.longitude,
        district: 2,
        image_url: flyer,
        is_published: true,
        is_featured: ev.daysFromNow <= 30,
        is_ticketed: true,
        created_by: profileId,
        city_id: COMPTON_CITY_ID,
        visibility: "public",
        venue_id: venue.id,
      })
      .select()
      .single();
    if (evErr) {
      console.warn(`  ! event ${ev.title}: ${evErr.message}`);
      continue;
    }

    // Ticket config rows — one per tier. Available count seeded equal
    // to capacity so the page shows full availability on day one.
    const ticketConfigs = sections.map((s) => ({
      event_id: event.id,
      venue_section_id: s.id,
      price: s.default_price,
      capacity: s.capacity,
      available_count: s.capacity,
      max_per_order: 8,
      is_active: true,
    }));
    const { error: tcErr } = await supabase
      .from("event_ticket_config")
      .insert(ticketConfigs);
    if (tcErr) console.warn(`    ! event_ticket_config: ${tcErr.message}`);
  }
  console.log(`  ✓ ${eventDefs.length} ticketed events`);
}

// ── Posts + reels + profile gallery ───────────────────────────────────

async function seedPostsAndReels(profileId, imageUrls, videoUrls) {
  let ts = 0;

  // 12 image posts
  const captions = [
    "",
    "Auntie energy on the mic tonight 😂",
    "Compton crowd was UNDEFEATED",
    "Behind the curtain pre-show",
    "When the security guard knew the punchline",
    "Front row reactions are everything",
    "",
    "Mid-set heckler. We handled it.",
    "Backstage with the openers",
    "The wig was ready",
    "Sold-out crowd. Sold-out energy.",
    "Set list moments before chaos",
  ];
  for (let i = 0; i < Math.min(12, imageUrls.length); i += 1) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: captions[i] ?? "",
      image_url: imageUrls[i],
      media_type: "image",
      is_published: true,
      created_at: staggeredTimestamp(25, ts++),
    });
  }

  // 3 video posts (subset of the .mov files)
  const vidCaptions = [
    "Crowd work clip from last night 🎤",
    "When the joke lands AND the photo lands",
    "Off the Mic — sneak peek",
  ];
  for (let i = 0; i < Math.min(3, videoUrls.length); i += 1) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body: vidCaptions[i] ?? "",
      video_url: videoUrls[i].url,
      media_type: "video",
      video_status: "ready",
      is_published: true,
      created_at: staggeredTimestamp(22, ts++),
    });
  }

  // 4 text posts
  const textPosts = [
    "If you came to a Jess Hilarious show and DIDN'T cry laughing — you came on the wrong night. Tickets in bio. 🎟️",
    "Reminder: Mother's Day special is selling fast. Get your auntie a ticket and tell her it was your idea.",
    "Pulled up to Compton last night and the crowd was SHARP. Y'all keeping me on my toes.",
    "New Off the Mic episode dropping Friday on Hub City. Guest is wild. You'll see.",
  ];
  for (const body of textPosts) {
    await supabase.from("posts").insert({
      author_id: profileId,
      body,
      media_type: null,
      is_published: true,
      created_at: staggeredTimestamp(20, ts++),
    });
  }

  // Reels — every video becomes a moment, with a still from one of the
  // image posts as the poster (no Mux pipeline in this seed).
  for (let i = 0; i < videoUrls.length; i += 1) {
    const { url, path } = videoUrls[i];
    const poster = imageUrls[i % imageUrls.length] ?? null;
    await supabase.from("reels").insert({
      author_id: profileId,
      video_url: url,
      video_path: path,
      poster_url: poster,
      caption: vidCaptions[i] ?? "Studio moment",
      hashtags: ["comedy", "compton", "standup"],
      is_story: false,
      is_published: true,
      created_at: staggeredTimestamp(14, ts++),
    });
  }

  // profile_gallery_images for the /creators portfolio strip
  const galleryRows = imageUrls.slice(0, 8).map((url, i) => ({
    owner_id: profileId,
    image_url: url,
    caption: captions[i] || `Show photo ${i + 1}`,
    display_order: i,
  }));
  if (galleryRows.length) {
    await supabase.from("profile_gallery_images").insert(galleryRows);
  }
  console.log(
    `  ✓ ${Math.min(12, imageUrls.length)} image posts + 3 video posts + 4 text posts + ${videoUrls.length} reels`,
  );
}

// ── Podcast on Frequency ──────────────────────────────────────────────

async function seedPodcast(profileId, coverUrl) {
  const showSlug = "jess-hilarious-off-the-mic";
  const showTitle = "Jess Hilarious — Off the Mic";
  const showDesc =
    "The talk-show side of Jess's brain. Comedy, gossip, guests, and the occasional Auntie call-in. New episodes every Friday.";

  const episodes = [
    {
      title: "Pilot — Why I Started a Talk Show in My Living Room",
      description:
        "Jess kicks off Off the Mic with a story about how this whole thing started — and a guest you weren't expecting.",
      duration: 1840,
      epnum: 1,
      ago: 28,
    },
    {
      title: "On Tour, On Edge",
      description:
        "Jess breaks down the Westside run — the wins, the green rooms, the venue where the AC didn't work.",
      duration: 2210,
      epnum: 2,
      ago: 21,
    },
    {
      title: "Auntie Hour",
      description:
        "Jess takes calls from real aunties. Three callers, three life lessons, one cliffhanger.",
      duration: 2050,
      epnum: 3,
      ago: 14,
    },
    {
      title: "The Crowd Work Episode",
      description:
        "Jess breaks down what makes crowd work go viral — and what makes it die. With clips.",
      duration: 1690,
      epnum: 4,
      ago: 7,
    },
    {
      title: "Mother's Day Preview",
      description:
        "Final prep for the Mother's Day special, with two surprise openers calling in.",
      duration: 1950,
      epnum: 5,
      ago: 1,
    },
  ];

  const rows = episodes.map((ep, i) => {
    const muxId = AUDIO_MUX_IDS[i % AUDIO_MUX_IDS.length];
    return {
      channel_id: null, // Frequency podcast — not tied to a channel for play
      title: ep.title,
      description: ep.description,
      audio_url: `https://stream.mux.com/${muxId}/audio.m3u8`,
      duration: ep.duration,
      episode_number: ep.epnum,
      season_number: 1,
      thumbnail_url: coverUrl,
      is_published: true,
      published_at: new Date(Date.now() - ep.ago * 86400000).toISOString(),
      mux_playback_id: muxId,
      mux_status: "ready",
      genre_slug: "culture-stories",
      explicit: false,
      creator_id: profileId,
      show_slug: showSlug,
      show_title: showTitle,
      show_description: showDesc,
      is_demo: false,
    };
  });

  const { error } = await supabase.from("podcasts").insert(rows);
  if (error) throw new Error(`podcasts.insert: ${error.message}`);
  console.log(`  ✓ podcast "${showTitle}" with ${rows.length} episodes`);
}

// ── Main ──────────────────────────────────────────────────────────────

async function main() {
  await ensureBucket("post-images");
  await ensureBucket("reels");

  const profileId = handleToUuid(HANDLE);
  await ensureProfile(profileId);
  console.log(`\n[jess-hilarious] profile ${profileId}`);

  await wipePrior(profileId);
  console.log("  ✓ wiped prior content");

  const { imageUrls, videoUrls, eventFlyerUrls, podcastCoverUrl } =
    await uploadAllAssets();
  console.log(
    `  ✓ uploaded ${imageUrls.length} images, ${videoUrls.length} videos, ${eventFlyerUrls.length} flyers, ${podcastCoverUrl ? 1 : 0} podcast cover`,
  );

  if (imageUrls.length === 0) {
    throw new Error("no images uploaded; bailing");
  }

  // Avatar + cover from the first two images
  await supabase
    .from("profiles")
    .update({ avatar_url: imageUrls[0], cover_url: imageUrls[1] ?? null })
    .eq("id", profileId);

  await seedChannel(profileId, eventFlyerUrls, imageUrls);
  await seedTicketedEvents(profileId, eventFlyerUrls);
  await seedPostsAndReels(profileId, imageUrls, videoUrls);
  if (podcastCoverUrl) await seedPodcast(profileId, podcastCoverUrl);
  else console.warn("  ! no podcast cover uploaded — skipping podcast seed");

  console.log("\n→ verify on /creators, /user/jess-hilarious, /events, /frequency, /live/channel/jess-hilarious");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
