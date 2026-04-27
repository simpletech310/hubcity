#!/usr/bin/env node
/**
 * Three-in-one polish pass:
 *
 *   1. Upload Adiz the Bam's icon avatar + Westside Party cover
 *      from the local Assets folder; wire those URLs into her
 *      profile, channel, album, and channel_video so every
 *      surface shows the same artwork.
 *
 *   2. Backfill every active channel's avatar_url from its
 *      owner's profiles.avatar_url. Most channels are auto-
 *      created without a banner / avatar; this gives /live's
 *      channel rail real faces instead of letter blobs.
 *
 *   3. (Idempotent — safe to re-run after asset swaps.)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
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

const ADIZ_FOLDER =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Creator/adizthebam post";
const ADIZ_AVATAR_FILE = "adiz the bam icon avatar .jpg";
const WESTSIDE_COVER_FILE = "Westside Part Cover.png";

async function ensureBucket(name) {
  const { data } = await supabase.storage.getBucket(name);
  if (!data) await supabase.storage.createBucket(name, { public: true });
}

async function uploadFile(bucket, storagePath, filePath, contentType) {
  const buf = readFileSync(filePath);
  const { error } = await supabase.storage.from(bucket).upload(storagePath, buf, {
    contentType,
    cacheControl: "3600",
    upsert: true,
  });
  if (error) {
    console.warn(`    ! upload ${storagePath}: ${error.message}`);
    return null;
  }
  return supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
}

async function adizPolish() {
  console.log("[adiz] uploading + wiring assets…");
  await ensureBucket("profile-avatars");
  await ensureBucket("post-images");

  // Avatar (square JPG) → profile-avatars bucket so it stays alongside other avatars.
  const avatarPath = join(ADIZ_FOLDER, ADIZ_AVATAR_FILE);
  if (statSync(avatarPath).size > 0) {
    const avatarUrl = await uploadFile(
      "profile-avatars",
      "adizthebam/avatar.jpg",
      avatarPath,
      "image/jpeg",
    );
    if (avatarUrl) {
      // Profile + channel get the same avatar.
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("handle", "adizthebam");
      await supabase
        .from("channels")
        .update({ avatar_url: avatarUrl })
        .eq("slug", "adizthebam");
      console.log(`  ✓ avatar wired (${avatarUrl})`);
    }
  }

  // Westside Party cover (PNG) → post-images bucket. Uploaded for
  // archival but NOT wired into albums.cover_art_url or
  // channel_videos.thumbnail_url — the source PNG is 1697x930 (wide
  // music-video frame) and doesn't crop into the 1:1 FEATURED SINGLE
  // hero on /frequency. The square (930x930) cover is managed by
  // scripts/upload-westside-square-cover.mjs and lives at
  // adizthebam/westside-party-cover-square.png. Don't re-wire here or
  // the wide version will overwrite it.
  const coverPath = join(ADIZ_FOLDER, WESTSIDE_COVER_FILE);
  if (statSync(coverPath).size > 0) {
    await uploadFile(
      "post-images",
      "adizthebam/westside-party-cover.png",
      coverPath,
      "image/png",
    );
    console.log(
      `  ✓ Westside Party (wide) cover archived — square version stays wired`,
    );
  }
}

async function backfillChannelAvatars() {
  console.log("\n[channels] backfilling avatars from owner profiles…");
  const { data: rows } = await supabase
    .from("channels")
    .select(
      "id, slug, name, avatar_url, owner_id, owner:profiles!channels_owner_id_fkey(avatar_url)",
    )
    .eq("is_active", true);

  let filled = 0;
  let skipped = 0;
  for (const c of rows ?? []) {
    if (c.avatar_url) {
      skipped += 1;
      continue;
    }
    const ownerAvatar = Array.isArray(c.owner)
      ? c.owner[0]?.avatar_url
      : c.owner?.avatar_url;
    if (!ownerAvatar) {
      // Channels without an owner avatar will use a generated fallback
      // via dicebear (deterministic, from slug). Keeps /live consistent.
      const fallback = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
        c.name || c.slug,
      )}&backgroundColor=1A1512&textColor=F2A900&fontSize=42`;
      await supabase
        .from("channels")
        .update({ avatar_url: fallback })
        .eq("id", c.id);
      filled += 1;
      continue;
    }
    await supabase
      .from("channels")
      .update({ avatar_url: ownerAvatar })
      .eq("id", c.id);
    filled += 1;
  }
  console.log(`  ✓ filled ${filled} channels (${skipped} already had an avatar)`);
}

async function main() {
  await adizPolish();
  await backfillChannelAvatars();
  console.log("\n→ visit /live + /user/adizthebam + /frequency to verify");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
