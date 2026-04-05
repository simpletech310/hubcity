#!/usr/bin/env node

/**
 * Seed Fene310's account with posts, events, channel content, and videos
 */

import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";
import { readFileSync, statSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const MUX_TOKEN_ID = "130b2ec4-c099-4605-993c-c4921db299ea";
const MUX_TOKEN_SECRET = "kgny3kqbXFmsrjrRWk8Vwi+cdLBzlrDoYhp2hpuVMT9AdJjXXbgqMHm0Os8GLtajaGmcqFujUyP";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/fene310";
const USER_ID = "a5000001-0001-4000-8000-0000000fe310";
const CHANNEL_ID = "c5000001-0001-4000-8000-0000000fe310";

async function uploadImage(filePath, subdir) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `${subdir}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);

  const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(storagePath);
  return urlData.publicUrl;
}

async function uploadVideoToMux(filePath) {
  const fileName = filePath.split("/").pop();
  const fileSize = statSync(filePath).size;
  console.log(`  Video: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
  });

  console.log(`  Upload ID: ${upload.id}`);
  console.log(`  Uploading to Mux...`);

  const fileBuffer = readFileSync(filePath);
  const response = await fetch(upload.url, {
    method: "PUT",
    body: fileBuffer,
    headers: {
      "Content-Type": "video/quicktime",
      "Content-Length": String(fileSize),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mux upload failed: ${response.status} ${text}`);
  }

  console.log(`  Upload complete! Waiting for asset...`);

  let asset = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const uploadStatus = await mux.video.uploads.retrieve(upload.id);
    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id);
      console.log(`  Asset ID: ${asset.id}`);
      console.log(`  Playback ID: ${asset.playback_ids?.[0]?.id}`);
      break;
    }
    process.stdout.write(".");
  }

  return {
    uploadId: upload.id,
    assetId: asset?.id || null,
    playbackId: asset?.playback_ids?.[0]?.id || null,
    status: asset?.status || "preparing",
  };
}

// ── Image Posts ──
const posts = [
  {
    image: "IMG_2703.jpg",
    body: "Posted up in the Hub City. Compton streets raised me, Compton style defines me. Rocking the green and keeping it real — this is what Compton fashion looks like. No filter needed when the city is your backdrop. 🌴💧 #Fene310 #ComptonFashion #HubCityStyle #StreetWear",
    daysAgo: 1,
  },
  {
    image: "IMG_2708.jpg",
    body: "Layered up and locked in. Green puffer, newsboy cap, Sinister bag — every piece tells a story. Fashion is art, and the streets of Compton are my gallery. Stay fly, stay original. ✊🔥 #Fene310 #SinisterKids #ComptonStyle #FashionIsArt #HubCity",
    daysAgo: 4,
  },
  {
    image: "IMG_2712.jpg",
    body: "COMPTON TRAIL RIDE PT. 2 🐂🔥 Sinister Kids Entertainment presents the biggest backyard event of the summer! Bull ride contest with CASH PRIZE, line dance contest, food, hookah, drinks, and music. June 14th, 8PM. Compton, 90221. $5 drinks & shots, $3 beers, chicken & fries $5. PULL UP! #ComptonTrailRide #SinisterKids #ComptonEvents #HubCity",
    daysAgo: 2,
  },
];

// ── Events ──
const events = [
  {
    image: "IMG_2712.jpg",
    title: "Compton Trail Ride Pt. 2",
    slug: "compton-trail-ride-pt2-2026",
    description: "Sinister Kids Entertainment presents Compton Trail Ride Part 2! The biggest backyard event of the summer featuring a bull ride contest with cash prize, line dance contest, food, hookah, drinks, and music. $5 drinks & shots, $3 beers, chicken & fries for $5. Come through and show Compton how we do it!",
    category: "culture",
    start_date: "2026-06-14",
    start_time: "20:00",
    end_time: "02:00",
    location_name: "Backyard Compton",
    address: "Compton, CA 90221",
    latitude: 33.8886,
    longitude: -118.2208,
    is_featured: true,
  },
];

// ── Videos for channel ──
const videos = [
  {
    file: "ScreenRecording_04-05-2026 09-43-03_1.mov",
    title: "Fene310 — Street Style Check",
    description: "Quick fit check from the streets of Compton. Fashion runs deep in the Hub City.",
    daysAgo: 1,
  },
  {
    file: "ScreenRecording_04-05-2026 09-43-54_1.mov",
    title: "Compton Trail Ride Promo",
    description: "Get ready for Compton Trail Ride Pt. 2! Bull riding, line dancing, food, and vibes. June 14th.",
    daysAgo: 3,
  },
  {
    file: "ScreenRecording_04-05-2026 09-41-56_1.mov",
    title: "Fene310 — Hub City Culture",
    description: "What Compton culture looks like from the inside. Fashion, food, and community.",
    daysAgo: 5,
  },
];

async function main() {
  console.log("=== Seeding Fene310 ===\n");

  // 1. Avatar
  console.log("1. Setting avatar...");
  try {
    const avatarUrl = await uploadImage(`${IMAGE_DIR}/IMG_2703.jpg`, "avatars");
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", USER_ID);
    await supabase.from("channels").update({ avatar_url: avatarUrl }).eq("id", CHANNEL_ID);
    console.log(`  -> Avatar set`);
  } catch (err) {
    console.error(`  -> Avatar FAILED: ${err.message}`);
  }

  // 2. Banner
  console.log("\n2. Setting channel banner...");
  try {
    const bannerUrl = await uploadImage(`${IMAGE_DIR}/IMG_2708.jpg`, "banners");
    await supabase.from("channels").update({ banner_url: bannerUrl }).eq("id", CHANNEL_ID);
    console.log(`  -> Banner set`);
  } catch (err) {
    console.error(`  -> Banner FAILED: ${err.message}`);
  }

  // 3. Image Posts
  console.log("\n3. Creating posts...");
  for (const post of posts) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${post.image}`, "fene310-posts");
      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();
      const { error } = await supabase.from("posts").insert({
        author_id: USER_ID,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        video_status: null,
        is_published: true,
        created_at: createdAt,
      });
      if (error) throw error;
      console.log(`  -> [${post.image}] created (${post.daysAgo}d ago)`);
    } catch (err) {
      console.error(`  -> [${post.image}] FAILED: ${err.message}`);
    }
  }

  // 4. Events
  console.log("\n4. Creating events...");
  for (const evt of events) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${evt.image}`, "event-images");
      const { error } = await supabase.from("events").insert({
        title: evt.title,
        slug: evt.slug,
        description: evt.description,
        category: evt.category,
        start_date: evt.start_date,
        start_time: evt.start_time,
        end_time: evt.end_time,
        location_name: evt.location_name,
        address: evt.address,
        latitude: evt.latitude,
        longitude: evt.longitude,
        image_url: imageUrl,
        created_by: USER_ID,
        is_published: true,
        is_featured: evt.is_featured,
      });
      if (error) throw error;
      console.log(`  -> "${evt.title}" created`);
    } catch (err) {
      console.error(`  -> "${evt.title}" FAILED: ${err.message}`);
    }
  }

  // 5. Video posts (try Mux — may fail on free tier limit)
  console.log("\n5. Uploading videos...");
  for (const video of videos) {
    try {
      const filePath = `${IMAGE_DIR}/${video.file}`;
      console.log(`\n  Processing: ${video.title}`);
      const muxData = await uploadVideoToMux(filePath);

      const createdAt = new Date(Date.now() - video.daysAgo * 86400000).toISOString();

      // Create as post
      const { error: postErr } = await supabase.from("posts").insert({
        author_id: USER_ID,
        body: video.description,
        media_type: "video",
        mux_upload_id: muxData.uploadId,
        mux_asset_id: muxData.assetId,
        mux_playback_id: muxData.playbackId,
        video_status: muxData.playbackId ? "ready" : "preparing",
        is_published: true,
        created_at: createdAt,
      });
      if (postErr) console.error(`  -> Post insert error: ${postErr.message}`);
      else console.log(`  -> Video post created`);

      // Also create as channel video
      const { error: cvErr } = await supabase.from("channel_videos").insert({
        channel_id: CHANNEL_ID,
        title: video.title,
        description: video.description,
        video_type: "on_demand",
        mux_upload_id: muxData.uploadId,
        mux_asset_id: muxData.assetId,
        mux_playback_id: muxData.playbackId,
        status: muxData.playbackId ? "ready" : "processing",
        is_published: true,
        is_featured: false,
        published_at: createdAt,
      });
      if (cvErr) console.error(`  -> Channel video error: ${cvErr.message}`);
      else console.log(`  -> Channel video created`);

    } catch (err) {
      console.error(`  -> VIDEO FAILED: ${err.message}`);
      console.log(`  (Mux free tier may be at asset limit — video skipped)`);
    }
  }

  console.log("\n=== Done! ===");
  console.log("Login: fene310@hubcity.app / HubCity123");
}

main().catch(console.error);
