#!/usr/bin/env node

/**
 * Delete storage objects that aren't referenced by any DB row.
 * Saves space on free tier when failed seed runs left orphans behind.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
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

const DRY_RUN = process.argv.includes("--dry-run");

// Collect every URL referenced anywhere
async function referencedUrls() {
  const urls = new Set();
  for (const [table, cols] of [
    ["posts", ["image_url", "video_url"]],
    ["reels", ["video_url", "poster_url"]],
    ["events", ["image_url"]],
    ["profiles", ["avatar_url"]],
    ["city_art_features", ["image_url"]],
    ["group_posts", ["image_url", "video_url"]],
    ["community_groups", ["image_url", "avatar_url"]],
    ["businesses", ["image_url"]],
    ["menu_items", ["image_url"]],
  ]) {
    const sel = cols.join(",");
    const { data } = await supabase.from(table).select(sel);
    for (const row of data ?? []) {
      for (const c of cols) {
        if (row[c]) urls.add(row[c]);
      }
    }
  }
  return urls;
}

async function listAllInBucket(bucket, prefix = "") {
  const out = [];
  const stack = [prefix];
  while (stack.length) {
    const p = stack.pop();
    const { data, error } = await supabase.storage.from(bucket).list(p, { limit: 1000 });
    if (error || !data) continue;
    for (const item of data) {
      const full = p ? `${p}/${item.name}` : item.name;
      // A "folder" entry has id=null in Supabase storage
      if (item.id === null) stack.push(full);
      else out.push({ path: full, size: Number(item.metadata?.size ?? 0) });
    }
  }
  return out;
}

async function main() {
  const refs = await referencedUrls();
  console.log(`Referenced URLs: ${refs.size}`);

  const buckets = ["post-images", "post-videos", "reels", "profile-avatars"];
  let freedBytes = 0;
  let removedCount = 0;

  for (const bucket of buckets) {
    const files = await listAllInBucket(bucket);
    const orphans = [];
    for (const f of files) {
      const { data } = supabase.storage.from(bucket).getPublicUrl(f.path);
      if (!refs.has(data.publicUrl)) {
        orphans.push(f);
      }
    }
    console.log(
      `${bucket}: ${files.length} files, ${orphans.length} orphans, ${(
        orphans.reduce((s, o) => s + o.size, 0) /
        1024 /
        1024
      ).toFixed(1)} MB`
    );

    if (DRY_RUN) continue;

    for (let i = 0; i < orphans.length; i += 100) {
      const chunk = orphans.slice(i, i + 100);
      const { error } = await supabase.storage
        .from(bucket)
        .remove(chunk.map((o) => o.path));
      if (error) {
        console.warn(`  ! remove: ${error.message}`);
      } else {
        removedCount += chunk.length;
        freedBytes += chunk.reduce((s, o) => s + o.size, 0);
      }
    }
  }

  console.log(
    `\n${DRY_RUN ? "Would free" : "Freed"}: ${(freedBytes / 1024 / 1024).toFixed(1)} MB across ${removedCount} files`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
