#!/usr/bin/env node

/**
 * Seed community groups + posts + events from /Assets group folders.
 * Reads `_groups-manifest.json` for the per-group metadata (name, slug,
 * owner handle, city, cover image, text posts, events).
 *
 * Each group:
 *   - community_groups row with cover image_url + avatar_url
 *   - owner added to group_members as 'admin', all 8 creators added as 'member'
 *   - image posts + text posts + video posts in group_posts (mix of types)
 *   - events rows with group_id set
 *
 * Idempotent: skips creating a group when one with the slug already exists.
 * Re-running after a partial failure does NOT re-seed content for existing
 * groups; wipe the group row if you need a clean retry.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { basename, extname, dirname, resolve, join } from "node:path";
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
  { auth: { persistSession: false } }
);

const manifest = JSON.parse(
  readFileSync(resolve(__dirname, "_groups-manifest.json"), "utf8")
);

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXT = new Set([".mov", ".mp4", ".webm", ".m4v"]);
const MAX_UPLOAD_BYTES = 45 * 1024 * 1024;

function isImage(p) { return IMAGE_EXT.has(extname(p).toLowerCase()); }
function isVideo(p) { return VIDEO_EXT.has(extname(p).toLowerCase()); }
function contentTypeFor(p) {
  const ext = extname(p).toLowerCase();
  return ({
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp",
    ".mov": "video/quicktime", ".mp4": "video/mp4", ".webm": "video/webm", ".m4v": "video/mp4",
  })[ext] || "application/octet-stream";
}

function staggered(maxDaysAgo, seed = 0) {
  return new Date(Date.now() - Math.floor(Math.random() * maxDaysAgo * 86400000) - seed * 60000).toISOString();
}

async function uploadFile(bucket, path, fp) {
  const size = statSync(fp).size;
  if (size > MAX_UPLOAD_BYTES) {
    console.warn(`    ⊘ skip ${basename(fp)} (${(size / 1024 / 1024).toFixed(1)}MB > 45MB)`);
    return null;
  }
  const { error } = await supabase.storage.from(bucket).upload(path, readFileSync(fp), {
    contentType: contentTypeFor(fp),
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`Upload ${bucket}/${path}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function getCityId(slug) {
  const { data } = await supabase.from("cities").select("id").eq("slug", slug).maybeSingle();
  return data?.id ?? null;
}

async function getProfileByHandle(handle) {
  const { data } = await supabase.from("profiles").select("id").eq("handle", handle).maybeSingle();
  return data?.id ?? null;
}

async function getAllCreatorIds() {
  const { data } = await supabase.from("profiles").select("id").eq("role", "content_creator");
  return (data ?? []).map((p) => p.id);
}

async function seedGroup(g, allCreatorIds) {
  const folder = join(manifest.assetsRoot, g.folder);
  if (!existsSync(folder)) {
    console.warn(`  ! folder not found: ${folder}`);
    return;
  }

  const cityId = await getCityId(g.citySlug);
  const ownerId = await getProfileByHandle(g.ownerHandle);
  if (!cityId || !ownerId) {
    console.warn(`  ! missing city/owner: ${g.citySlug} / ${g.ownerHandle}`);
    return;
  }

  // Skip if group already exists
  const { data: existing } = await supabase
    .from("community_groups")
    .select("id")
    .eq("slug", g.slug)
    .maybeSingle();
  if (existing) {
    console.log(`[${g.slug}] exists, skipping`);
    return;
  }

  const entries = readdirSync(folder).filter(
    (e) => !e.startsWith(".") && !statSync(join(folder, e)).isDirectory()
  );
  const images = entries.filter(isImage).sort();
  const videos = entries.filter(isVideo).sort();
  console.log(`[${g.slug}] ${images.length} img, ${videos.length} vid`);

  // 1. Upload cover image first (use manifest override or largest image)
  const coverFile = g.coverImage && images.includes(g.coverImage) ? g.coverImage : images[0];
  const coverUrl = coverFile
    ? await uploadFile("post-images", `groups/${g.slug}/cover${extname(coverFile)}`, join(folder, coverFile))
    : null;

  // 2. Create the group
  const { data: newGroup, error: gErr } = await supabase
    .from("community_groups")
    .insert({
      name: g.name,
      slug: g.slug,
      description: g.description,
      category: g.category,
      image_url: coverUrl,
      avatar_url: coverUrl,
      is_public: true,
      is_active: true,
      member_count: 0,
      created_by: ownerId,
      city_id: cityId,
    })
    .select("id")
    .single();
  if (gErr) {
    console.warn(`  ! group create: ${gErr.message}`);
    return;
  }
  const groupId = newGroup.id;

  // 3. Members: owner as admin, all creators as members
  const memberRows = [
    { group_id: groupId, user_id: ownerId, role: "admin" },
    ...allCreatorIds
      .filter((id) => id !== ownerId)
      .map((id) => ({ group_id: groupId, user_id: id, role: "member" })),
  ];
  await supabase.from("group_members").insert(memberRows);
  await supabase
    .from("community_groups")
    .update({ member_count: memberRows.length })
    .eq("id", groupId);

  // Rotate author across group members for variety
  const authors = [ownerId, ...allCreatorIds.filter((id) => id !== ownerId)];
  const pickAuthor = (i) => authors[i % authors.length];

  // 4. Image posts
  let tsOffset = 0;
  for (const img of images) {
    const storagePath = `groups/${g.slug}/posts/${Date.now()}-${img}`.replace(/\s+/g, "_");
    const url = await uploadFile("post-images", storagePath, join(folder, img));
    if (!url) continue;
    const { error } = await supabase.from("group_posts").insert({
      group_id: groupId,
      author_id: pickAuthor(tsOffset),
      body: "",
      image_url: url,
      media_type: "image",
      is_published: true,
      city_id: cityId,
      created_at: staggered(21, tsOffset++),
    });
    if (error) console.warn(`    ! image post: ${error.message}`);
  }

  // 5. Text posts
  for (const txt of g.textPosts ?? []) {
    const { error } = await supabase.from("group_posts").insert({
      group_id: groupId,
      author_id: pickAuthor(tsOffset),
      body: txt,
      media_type: null,
      is_published: true,
      city_id: cityId,
      created_at: staggered(21, tsOffset++),
    });
    if (error) console.warn(`    ! text post: ${error.message}`);
  }

  // 6. Video posts
  for (const vid of videos) {
    const safeName = vid.replace(/\s+/g, "_");
    const storagePath = `groups/${g.slug}/posts/${Date.now()}-${safeName}`;
    const url = await uploadFile("post-videos", storagePath, join(folder, vid));
    if (!url) continue;
    const { error } = await supabase.from("group_posts").insert({
      group_id: groupId,
      author_id: pickAuthor(tsOffset),
      body: "",
      media_type: "video",
      video_url: url,
      is_published: true,
      city_id: cityId,
      created_at: staggered(14, tsOffset++),
    });
    if (error) console.warn(`    ! video post: ${error.message}`);
  }

  // 7. Events — linked to the group via group_id
  for (const ev of g.events ?? []) {
    const start = new Date();
    start.setDate(start.getDate() + ev.daysFromNow);
    const slug = `${g.slug}-${ev.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Date.now().toString(36)}`;
    const { error } = await supabase.from("events").insert({
      title: ev.title,
      slug,
      description: ev.description ?? null,
      category:
        g.category === "sports" ? "sports"
        : g.category === "business" ? "business"
        : "community",
      start_date: start.toISOString().split("T")[0],
      start_time: "07:00:00",
      image_url: coverUrl,
      is_published: true,
      created_by: ownerId,
      city_id: cityId,
      group_id: groupId,
      visibility: "public",
    });
    if (error) console.warn(`    ! event: ${error.message}`);
  }

  console.log(`  ✓ seeded ${g.slug}`);
}

async function main() {
  const allCreatorIds = await getAllCreatorIds();
  if (allCreatorIds.length === 0) {
    console.error("No creator profiles found. Seed creators first.");
    process.exit(1);
  }
  for (const g of manifest.groups) {
    try {
      await seedGroup(g, allCreatorIds);
    } catch (e) {
      console.error(`  ✗ ${g.slug}: ${e.message}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
