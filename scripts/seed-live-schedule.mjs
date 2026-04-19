#!/usr/bin/env node
/**
 * Seed the "Knect TV Live" simulated-linear broadcast schedule.
 * Rotates all published shows + Walmart ad slots into a 48h rolling schedule.
 */

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const WINDOW_HOURS = 48;
const AD_DURATION_SECONDS = 14; // Walmart ad duration

async function supabaseApi(endpoint, method = "GET", body = null) {
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${method} ${endpoint} (${res.status}): ${text}`);
  }
  const txt = await res.text();
  return txt ? JSON.parse(txt) : null;
}

async function upsert(endpoint, matchColumn, matchValue, row) {
  const existing = await supabaseApi(
    `${endpoint}?${matchColumn}=eq.${encodeURIComponent(matchValue)}&select=*`
  );
  if (existing && existing.length) {
    const id = existing[0].id;
    const updated = await supabaseApi(`${endpoint}?id=eq.${id}`, "PATCH", row);
    return updated[0];
  }
  const inserted = await supabaseApi(endpoint, "POST", row);
  return inserted[0];
}

async function main() {
  console.log("=== Knect TV Live — Schedule Seeder ===\n");

  // 1. Ensure the "knect-tv-live" channel exists
  const liveChannel = await upsert("/rest/v1/channels", "slug", "knect-tv-live", {
    slug: "knect-tv-live",
    name: "Knect TV Live",
    type: "media",
    scope: "national",
    is_live_simulated: true,
    is_active: true,
    is_verified: true,
    description: "Hub City's always-on channel — live-simulated 24/7.",
  });
  console.log(`✓ Knect TV Live channel: ${liveChannel.id}`);

  // 2. Pull all ready show episodes (one per show)
  const episodes = await supabaseApi(
    `/rest/v1/channel_videos?status=eq.ready&is_published=eq.true&show_id=not.is.null&select=id,title,duration,show_id,shows(slug,title,sort_order)&order=shows(sort_order).asc`
  );
  console.log(`Found ${episodes.length} published show episodes`);
  if (!episodes.length) {
    console.error("No show episodes — run seed-knect-shows.mjs first.");
    process.exit(1);
  }

  // 3. Grab the Walmart ad as a fake channel_video for scheduling purposes.
  //    We'll use the real Walmart ad video_ad for playback, but the schedule
  //    needs a channel_videos row. Use the first episode's id as a placeholder
  //    with is_ad_slot=true in the schedule — client-side player will swap in the ad.
  //    Simpler approach: reuse any episode's id for ad rows; the player relies on is_ad_slot.
  const adPlaceholderVideoId = episodes[0].id;

  // 4. Clear future schedule
  const nowIso = new Date().toISOString();
  await supabaseApi(
    `/rest/v1/scheduled_broadcasts?channel_id=eq.${liveChannel.id}&starts_at=gt.${nowIso}`,
    "DELETE"
  );
  console.log("✓ Cleared existing future slots");

  // 5. Build rotation: [show, ad, show, ad, ...]
  const nowMs = Date.now();
  // Anchor to top of current hour
  const anchor = new Date(nowMs - (nowMs % 3600000));
  let cursor = anchor.getTime();
  const endWindow = cursor + WINDOW_HOURS * 3600 * 1000;

  const rows = [];
  let position = 0;
  let episodeIdx = 0;

  while (cursor < endWindow) {
    const ep = episodes[episodeIdx % episodes.length];
    const durSec = Math.max(60, Math.floor(ep.duration || 60));
    const showStart = new Date(cursor);
    const showEnd = new Date(cursor + durSec * 1000);
    rows.push({
      channel_id: liveChannel.id,
      video_id: ep.id,
      starts_at: showStart.toISOString(),
      ends_at: showEnd.toISOString(),
      position: position++,
      is_ad_slot: false,
    });
    cursor = showEnd.getTime();

    // Then an ad slot
    const adEnd = new Date(cursor + AD_DURATION_SECONDS * 1000);
    rows.push({
      channel_id: liveChannel.id,
      video_id: adPlaceholderVideoId,
      starts_at: new Date(cursor).toISOString(),
      ends_at: adEnd.toISOString(),
      position: position++,
      is_ad_slot: true,
    });
    cursor = adEnd.getTime();
    episodeIdx++;
  }

  // 6. Bulk insert in chunks of 50
  console.log(`Inserting ${rows.length} broadcast slots (${episodeIdx} episodes rotated)…`);
  for (let i = 0; i < rows.length; i += 50) {
    const chunk = rows.slice(i, i + 50);
    await supabaseApi("/rest/v1/scheduled_broadcasts", "POST", chunk);
  }
  console.log("✓ All slots inserted");

  // 7. Preview first 12 hours
  const preview = rows.slice(0, 24);
  console.log("\nNext 24 slots:");
  for (const r of preview) {
    const start = new Date(r.starts_at);
    const t = start.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    const ep = episodes.find((e) => e.id === r.video_id);
    const label = r.is_ad_slot ? "📢 Walmart ad" : `▶️  ${ep.shows?.title || ep.title}`;
    console.log(`  ${t.padEnd(10)} ${label}`);
  }
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\nFATAL:", err.message);
  process.exit(1);
});
