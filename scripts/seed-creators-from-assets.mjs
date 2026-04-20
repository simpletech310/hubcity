#!/usr/bin/env node

/**
 * Seed creator profiles + content (image/text/video posts + reels + events)
 * from `/Assets`. Driven by `_assets-manifest.json`.
 *
 * Idempotent: re-running skips creators whose profile already exists and
 * uploads with `upsert: true` so repeat file uploads don't error.
 *
 * Usage:
 *   node scripts/seed-creators-from-assets.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { basename, extname, dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

// ── Env loading ───────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  /* rely on env */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Manifest ──────────────────────────────────────────────────────────
const manifestPath = resolve(__dirname, "_assets-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// ── Helpers ───────────────────────────────────────────────────────────
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".webm", ".m4v"]);

function isImage(p) {
  return IMAGE_EXT.has(extname(p).toLowerCase());
}
function isVideo(p) {
  return VIDEO_EXT.has(extname(p).toLowerCase());
}
function isHighlight(p) {
  return /highlight/i.test(basename(p));
}
function contentTypeFor(p) {
  const ext = extname(p).toLowerCase();
  return {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
    ".mov": "video/quicktime",
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".m4v": "video/mp4",
  }[ext] || "application/octet-stream";
}

// Deterministic UUID from handle so reruns reuse the same profile id
function handleToUuid(handle) {
  const h = createHash("sha256").update(`hubcity-creator:${handle}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    // v4 variant
    "4" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

function staggeredTimestamp(maxDaysAgo, seedOffset = 0) {
  const ms = Math.floor(Math.random() * maxDaysAgo * 86400000) + seedOffset * 60000;
  return new Date(Date.now() - ms).toISOString();
}

const MAX_UPLOAD_BYTES = 45 * 1024 * 1024; // Free-tier API limit is 50MB; 45MB safety margin.

async function uploadFile(bucket, storagePath, filePath) {
  const size = statSync(filePath).size;
  if (size > MAX_UPLOAD_BYTES) {
    const mb = (size / 1024 / 1024).toFixed(1);
    console.warn(`    ⊘ skip ${basename(filePath)} (${mb}MB > 45MB free-tier cap)`);
    return null;
  }
  const buf = readFileSync(filePath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType: contentTypeFor(filePath),
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`Upload ${bucket}/${storagePath}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

async function ensureAvatarsBucket() {
  const { data } = await supabase.storage.getBucket("profile-avatars");
  if (!data) {
    await supabase.storage.createBucket("profile-avatars", { public: true });
  }
}

// ── Profile (auth user + profiles row) ────────────────────────────────
async function ensureCreatorProfile(creator, cityId) {
  const uuid = handleToUuid(creator.handle);
  const email = `${creator.handle}@seed.hubcityapp.local`;

  // Create auth user (idempotent — ignores "already registered").
  const { error: authErr } = await supabase.auth.admin.createUser({
    id: uuid,
    email,
    email_confirm: true,
    user_metadata: { handle: creator.handle, display_name: creator.displayName },
  });
  if (authErr && !/already.*registered|duplicate|exists/i.test(authErr.message)) {
    throw new Error(`auth.createUser ${creator.handle}: ${authErr.message}`);
  }

  // Upsert profiles row (trigger may have auto-created a skeleton).
  const { error: pErr } = await supabase.from("profiles").upsert({
    id: uuid,
    display_name: creator.displayName,
    handle: creator.handle,
    bio: creator.bio,
    role: "content_creator",
    city_id: cityId,
    is_creator: true,
    creator_approved_at: new Date().toISOString(),
    verification_status: "verified",
    onboarding_completed: true,
  }, { onConflict: "id" });
  if (pErr) throw new Error(`profiles.upsert ${creator.handle}: ${pErr.message}`);

  // "isNew" means: has no content yet. Determines whether we seed media.
  const { count } = await supabase
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("author_id", uuid);
  return { id: uuid, isNew: (count ?? 0) === 0 };
}

// ── Main per-creator flow ─────────────────────────────────────────────
async function seedCreator(creator, cityId) {
  const folder = join(manifest.assetsRoot, creator.folder);
  if (!existsSync(folder)) {
    console.warn(`  ! folder not found: ${folder}`);
    return;
  }

  const entries = readdirSync(folder).filter(
    (e) => !e.startsWith(".") && !statSync(join(folder, e)).isDirectory()
  );
  const images = entries.filter(isImage).sort();
  const videos = entries.filter(isVideo).sort();
  const highlights = videos.filter(isHighlight);
  const regularVideos = videos.filter((v) => !isHighlight(v));

  console.log(`[${creator.handle}] ${images.length} img, ${regularVideos.length} vid, ${highlights.length} highlight`);

  const { id: profileId, isNew } = await ensureCreatorProfile(creator, cityId);
  if (!isNew) {
    console.log(`  profile exists, skipping content re-seed`);
    return;
  }

  // 1. Avatar: first image
  if (images.length > 0) {
    const avatarPath = `${creator.handle}/avatar${extname(images[0])}`;
    const url = await uploadFile("profile-avatars", avatarPath, join(folder, images[0]));
    if (url) await supabase.from("profiles").update({ avatar_url: url }).eq("id", profileId);
  }

  // 2. Image posts (use all images including the avatar one for the grid)
  let tsOffset = 0;
  for (const img of images) {
    const storagePath = `${creator.handle}/${Date.now()}-${img}`.replace(/\s+/g, "_");
    const url = await uploadFile("post-images", storagePath, join(folder, img));
    if (!url) continue;
    const { error } = await supabase.from("posts").insert({
      author_id: profileId,
      body: creator.defaultCaption || "",
      image_url: url,
      media_type: "image",
      video_status: null,
      is_published: true,
      created_at: staggeredTimestamp(30, tsOffset++),
    });
    if (error) console.warn(`    ! image post: ${error.message}`);
  }

  // 3. Text-only posts
  for (const txt of creator.textPosts ?? []) {
    const { error } = await supabase.from("posts").insert({
      author_id: profileId,
      body: txt,
      media_type: null,
      video_status: null,
      is_published: true,
      created_at: staggeredTimestamp(30, tsOffset++),
    });
    if (error) console.warn(`    ! text post: ${error.message}`);
  }

  // 4. Non-highlight videos: split 60% to posts, 40% to reels
  const splitIdx = Math.ceil(regularVideos.length * 0.6);
  const vidsAsPosts = regularVideos.slice(0, splitIdx);
  const vidsAsReels = regularVideos.slice(splitIdx);

  for (const vid of vidsAsPosts) {
    const safeName = vid.replace(/\s+/g, "_");
    const storagePath = `${creator.handle}/${Date.now()}-${safeName}`;
    const url = await uploadFile("post-videos", storagePath, join(folder, vid));
    if (!url) continue;
    const { error } = await supabase.from("posts").insert({
      author_id: profileId,
      body: creator.defaultCaption || "",
      media_type: "video",
      video_url: url,
      video_path: `post-videos/${storagePath}`,
      video_status: "ready",
      is_published: true,
      created_at: staggeredTimestamp(30, tsOffset++),
    });
    if (error) console.warn(`    ! video post: ${error.message}`);
  }

  for (const vid of vidsAsReels) {
    const safeName = vid.replace(/\s+/g, "_");
    const storagePath = `${creator.handle}/${Date.now()}-${safeName}`;
    const url = await uploadFile("reels", storagePath, join(folder, vid));
    if (!url) continue;
    const { error } = await supabase.from("reels").insert({
      author_id: profileId,
      video_url: url,
      video_path: storagePath,
      caption: creator.defaultCaption || "",
      is_story: false,
      is_published: true,
      created_at: staggeredTimestamp(14, tsOffset++),
    });
    if (error) console.warn(`    ! reel: ${error.message}`);
  }

  // 5. Highlights → reels with hashtag
  for (const hl of highlights) {
    const safeName = hl.replace(/\s+/g, "_");
    const storagePath = `${creator.handle}/highlights/${Date.now()}-${safeName}`;
    const url = await uploadFile("reels", storagePath, join(folder, hl));
    if (!url) continue;
    const { error } = await supabase.from("reels").insert({
      author_id: profileId,
      video_url: url,
      video_path: storagePath,
      caption: "Highlight",
      hashtags: ["highlight"],
      is_story: false,
      is_published: true,
      created_at: staggeredTimestamp(30, tsOffset++),
    });
    if (error) console.warn(`    ! highlight reel: ${error.message}`);
  }

  // 6. Events subfolder (optional)
  if (creator.eventFolder) {
    const eventDir = join(folder, creator.eventFolder);
    if (existsSync(eventDir)) {
      const eventFiles = readdirSync(eventDir)
        .filter((e) => !e.startsWith(".") && isImage(e))
        .sort();
      const eventMeta = creator.events ?? [];
      for (let i = 0; i < eventFiles.length; i++) {
        const evName = eventFiles[i];
        const meta = eventMeta[i] ?? {
          title: `Event ${i + 1}`,
          daysFromNow: 7 + i * 7,
        };
        const safeName = evName.replace(/\s+/g, "_");
        const storagePath = `${creator.handle}/events/${Date.now()}-${safeName}`;
        const url = await uploadFile("post-images", storagePath, join(eventDir, evName));
        if (!url) continue;
        const start = new Date();
        start.setDate(start.getDate() + meta.daysFromNow);
        const slug = `${creator.handle}-${meta.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
        const { error } = await supabase.from("events").insert({
          title: meta.title,
          slug,
          description: meta.description ?? null,
          category: "culture",
          start_date: start.toISOString().split("T")[0],
          start_time: "19:00:00",
          image_url: url,
          is_published: true,
          created_by: profileId,
          city_id: cityId,
          visibility: "public",
        });
        if (error) console.warn(`    ! event: ${error.message}`);
      }
    }
  }

  console.log(`  ✓ seeded ${creator.handle}`);
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  await ensureAvatarsBucket();

  const { data: city } = await supabase
    .from("cities")
    .select("id, slug")
    .eq("slug", manifest.defaultCitySlug)
    .maybeSingle();

  if (!city) {
    console.error(`City not found: ${manifest.defaultCitySlug}`);
    process.exit(1);
  }

  for (const creator of manifest.creators) {
    try {
      await seedCreator(creator, city.id);
    } catch (e) {
      console.error(`  ✗ ${creator.handle}: ${e.message}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
