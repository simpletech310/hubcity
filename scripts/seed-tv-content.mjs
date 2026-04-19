#!/usr/bin/env node
/**
 * Seed Hub City TV with 9 Compton videos uploaded to Mux.
 * Creates a "Hub City TV" channel if needed, uploads videos, polls for ready, inserts channel_videos.
 */

import fs from "fs";
import path from "path";

const MUX_TOKEN_ID = "a9b71f93-1893-4c1f-9766-61c6c0277f2b";
const MUX_TOKEN_SECRET =
  "oKjxTigBfYMsPQj5Os8J8/kpWUYmRj1N634/S0XUodKczfXBy8TtaYFnDR4rjO0KvB5QIUTZmHv";
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
  "base64"
);

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const ASSETS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/new media";

const VIDEOS = [
  {
    file: "anthony anderson comdey.mov",
    title: "Anthony Anderson Comedy Special",
    description: "Comedy special featuring Anthony Anderson, Compton native and star of Black-ish.",
    video_type: "original",
  },
  {
    file: "compton college football.mov",
    title: "Compton College Football Highlights",
    description: "Highlights from Compton College Tartars football season.",
    video_type: "featured",
  },
  {
    file: "compton council meeting.mov",
    title: "Compton City Council Meeting",
    description: "Latest Compton City Council meeting — public session recording.",
    video_type: "city_hall",
  },
  {
    file: "compton news.mov",
    title: "Compton News Update",
    description: "Local news coverage of events and developments in Compton.",
    video_type: "featured",
  },
  {
    file: "compton parade.mov",
    title: "Compton Community Parade",
    description: "Annual community parade through the streets of Compton.",
    video_type: "featured",
  },
  {
    file: "gracie corner.mov",
    title: "Gracie's Corner — Kids Educational",
    description: "Educational kids content from Gracie's Corner.",
    video_type: "original",
  },
  {
    file: "kids content.mov",
    title: "Kids Programming Block",
    description: "Family-friendly programming for Hub City's youngest viewers.",
    video_type: "original",
  },
  {
    file: "original content 2.mov",
    title: "Hub City Original: Compton Stories",
    description: "Original Hub City TV documentary — stories from the community.",
    video_type: "original",
  },
  {
    file: "oringinal content 1.mov",
    title: "Hub City Original: Community Voices",
    description: "Original Hub City TV series — voices from Compton residents.",
    video_type: "original",
  },
];

// --- Mux helpers (same pattern as upload-biz-ads.mjs) ---

async function muxApi(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      Authorization: `Basic ${MUX_AUTH}`,
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`https://api.mux.com${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Mux API ${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function createDirectUpload() {
  const { data } = await muxApi("/video/v1/uploads", "POST", {
    new_asset_settings: { playback_policy: ["public"] },
    cors_origin: "*",
  });
  return data;
}

async function uploadFile(uploadUrl, filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "video/quicktime" },
    body: fileBuffer,
  });
  if (!res.ok) {
    throw new Error(`Upload PUT failed (${res.status}): ${await res.text()}`);
  }
  console.log(`  PUT upload complete (${res.status})`);
}

async function pollUploadUntilReady(uploadId, maxAttempts = 120) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await muxApi(`/video/v1/uploads/${uploadId}`);
    const status = data.status;
    if (i % 5 === 0) console.log(`  Poll ${i + 1}: status=${status}`);

    if (status === "asset_created") {
      return data.asset_id;
    }
    if (status === "errored") {
      throw new Error(`Upload ${uploadId} errored`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timed out waiting for upload ${uploadId}`);
}

async function getAssetDetails(assetId) {
  const { data } = await muxApi(`/video/v1/assets/${assetId}`);
  return {
    playback_id: data.playback_ids?.[0]?.id,
    duration: data.duration,
  };
}

// --- Supabase helpers ---

async function supabaseQuery(table, method = "GET", body = null, params = "") {
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : undefined,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${table} failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function getOrCreateChannel() {
  // Check if Hub City TV channel exists
  const existing = await supabaseQuery("channels", "GET", null, "?slug=eq.hubcity-tv&select=id");
  if (existing.length > 0) {
    console.log(`Found existing channel: ${existing[0].id}`);
    return existing[0].id;
  }

  // Create it
  const created = await supabaseQuery("channels", "POST", {
    name: "Hub City TV",
    slug: "hubcity-tv",
    description: "Compton's community television — local news, sports, entertainment, and original programming.",
    type: "community",
    is_active: true,
  });
  console.log(`Created channel: ${created[0].id}`);
  return created[0].id;
}

// --- Main ---

async function main() {
  console.log("=== Hub City TV Content Seeder ===\n");

  const channelId = await getOrCreateChannel();
  console.log(`Channel ID: ${channelId}\n`);

  const results = [];

  for (let i = 0; i < VIDEOS.length; i++) {
    const video = VIDEOS[i];
    const filePath = path.join(ASSETS_DIR, video.file);

    if (!fs.existsSync(filePath)) {
      console.error(`  SKIP: File not found — ${filePath}`);
      continue;
    }

    const fileSize = fs.statSync(filePath).size;
    console.log(
      `[${i + 1}/${VIDEOS.length}] ${video.title} (${(fileSize / 1024 / 1024).toFixed(0)} MB)`
    );

    // 1. Create direct upload
    console.log("  Creating Mux upload...");
    const upload = await createDirectUpload();

    // 2. Upload file
    console.log("  Uploading file to Mux...");
    await uploadFile(upload.url, filePath);

    // 3. Poll until asset created
    console.log("  Waiting for asset processing...");
    const assetId = await pollUploadUntilReady(upload.id);
    console.log(`  Asset ID: ${assetId}`);

    // 4. Get playback ID + duration
    const { playback_id, duration } = await getAssetDetails(assetId);
    console.log(`  Playback ID: ${playback_id}`);
    console.log(`  Duration: ${Math.round(duration)}s`);

    results.push({
      ...video,
      asset_id: assetId,
      playback_id,
      duration,
    });

    console.log("");
  }

  // Insert channel_videos records
  console.log("=== Inserting channel_videos records ===\n");

  for (const r of results) {
    const record = {
      channel_id: channelId,
      title: r.title,
      description: r.description,
      video_type: r.video_type,
      mux_asset_id: r.asset_id,
      mux_playback_id: r.playback_id,
      duration: r.duration || null,
      status: "ready",
      is_featured: r.video_type === "featured",
      is_published: true,
      published_at: new Date().toISOString(),
    };

    const inserted = await supabaseQuery("channel_videos", "POST", record);
    console.log(`  Inserted: ${r.title} -> id=${inserted[0]?.id}`);
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    console.log(`  ${r.title} — ${r.playback_id} (${Math.round(r.duration)}s)`);
  }
  console.log(`\nDone! ${results.length} videos seeded to Hub City TV.`);
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
