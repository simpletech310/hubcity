#!/usr/bin/env node
/**
 * Upload Walmart pre-roll ad to Mux and create video_ads record.
 * This ad plays at FULL VOLUME before all Hub City TV content.
 */

import fs from "fs";

const MUX_TOKEN_ID = "130b2ec4-c099-4605-993c-c4921db299ea";
const MUX_TOKEN_SECRET =
  "kgny3kqbXFmsrjrRWk8Vwi+cdLBzlrDoYhp2hpuVMT9AdJjXXbgqMHm0Os8GLtajaGmcqFujUyP";
const MUX_AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString(
  "base64"
);

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const AD_FILE =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/new media/Ads/walmart ad.mov";

// Need a business_id for Walmart — check if one exists or use a placeholder
const WALMART_SLUG = "walmart-compton";

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
    throw new Error(`Mux ${method} ${endpoint} (${res.status}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log("=== Walmart Pre-Roll Ad Uploader ===\n");

  // Find Walmart business ID
  const bizRes = await fetch(
    `${SUPABASE_URL}/rest/v1/businesses?slug=eq.${WALMART_SLUG}&select=id,name`,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    }
  );
  const businesses = await bizRes.json();
  const walmartId = businesses[0]?.id;

  if (!walmartId) {
    console.error("Walmart business not found in DB. Run seed-chains.mjs first.");
    process.exit(1);
  }
  console.log(`Walmart business ID: ${walmartId}`);

  // 1. Create Mux direct upload
  console.log("Creating Mux upload...");
  const { data: upload } = await muxApi("/video/v1/uploads", "POST", {
    new_asset_settings: { playback_policy: ["public"] },
    cors_origin: "*",
  });

  // 2. Upload file
  const fileSize = fs.statSync(AD_FILE).size;
  console.log(`Uploading walmart ad.mov (${(fileSize / 1024 / 1024).toFixed(1)} MB)...`);
  const fileBuffer = fs.readFileSync(AD_FILE);
  const putRes = await fetch(upload.url, {
    method: "PUT",
    headers: { "Content-Type": "video/quicktime" },
    body: fileBuffer,
  });
  if (!putRes.ok) throw new Error(`PUT failed: ${putRes.status}`);
  console.log("Upload complete.");

  // 3. Poll for asset
  console.log("Waiting for Mux processing...");
  let assetId;
  for (let i = 0; i < 60; i++) {
    const { data } = await muxApi(`/video/v1/uploads/${upload.id}`);
    if (i % 5 === 0) console.log(`  Poll ${i + 1}: ${data.status}`);
    if (data.status === "asset_created") {
      assetId = data.asset_id;
      break;
    }
    if (data.status === "errored") throw new Error("Upload errored");
    await new Promise((r) => setTimeout(r, 3000));
  }
  if (!assetId) throw new Error("Timed out");

  // 4. Get playback details
  const { data: asset } = await muxApi(`/video/v1/assets/${assetId}`);
  const playbackId = asset.playback_ids?.[0]?.id;
  const duration = asset.duration;
  console.log(`Asset: ${assetId}`);
  console.log(`Playback ID: ${playbackId}`);
  console.log(`Duration: ${Math.round(duration)}s`);

  // 5. Insert video_ads record
  console.log("\nInserting video_ads record...");
  const adRes = await fetch(`${SUPABASE_URL}/rest/v1/video_ads`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      business_id: walmartId,
      title: "Walmart — Save Money. Live Better.",
      mux_asset_id: assetId,
      mux_playback_id: playbackId,
      ad_type: "pre_roll",
      duration: duration || null,
      cta_text: "Visit Walmart",
      cta_url: "/business/walmart-compton",
      is_active: true,
    }),
  });

  if (!adRes.ok) {
    const errText = await adRes.text();
    throw new Error(`Insert failed: ${errText}`);
  }

  const inserted = await adRes.json();
  console.log(`Inserted video_ad: ${inserted[0]?.id}`);
  console.log("\nDone! Walmart pre-roll ad is active and will play before all Hub City TV content.");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
