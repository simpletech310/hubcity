#!/usr/bin/env node

/**
 * Upload Andre Spicer's videos via Mux and create video posts
 */

import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";
import { readFileSync, statSync } from "fs";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const MUX_TOKEN_ID = "130b2ec4-c099-4605-993c-c4921db299ea";
const MUX_TOKEN_SECRET = "kgny3kqbXFmsrjrRWk8Vwi+cdLBzlrDoYhp2hpuVMT9AdJjXXbgqMHm0Os8GLtajaGmcqFujUyP";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/Andre Spicer Post";

const videos = [
  {
    file: "ScreenRecording_04-05-2026 08-51-37_1.mov",
    body: "Community update from your District 2 Councilmember. Keeping you informed on what is happening in Compton — from city hall to your block. Stay connected, stay involved. #District2 #ComptonUpdate",
    daysAgo: 2,
  },
  {
    file: "ScreenRecording_04-05-2026 08-53-56_1.mov",
    body: "Walking through the neighborhood, talking to residents about what matters most. Infrastructure, safety, opportunity. This is what public service looks like — boots on the ground, ears open. #ComptonFirst #District2",
    daysAgo: 5,
  },
  {
    file: "ScreenRecording_04-05-2026 08-56-54_1.mov",
    body: "Quick message to the residents of District 2 and all of Compton. We are making progress on the issues that matter — parks, streetlights, and community programs. Thank you for your support and your voice. Together, we move forward. #NowToNext #Compton",
    daysAgo: 8,
  },
];

async function getSpicerId() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", "council_spicer")
    .single();
  if (error) throw new Error(`Failed to find Spicer: ${error.message}`);
  return data.id;
}

async function uploadVideoToMux(filePath) {
  const fileName = filePath.split("/").pop();
  const fileSize = statSync(filePath).size;
  console.log(`  File: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  // Create a direct upload
  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
  });

  console.log(`  Upload ID: ${upload.id}`);
  console.log(`  Uploading to Mux...`);

  // Upload the file directly using PUT
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
    throw new Error(`Mux upload failed: ${response.status} ${response.statusText}`);
  }

  console.log(`  Upload complete! Waiting for asset...`);

  // Poll for the asset to be created
  let asset = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const uploadStatus = await mux.video.uploads.retrieve(upload.id);
    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id);
      console.log(`  Asset ID: ${asset.id}`);
      console.log(`  Status: ${asset.status}`);
      if (asset.playback_ids?.[0]) {
        console.log(`  Playback ID: ${asset.playback_ids[0].id}`);
      }
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

async function main() {
  console.log("Starting Andre Spicer video post seeding...\n");

  const userId = await getSpicerId();
  console.log(`Found Andre Spicer: ${userId}\n`);

  for (const video of videos) {
    try {
      const filePath = `${IMAGE_DIR}/${video.file}`;
      console.log(`\nProcessing: ${video.file}`);

      const muxData = await uploadVideoToMux(filePath);

      const createdAt = new Date(Date.now() - video.daysAgo * 86400000).toISOString();

      const { data: post, error } = await supabase
        .from("posts")
        .insert({
          author_id: userId,
          body: video.body,
          media_type: "video",
          mux_upload_id: muxData.uploadId,
          mux_asset_id: muxData.assetId,
          mux_playback_id: muxData.playbackId,
          video_status: muxData.playbackId ? "ready" : "preparing",
          is_published: true,
          created_at: createdAt,
        })
        .select("id")
        .single();

      if (error) throw error;
      console.log(`  -> Post created: ${post.id} (${video.daysAgo}d ago)`);
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}`);
    }
  }

  console.log("\nDone! Video posts created for Andre Spicer.");
  console.log("Note: Videos may take 1-3 minutes to finish processing on Mux.");
}

main().catch(console.error);
