#!/usr/bin/env node
/**
 * Upload business advertisement videos to Mux and store in Supabase.
 * Pre-roll ads for Hub City TV live page.
 */

import fs from "fs";
import path from "path";

const MUX_TOKEN_ID = "130b2ec4-c099-4605-993c-c4921db299ea";
const MUX_TOKEN_SECRET =
  "kgny3kqbXFmsrjrRWk8Vwi+cdLBzlrDoYhp2hpuVMT9AdJjXXbgqMHm0Os8GLtajaGmcqFujUyP";
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
  "base64"
);

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const BIZ_ADS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/biz ads";

const VIDEOS = [
  {
    file: "ScreenRecording_04-05-2026 11.mov",
    title: "We Need More Real — Shop Now (1)",
  },
  {
    file: "ScreenRecording_04-05-2026 12.mov",
    title: "We Need More Real — Shop Now (2)",
  },
  {
    file: "ScreenRecording_04-05-2026 13.mov",
    title: "We Need More Real — Shop Now (3)",
  },
  {
    file: "ScreenRecording_04-05-2026 14.mov",
    title: "We Need More Real — Shop Now (4)",
  },
];

const BUSINESS_ID = "b6000001-0001-4000-8000-000000000310";

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
    new_asset_settings: {
      playback_policy: ["public"],
    },
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

async function pollUploadUntilReady(uploadId, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await muxApi(`/video/v1/uploads/${uploadId}`);
    const status = data.status;
    console.log(`  Poll ${i + 1}: status=${status}`);

    if (status === "asset_created") {
      return data.asset_id;
    }
    if (status === "errored") {
      throw new Error(`Upload ${uploadId} errored: ${JSON.stringify(data)}`);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  throw new Error(`Timed out waiting for upload ${uploadId}`);
}

async function getAssetPlaybackId(assetId) {
  const { data } = await muxApi(`/video/v1/assets/${assetId}`);
  return {
    playback_id: data.playback_ids?.[0]?.id,
    duration: data.duration,
  };
}

async function insertAdRecord(record) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/video_ads`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    throw new Error(`Supabase insert failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  console.log("=== Hub City TV — Business Ad Uploader ===\n");

  const results = [];

  for (let i = 0; i < VIDEOS.length; i++) {
    const video = VIDEOS[i];
    const filePath = path.join(BIZ_ADS_DIR, video.file);
    const fileSize = fs.statSync(filePath).size;

    console.log(
      `[${i + 1}/${VIDEOS.length}] ${video.title} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`
    );

    // 1. Create direct upload
    console.log("  Creating Mux direct upload...");
    const upload = await createDirectUpload();
    console.log(`  Upload ID: ${upload.id}`);

    // 2. Upload file
    console.log("  Uploading file...");
    await uploadFile(upload.url, filePath);

    // 3. Poll until asset created
    console.log("  Waiting for asset...");
    const assetId = await pollUploadUntilReady(upload.id);
    console.log(`  Asset ID: ${assetId}`);

    // 4. Get playback ID
    const { playback_id, duration } = await getAssetPlaybackId(assetId);
    console.log(`  Playback ID: ${playback_id}`);
    console.log(`  Duration: ${duration}s`);

    results.push({
      ...video,
      asset_id: assetId,
      playback_id,
      duration,
    });

    console.log("");
  }

  // Insert all records into Supabase
  console.log("=== Inserting ad records into Supabase ===\n");

  for (const r of results) {
    const record = {
      business_id: BUSINESS_ID,
      title: r.title,
      mux_asset_id: r.asset_id,
      mux_playback_id: r.playback_id,
      ad_type: "pre_roll",
      duration: r.duration || null,
      cta_text: "Shop We Need More Real",
      cta_url: "/business/we-need-more-real",
      is_active: true,
    };

    const inserted = await insertAdRecord(record);
    console.log(`  Inserted: ${r.title} -> id=${inserted[0]?.id}`);
  }

  console.log("\n=== Summary ===");
  for (const r of results) {
    console.log(`  ${r.title}`);
    console.log(`    asset_id:    ${r.asset_id}`);
    console.log(`    playback_id: ${r.playback_id}`);
    console.log(`    duration:    ${r.duration}s`);
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
