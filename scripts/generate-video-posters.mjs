#!/usr/bin/env node

/**
 * Extracts the first frame from every reel + non-Mux video post that
 * doesn't already have a poster, uploads it to storage, and writes the
 * poster_url / image_url back to the DB.
 *
 * Solves the "reel shows a black rectangle until you press play" issue
 * on free-tier Supabase where preload=metadata doesn't buffer enough
 * data for the browser to render a frame on its own.
 *
 * Requires: ffmpeg on PATH.
 *
 * Usage: node scripts/generate-video-posters.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, unlinkSync, existsSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, basename, dirname, resolve } from "node:path";
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

async function downloadTo(url, outPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  return outPath;
}

function extractFirstFrame(videoPath, outPath) {
  // -ss 0.1 seeks to 0.1s (avoids blank first frames common in .mov)
  // -frames:v 1 grabs one frame
  // -q:v 3 high-quality JPEG (~90%)
  execSync(
    `ffmpeg -y -ss 0.1 -i "${videoPath}" -frames:v 1 -q:v 3 "${outPath}" 2>/dev/null`,
    { stdio: "pipe" }
  );
  return outPath;
}

async function uploadPoster(bucket, path, localFile) {
  const buf = readFileSync(localFile);
  const { error } = await supabase.storage.from(bucket).upload(path, buf, {
    contentType: "image/jpeg",
    cacheControl: "3600",
    upsert: true,
  });
  if (error) throw new Error(`Upload ${bucket}/${path}: ${error.message}`);
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

async function processRow({ id, videoUrl, bucket, posterPath, label, onPoster }) {
  const tmpVideo = join(tmpdir(), `vid-${id}.mov`);
  const tmpPoster = join(tmpdir(), `poster-${id}.jpg`);
  try {
    await downloadTo(videoUrl, tmpVideo);
    if (!existsSync(tmpVideo) || statSync(tmpVideo).size === 0) {
      console.warn(`  ! ${label}: downloaded video is empty`);
      return;
    }
    extractFirstFrame(tmpVideo, tmpPoster);
    if (!existsSync(tmpPoster) || statSync(tmpPoster).size === 0) {
      console.warn(`  ! ${label}: ffmpeg produced no poster`);
      return;
    }
    const posterUrl = await uploadPoster(bucket, posterPath, tmpPoster);
    await onPoster({ url: posterUrl, path: posterPath });
    console.log(`  ✓ ${label}`);
  } finally {
    try { unlinkSync(tmpVideo); } catch {}
    try { unlinkSync(tmpPoster); } catch {}
  }
}

async function processReels() {
  const { data: reels } = await supabase
    .from("reels")
    .select("id, video_url, video_path, poster_url")
    .is("poster_url", null);
  console.log(`Reels needing posters: ${reels?.length ?? 0}`);
  for (const r of reels ?? []) {
    try {
      await processRow({
        id: r.id,
        videoUrl: r.video_url,
        bucket: "reels",
        posterPath: `${r.video_path}-poster.jpg`,
        label: `reel ${r.id.slice(0, 8)}`,
        onPoster: async ({ url, path }) => {
          await supabase
            .from("reels")
            .update({ poster_url: url, poster_path: path })
            .eq("id", r.id);
        },
      });
    } catch (e) {
      console.warn(`  ✗ reel ${r.id.slice(0, 8)}: ${e.message}`);
    }
  }
}

function pathFromUrl(url, bucketName) {
  const re = new RegExp(`/object/public/${bucketName}/(.+)$`);
  const m = re.exec(url);
  return m ? m[1] : null;
}

async function processVideoPosts() {
  // Non-Mux video posts that don't have a thumbnail set via image_url.
  const { data: posts } = await supabase
    .from("posts")
    .select("id, video_url, video_path, image_url, media_type")
    .eq("media_type", "video")
    .not("video_url", "is", null)
    .is("image_url", null);
  console.log(`Video posts needing thumbnails: ${posts?.length ?? 0}`);
  for (const p of posts ?? []) {
    try {
      // Posters are images — upload to post-images (allowed mime) under a
      // `posters/` prefix that mirrors the original video path for clarity.
      const vidStoragePath = pathFromUrl(p.video_url, "post-videos") ?? `posts/${p.id}`;
      const posterStoragePath = `posters/${vidStoragePath.replace(/\.[^/.]+$/, "")}.jpg`;
      await processRow({
        id: p.id,
        videoUrl: p.video_url,
        bucket: "post-images",
        posterPath: posterStoragePath,
        label: `post ${p.id.slice(0, 8)}`,
        onPoster: async ({ url }) => {
          await supabase.from("posts").update({ image_url: url }).eq("id", p.id);
        },
      });
    } catch (e) {
      console.warn(`  ✗ post ${p.id.slice(0, 8)}: ${e.message}`);
    }
  }
}

async function processGroupVideoPosts() {
  const { data: posts } = await supabase
    .from("group_posts")
    .select("id, video_url, image_url, media_type")
    .eq("media_type", "video")
    .not("video_url", "is", null)
    .is("image_url", null);
  console.log(`Group video posts needing thumbnails: ${posts?.length ?? 0}`);
  for (const p of posts ?? []) {
    try {
      const vidStoragePath = pathFromUrl(p.video_url, "post-videos") ?? `group-posts/${p.id}`;
      const posterStoragePath = `posters/${vidStoragePath.replace(/\.[^/.]+$/, "")}.jpg`;
      await processRow({
        id: p.id,
        videoUrl: p.video_url,
        bucket: "post-images",
        posterPath: posterStoragePath,
        label: `group post ${p.id.slice(0, 8)}`,
        onPoster: async ({ url }) => {
          await supabase.from("group_posts").update({ image_url: url }).eq("id", p.id);
        },
      });
    } catch (e) {
      console.warn(`  ✗ group post ${p.id.slice(0, 8)}: ${e.message}`);
    }
  }
}

async function main() {
  // Quick ffmpeg sanity check
  try {
    execSync("ffmpeg -version", { stdio: "pipe" });
  } catch {
    console.error("ffmpeg is not on PATH. Install it first.");
    process.exit(1);
  }

  await processReels();
  await processVideoPosts();
  await processGroupVideoPosts();
}

main().catch((e) => { console.error(e); process.exit(1); });
