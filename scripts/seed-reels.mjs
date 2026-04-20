#!/usr/bin/env node

/**
 * Seed 6 demo reels using a single shared video (Andre Spicer screen
 * recording), attributed to 6 different verified users. All reels
 * reference the same video URL in Supabase Storage (uploaded once
 * under a shared seed/ path).
 *
 * Run: `node scripts/seed-reels.mjs`
 *
 * Re-running: the script de-dupes uploads by listing seed/ first; if a
 * seed reel row already exists for a given (author, video_path) it is
 * skipped.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, statSync } from "fs";
import path from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const VIDEO_SRC =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/post videos Andre spicer/ScreenRecording_04-07-2026 13-46-39_1.mov";
const POSTER_SRC =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/post videos Andre spicer/IMG_2779.jpg";

// 6 verified users — mix of officials, business owners, and a trustee
// so every role accent color shows up on the Pulse + profile rails.
const authors = [
  {
    id: "a1000001-0003-4000-8000-000000000003",
    name: "Andre Spicer",
    caption:
      "District 2 stand up. Walking these blocks every week so we know what's real. More to come on the parks overhaul. #District2 #ComptonFirst",
    hoursAgo: 0,
  },
  {
    id: "a1000001-0001-4000-8000-000000000001",
    name: "Mayor Emma Sharif",
    caption:
      "Compton — the work doesn't stop. New infrastructure wins and community programs coming online this quarter. Thank you for trusting us with this moment. #MayorSharif #Compton",
    hoursAgo: 6,
  },
  {
    id: "932ce7af-7f49-4068-a1c9-7cde935dd263",
    name: "Marcus Johnson",
    caption:
      "Grill's fired up all weekend. Pull up for the ribs — fam special if you tag us. #MarcusGrill #ComptonEats",
    hoursAgo: 14,
  },
  {
    id: "5d9dbf37-2cc8-412b-8d7d-11544ee4424a",
    name: "Deshawn Williams",
    caption:
      "Fresh fades all week. Walk-ins after 3. Bring the homies — students get 10 off with school ID. #Freshcutz #Compton",
    hoursAgo: 22,
  },
  {
    id: "dfaa6659-8a86-4d3d-8056-6e9f7ed01373",
    name: "Billionaire Burger Boyz",
    caption:
      "Smash burger + loaded fries + secret sauce = your new routine. Pickup and delivery open till 11. #BillionaireBoyz #ComptonEats",
    hoursAgo: 30,
  },
  {
    id: "b2000001-0001-4000-8000-000000000001",
    name: "Denzell Perry",
    caption:
      "Proud of what our CUSD scholars are building. Board meeting Thursday — come through, your voice matters. #CUSD #ComptonSchools",
    hoursAgo: 38,
  },
];

function parseHashtags(text) {
  const re = /#([a-zA-Z][a-zA-Z0-9_]{1,29})/g;
  const tags = [];
  let m;
  while ((m = re.exec(text)) !== null) tags.push(m[1].toLowerCase());
  return tags;
}

async function uploadShared(filePath, destPath, contentType) {
  const buf = readFileSync(filePath);
  const size = statSync(filePath).size;
  console.log(`  Uploading ${path.basename(filePath)} (${(size / 1024 / 1024).toFixed(1)} MB) → ${destPath}`);

  const { error } = await supabase.storage
    .from("reels")
    .upload(destPath, buf, {
      cacheControl: "3600",
      upsert: true,
      contentType,
    });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from("reels").getPublicUrl(destPath);
  return data.publicUrl;
}

async function main() {
  console.log("Seeding 6 demo reels...\n");

  const stamp = Date.now();
  const videoPath = `seed/andre-demo-${stamp}.mov`;
  const posterPath = `seed/andre-demo-${stamp}.jpg`;

  // 1. Upload video + poster once
  const videoUrl = await uploadShared(VIDEO_SRC, videoPath, "video/quicktime");
  const posterUrl = await uploadShared(POSTER_SRC, posterPath, "image/jpeg");

  console.log("");

  // 2. Insert a reel row per author
  let created = 0;
  let skipped = 0;
  for (const author of authors) {
    const createdAt = new Date(
      Date.now() - author.hoursAgo * 3600 * 1000
    ).toISOString();
    const hashtags = parseHashtags(author.caption);

    const { data, error } = await supabase
      .from("reels")
      .insert({
        author_id: author.id,
        video_url: videoUrl,
        video_path: videoPath,
        poster_url: posterUrl,
        poster_path: posterPath,
        caption: author.caption,
        duration_seconds: 14,
        width: 1080,
        height: 1920,
        hashtags,
        is_story: false,
        is_published: true,
        expires_at: null,
        created_at: createdAt,
      })
      .select("id")
      .single();

    if (error) {
      console.error(`  [FAIL] ${author.name}: ${error.message}`);
      skipped++;
    } else {
      console.log(`  [OK]   ${author.name.padEnd(26)} → reel ${data.id}`);
      created++;
    }
  }

  console.log(`\nDone — ${created} reels seeded, ${skipped} failed.`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
