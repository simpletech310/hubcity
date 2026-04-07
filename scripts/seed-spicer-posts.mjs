#!/usr/bin/env node
/**
 * Create Andre Spicer video + image test posts using Supabase Storage.
 * Videos go to `post-videos` bucket, images to `post-images` bucket.
 * Uses existing Andre Spicer profile or creates one.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync, existsSync } from "fs";
import { basename, extname, join } from "path";
import crypto from "crypto";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/post videos Andre spicer";

const POSTS = [
  {
    file: "ScreenRecording_04-07-2026 13-46-39_1.mov",
    type: "video",
    bucket: "post-videos",
    body: "Out here in the city making moves. Compton stays active 💪🏾 #compton #hubcity",
  },
  {
    file: "ScreenRecording_04-07-2026 13-49-45_1.mov",
    type: "video",
    bucket: "post-videos",
    body: "Another day, another grind. Hub City we up! 🔥 #comptonlife #community",
  },
  {
    file: "IMG_2779.jpg",
    type: "image",
    bucket: "post-images",
    body: "Beautiful day in the city. Compton looking good today ☀️ #compton #blessed",
  },
];

async function getSpicerId() {
  // Try existing handles
  for (const handle of ["andrespicer", "council_spicer"]) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("handle", handle)
      .maybeSingle();
    if (data) {
      console.log(`Found Andre Spicer profile (${handle}): ${data.id}`);
      return data.id;
    }
  }

  // Create auth user + profile
  console.log("Creating Andre Spicer profile...");
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email: "andre.spicer@hubcity.app",
    password: "hubcity2026!",
    email_confirm: true,
    user_metadata: { display_name: "Andre Spicer" },
  });

  if (authError) {
    // Maybe email already registered — find user
    const { data: users } = await supabase.auth.admin.listUsers();
    const found = users?.users?.find((u) => u.email === "andre.spicer@hubcity.app");
    if (found) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", found.id)
        .maybeSingle();
      if (prof) return prof.id;

      await supabase.from("profiles").insert({
        id: found.id,
        display_name: "Andre Spicer",
        handle: "andrespicer",
        role: "content_creator",
        verification_status: "verified",
        district: 2,
        bio: "Content creator & community voice. Compton born and raised. 🎬",
      });
      return found.id;
    }
    throw new Error(`Cannot create user: ${authError.message}`);
  }

  const userId = authUser.user.id;
  await supabase.from("profiles").insert({
    id: userId,
    display_name: "Andre Spicer",
    handle: "andrespicer",
    role: "content_creator",
    verification_status: "verified",
    district: 2,
    bio: "Content creator & community voice. Compton born and raised. 🎬",
  });

  console.log(`Created: ${userId}`);
  return userId;
}

async function ensureBucket(name) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (!buckets?.some((b) => b.name === name)) {
    console.log(`Creating bucket: ${name}`);
    const { error } = await supabase.storage.createBucket(name, {
      public: true,
      fileSizeLimit: 104857600,
    });
    if (error && !error.message?.includes("already exists")) throw error;
  }
}

async function uploadFile(bucket, filePath, userId) {
  const ext = extname(filePath).slice(1) || "mov";
  const storagePath = `${userId}/${crypto.randomUUID()}.${ext}`;
  const fileBuffer = readFileSync(filePath);

  const contentType =
    ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
    ext === "png" ? "image/png" :
    "video/quicktime";

  const { error } = await supabase.storage
    .from(bucket)
    .upload(storagePath, fileBuffer, { contentType, cacheControl: "3600", upsert: false });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(storagePath);
  return data.publicUrl;
}

async function main() {
  console.log("=== Andre Spicer Post Seeder ===\n");

  await ensureBucket("post-videos");
  await ensureBucket("post-images");

  const spicerId = await getSpicerId();
  console.log(`\nCreating ${POSTS.length} posts...\n`);

  for (let i = 0; i < POSTS.length; i++) {
    const post = POSTS[i];
    const filePath = join(ASSETS_DIR, post.file);

    if (!existsSync(filePath)) {
      console.error(`  SKIP: ${post.file} not found`);
      continue;
    }

    const size = statSync(filePath).size;
    console.log(`[${i + 1}/${POSTS.length}] ${post.type}: ${post.file} (${(size / 1024 / 1024).toFixed(1)} MB)`);

    console.log(`  Uploading to ${post.bucket}...`);
    const publicUrl = await uploadFile(post.bucket, filePath, spicerId);
    console.log(`  URL: ${publicUrl.substring(0, 80)}...`);

    const hashtags = (post.body.match(/#(\w+)/g) || []).map((h) => h.slice(1));

    const record = {
      author_id: spicerId,
      body: post.body,
      image_url: post.type === "image" ? publicUrl : null,
      video_url: post.type === "video" ? publicUrl : null,
      media_type: post.type,
      video_status: post.type === "video" ? "ready" : null,
      reaction_counts: {},
      is_published: true,
      hashtags,
    };

    const { data, error } = await supabase
      .from("posts")
      .insert(record)
      .select("id")
      .single();

    if (error) {
      console.error(`  ERROR: ${error.message}`);
    } else {
      console.log(`  Post created: ${data.id}\n`);
    }
  }

  console.log("Done! Andre Spicer video + image posts are live in Pulse.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
