#!/usr/bin/env node
// Post-seed extras:
//   thumbs   — generate poster thumbnails for every reel (Moment) lacking one
//   biz      — update Pucker Up / FakeSmiles / Glamorous Mane with their
//              real catalog: menu items, services, staff, time slots
//   videoad  — insert/refresh the Top Dawg Law video pre-roll into video_ads
//   livetv   — create the simulated 24/7 live channel and seed a looping
//              schedule across the 4 Culture VOD videos for the next 14 days
//
// Usage:
//   node scripts/seed/extras.mjs                  (all)
//   node scripts/seed/extras.mjs thumbs
//   node scripts/seed/extras.mjs biz
//   node scripts/seed/extras.mjs videoad
//   node scripts/seed/extras.mjs livetv

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { supabase, uploadFile } from './lib.mjs';

const args = process.argv.slice(2);
const wants = (k) => args.length === 0 || args.includes(k);

// ─── Thumbnails for Moments ────────────────────────────────────────────────

async function downloadToTmp(url, ext) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status}: ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const tmp = path.join(os.tmpdir(), `reel-${crypto.randomBytes(6).toString('hex')}${ext}`);
  fs.writeFileSync(tmp, buf);
  return tmp;
}

function ffmpegFrame(inputPath, outputPath) {
  const r = spawnSync('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-ss', '0.5',
    '-i', inputPath,
    '-frames:v', '1',
    '-q:v', '4',
    '-vf', 'scale=720:-2',
    outputPath,
  ], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed: ${r.stderr}`);
  }
}

async function seedThumbnails() {
  console.log('\n=== Moment thumbnails ===');
  const { data: reels, error } = await supabase
    .from('reels')
    .select('id, video_url, video_path, poster_url')
    .is('poster_url', null);
  if (error) throw error;
  console.log(`  ${reels.length} moment(s) need a thumbnail`);

  let ok = 0, skip = 0, fail = 0;
  for (const r of reels) {
    const inExt = path.extname(r.video_path).toLowerCase() || '.mp4';
    const posterPath = `${r.video_path}.poster.jpg`;
    let videoTmp = null;
    let posterTmp = null;
    try {
      videoTmp = await downloadToTmp(r.video_url, inExt);
      posterTmp = path.join(os.tmpdir(), `reel-${crypto.randomBytes(6).toString('hex')}.jpg`);
      ffmpegFrame(videoTmp, posterTmp);
      const url = await uploadFile(posterTmp, 'reels', posterPath);
      if (!url) { skip++; continue; }
      const { error: uErr } = await supabase
        .from('reels')
        .update({ poster_url: url, poster_path: posterPath })
        .eq('id', r.id);
      if (uErr) throw uErr;
      ok++;
      if (ok % 10 === 0) console.log(`  · ${ok}/${reels.length} done`);
    } catch (e) {
      console.error(`  ✗ ${r.video_path}: ${e.message}`);
      fail++;
    } finally {
      if (videoTmp) try { fs.unlinkSync(videoTmp); } catch {}
      if (posterTmp) try { fs.unlinkSync(posterTmp); } catch {}
    }
  }
  console.log(`  ok=${ok} skip=${skip} fail=${fail}`);
}

// ─── Business catalogs ─────────────────────────────────────────────────────

async function getBusiness(slug) {
  const { data, error } = await supabase.from('businesses').select('*').eq('slug', slug).single();
  if (error) throw error;
  return data;
}

async function ensureMenuItems(businessId, items, options = {}) {
  for (const item of items) {
    const { data: existing } = await supabase
      .from('menu_items')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', item.name)
      .maybeSingle();
    const row = {
      business_id: businessId,
      name: item.name,
      description: item.description ?? null,
      price: item.price,
      category: item.category ?? null,
      image_url: item.image_url ?? null,
      gallery_urls: item.gallery_urls ?? null,
      sort_order: item.sort_order ?? 0,
      sku: item.sku ?? null,
      stock_count: item.stock_count ?? null,
      is_digital: item.is_digital ?? false,
      is_available: true,
      ...(options.allergens ? { allergens: options.allergens } : {}),
      ...(options.prep_time_minutes ? { prep_time_minutes: options.prep_time_minutes } : {}),
    };
    if (existing?.id) {
      await supabase.from('menu_items').update(row).eq('id', existing.id);
    } else {
      await supabase.from('menu_items').insert(row);
    }
  }
}

async function ensureServices(businessId, items) {
  const ids = [];
  for (const s of items) {
    const { data: existing } = await supabase
      .from('services')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', s.name)
      .maybeSingle();
    const row = {
      business_id: businessId,
      name: s.name,
      description: s.description ?? null,
      price: s.price,
      duration: s.duration,
      sort_order: s.sort_order ?? 0,
      deposit_amount: s.deposit_amount ?? 0,
      is_available: true,
    };
    if (existing?.id) {
      await supabase.from('services').update(row).eq('id', existing.id);
      ids.push(existing.id);
    } else {
      const { data: ins, error } = await supabase.from('services').insert(row).select('id').single();
      if (error) throw error;
      ids.push(ins.id);
    }
  }
  return ids;
}

async function ensureStaff(businessId, members) {
  const ids = [];
  for (const m of members) {
    const { data: existing } = await supabase
      .from('business_staff')
      .select('id')
      .eq('business_id', businessId)
      .eq('name', m.name)
      .maybeSingle();
    const row = {
      business_id: businessId,
      name: m.name,
      display_name: m.name,
      role: m.role ?? 'provider',
      photo_url: m.photo_url ?? null,
      avatar_url: m.photo_url ?? null,
      specialties: m.specialties ?? null,
      is_active: true,
      active: true,
    };
    if (existing?.id) {
      await supabase.from('business_staff').update(row).eq('id', existing.id);
      ids.push(existing.id);
    } else {
      const { data: ins, error } = await supabase.from('business_staff').insert(row).select('id').single();
      if (error) throw error;
      ids.push(ins.id);
    }
  }
  return ids;
}

async function ensureStaffServices(staffId, serviceIds) {
  for (const sid of serviceIds) {
    await supabase.from('staff_services').upsert(
      { staff_id: staffId, service_id: sid },
      { onConflict: 'staff_id,service_id' }
    );
  }
}

async function ensureTimeSlots(businessId, slots) {
  // Replace-all approach: clear then insert.
  await supabase.from('time_slots').delete().eq('business_id', businessId);
  for (const s of slots) {
    await supabase.from('time_slots').insert({
      business_id: businessId,
      day_of_week: s.day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      slot_duration: s.slot_duration ?? 60,
      max_bookings: s.max_bookings ?? 1,
      is_active: true,
    });
  }
}

async function seedBizExtras() {
  console.log('\n=== Business catalogs ===');

  // ── Pucker Up — lemonade company under FOOD ─────────────────────────
  const pucker = await getBusiness('pucker-up');
  console.log('  → Pucker Up (lemonade · food)');
  await supabase.from('businesses').update({
    category: 'food',
    business_type: 'food',
    business_sub_type: 'general',
    description: 'Compton-grown lemonade. Cold-pressed, hand-shaken, hits different.',
    accepts_orders: true,
  }).eq('id', pucker.id);

  await ensureMenuItems(pucker.id, [
    { name: 'Classic Lemonade',         price: 600, category: 'lemonade', description: 'Fresh-squeezed, just enough sweet.', sort_order: 1 },
    { name: 'Strawberry Lemonade',      price: 700, category: 'lemonade', description: 'Real strawberry purée muddled in.',  sort_order: 2 },
    { name: 'Mango Tajín Lemonade',     price: 750, category: 'lemonade', description: 'Mango chunks, Tajín rim. Compton-style.', sort_order: 3 },
    { name: 'Watermelon Mint',          price: 750, category: 'lemonade', description: 'Watermelon, mint, lime.',           sort_order: 4 },
    { name: 'Hibiscus Lemonade',        price: 700, category: 'lemonade', description: 'Floral, tart, deep red. Caffeine-free.', sort_order: 5 },
    { name: 'Pucker Up Pink',           price: 650, category: 'lemonade', description: 'Pink lemonade, the OG.',             sort_order: 6 },
    { name: 'Family Jug (64 oz)',       price: 1800, category: 'family',  description: 'Half-gallon. Pick any flavor.',      sort_order: 7 },
  ], { allergens: [], prep_time_minutes: 5 });

  // ── FakeSmiles — retail (hats + shirts) ─────────────────────────────
  const fake = await getBusiness('fakesmiles');
  console.log('  → FakeSmiles (retail · apparel)');
  await supabase.from('businesses').update({
    category: 'retail',
    business_type: 'retail',
    business_sub_type: 'general',
    description: 'Streetwear out of Compton. Smiles on every fit. Hats, tees, hoodies.',
    accepts_orders: true,
  }).eq('id', fake.id);

  await ensureMenuItems(fake.id, [
    { name: 'FakeSmiles Logo Tee — Black',   price: 3500, category: 'shirts', description: '100% cotton. Front chest logo.',   sku: 'FS-TEE-BLK', stock_count: 40, sort_order: 1 },
    { name: 'FakeSmiles Logo Tee — White',   price: 3500, category: 'shirts', description: '100% cotton. Front chest logo.',   sku: 'FS-TEE-WHT', stock_count: 35, sort_order: 2 },
    { name: 'Hub City Heavyweight Hoodie',   price: 7500, category: 'shirts', description: '12 oz hoodie. Embroidered chest.', sku: 'FS-HOOD-01', stock_count: 22, sort_order: 3 },
    { name: 'Smile Script Long Sleeve',      price: 4500, category: 'shirts', description: 'Cursive smile across the back.',   sku: 'FS-LS-01',   stock_count: 28, sort_order: 4 },
    { name: 'Dad Hat — Black',               price: 3000, category: 'hats',   description: 'Unstructured, curved brim, low profile.', sku: 'FS-HAT-BLK', stock_count: 50, sort_order: 5 },
    { name: 'Dad Hat — Tan',                 price: 3000, category: 'hats',   description: 'Unstructured, curved brim. Tan colorway.', sku: 'FS-HAT-TAN', stock_count: 45, sort_order: 6 },
    { name: 'Trucker — Black/Mesh',          price: 3200, category: 'hats',   description: 'High-crown mesh-back trucker.',     sku: 'FS-HAT-TRK', stock_count: 30, sort_order: 7 },
    { name: 'Beanie — Embroidered',          price: 2800, category: 'hats',   description: 'Cuffed beanie, embroidered logo.',  sku: 'FS-HAT-BNY', stock_count: 38, sort_order: 8 },
  ]);

  // ── Glamorous Mane — beauty · hair stylist with bookings ────────────
  const glam = await getBusiness('glamorous-mane');
  console.log('  → Glamorous Mane (beauty · hair stylist)');
  await supabase.from('businesses').update({
    category: 'beauty',
    description: 'Compton hair studio. Specializing in lace installs, quick weaves, silk presses, and natural wash & gos.',
    accepts_bookings: true,
  }).eq('id', glam.id);

  const serviceIds = await ensureServices(glam.id, [
    { name: 'Full Lace Wig Install',        price: 25000, duration: 180, deposit_amount: 5000, sort_order: 1, description: 'Custom-cut, melted lace, styled. Bring your own unit or add unit.' },
    { name: 'Quick Weave',                  price: 18000, duration: 150, deposit_amount: 4000, sort_order: 2, description: 'Sew-in alternative. Cap method. Includes leave-out cut & styling.' },
    { name: 'Silk Press',                   price: 12000, duration: 120, deposit_amount: 3000, sort_order: 3, description: 'Wash, blow-dry, silk press. Healthy heat, max shine.' },
    { name: 'Wash & Go',                    price: 9000,  duration: 90,  deposit_amount: 2000, sort_order: 4, description: 'Cleanse, condition, define. Air-dry or diffuse.' },
    { name: 'Blow Dry & Style',             price: 7500,  duration: 75,  deposit_amount: 2000, sort_order: 5, description: 'Blow out + curl/wrap of choice.' },
    { name: 'Natural Hair Trim',            price: 4500,  duration: 45,  deposit_amount: 1000, sort_order: 6, description: 'Dusting or full trim on natural texture.' },
    { name: 'Color Consultation',           price: 3500,  duration: 30,  deposit_amount: 0,    sort_order: 7, description: 'In-person consult before any color service.' },
  ]);

  const staffIds = await ensureStaff(glam.id, [
    { name: 'Mané (Owner)',     role: 'provider', specialties: ['Lace installs', 'Quick weaves', 'Silk press'] },
    { name: 'Talia',            role: 'provider', specialties: ['Wash & go', 'Natural hair', 'Blow dry'] },
    { name: 'Renee',            role: 'provider', specialties: ['Color', 'Silk press', 'Trims'] },
  ]);

  // Mané does everything; Talia does natural-hair + blowouts; Renee does color + press + trims.
  const allIds = serviceIds; // [install, quickweave, silkpress, wash&go, blowdry, trim, color]
  await ensureStaffServices(staffIds[0], allIds);
  await ensureStaffServices(staffIds[1], [allIds[3], allIds[4], allIds[5]]);
  await ensureStaffServices(staffIds[2], [allIds[2], allIds[5], allIds[6]]);

  // Open Tue–Sat, 9 AM–7 PM, 60-min slot increments.
  const slots = [];
  for (let d = 2; d <= 6; d++) {
    slots.push({
      day_of_week: d, start_time: '09:00:00', end_time: '19:00:00',
      slot_duration: 60, max_bookings: 1,
    });
  }
  await ensureTimeSlots(glam.id, slots);

  console.log('  ✓ catalogs updated');
}

// ─── Top Dawg Law video pre-roll ───────────────────────────────────────────

async function seedVideoAd() {
  console.log('\n=== Video pre-roll ad (Top Dawg Law) ===');
  // Pull the playback id from the existing ad_creatives row so we don't
  // re-upload to Mux. It's a stream.mux.com/<id>.m3u8 URL.
  const { data: cre } = await supabase
    .from('ad_creatives')
    .select('id, video_url')
    .eq('ad_type', 'pre_roll')
    .not('video_url', 'is', null)
    .maybeSingle();
  if (!cre?.video_url) {
    console.error('  ! ad_creatives row with video_url not found — run knect-tv ads first');
    return;
  }
  const m = /stream\.mux\.com\/([^./]+)\.m3u8/.exec(cre.video_url);
  if (!m) {
    console.error(`  ! could not extract playback id from ${cre.video_url}`);
    return;
  }
  const playbackId = m[1];

  // Find or update video_ads row.
  const { data: existing } = await supabase
    .from('video_ads')
    .select('id')
    .eq('mux_playback_id', playbackId)
    .maybeSingle();

  const row = {
    title: 'Top Dawg Law',
    mux_playback_id: playbackId,
    ad_type: 'pre_roll',
    duration: 30,
    cta_text: 'Get the legal team that fights for you.',
    cta_url: 'https://app.topdoglaw.com',
    is_active: true,
  };

  if (existing?.id) {
    await supabase.from('video_ads').update(row).eq('id', existing.id);
    console.log(`  ✓ updated video_ads row for ${playbackId}`);
  } else {
    const { error } = await supabase.from('video_ads').insert(row);
    if (error) throw error;
    console.log(`  ✓ inserted video_ads row for ${playbackId}`);
  }
}

// ─── Live TV (24/7 simulated loop) ─────────────────────────────────────────

async function seedLiveTV() {
  console.log('\n=== Live TV (simulated 24/7 loop) ===');

  // Get Culture owner so the live channel is owned by the same creator.
  const { data: owner } = await supabase
    .from('profiles')
    .select('id, city_id')
    .eq('handle', 'culture')
    .maybeSingle();
  if (!owner) {
    console.error('  ! culture profile not found — run knect-tv first');
    return;
  }

  // Find the 4 ready VOD videos to loop. Skip subscriber/PPV-only here so
  // the public live stream stays free.
  const { data: videos, error: vErr } = await supabase
    .from('channel_videos')
    .select('id, title, duration, mux_playback_id, channel:channels!inner(owner_id)')
    .eq('is_published', true)
    .eq('status', 'ready')
    .not('mux_playback_id', 'is', null)
    .order('created_at');
  if (vErr) throw vErr;
  const culture = (videos ?? []).filter((v) => v.channel?.owner_id === owner.id);
  if (culture.length === 0) {
    console.error('  ! no Culture VOD videos found');
    return;
  }
  console.log(`  → looping ${culture.length} videos`);

  // Create or update the live channel.
  const LIVE_SLUG = 'knect-tv-live'; // hardcoded in src/app/(main)/live/page.tsx
  const { data: existingCh } = await supabase
    .from('channels')
    .select('id')
    .eq('slug', LIVE_SLUG)
    .maybeSingle();
  let liveChannelId;
  const liveRow = {
    slug: LIVE_SLUG,
    name: 'Culture TV',
    description: 'The 24/7 Culture broadcast — film, music, comedy on a loop.',
    type: 'media',
    scope: 'national',
    content_scope: 'national',
    is_active: true,
    is_verified: true,
    is_live_simulated: true,
    owner_id: owner.id,
  };
  if (existingCh?.id) {
    liveChannelId = existingCh.id;
    await supabase.from('channels').update(liveRow).eq('id', liveChannelId);
    console.log(`  · live channel ${LIVE_SLUG} updated`);
  } else {
    const { data: ins, error } = await supabase.from('channels').insert(liveRow).select('id').single();
    if (error) throw error;
    liveChannelId = ins.id;
    console.log(`  ✓ live channel ${LIVE_SLUG} created`);
  }

  // Wipe existing schedule for this channel and rebuild a fresh 14-day loop.
  await supabase.from('scheduled_broadcasts').delete().eq('channel_id', liveChannelId);

  const FOURTEEN_DAYS = 14 * 24 * 60 * 60; // seconds
  // Round start to current minute so the first slot lines up cleanly.
  const start = new Date();
  start.setSeconds(0, 0);
  let cursor = start.getTime();
  const endByMs = cursor + FOURTEEN_DAYS * 1000;
  let position = 0;
  const rows = [];
  while (cursor < endByMs) {
    const v = culture[position % culture.length];
    const dur = Math.max(60, Math.round(Number(v.duration) || 600)); // seconds
    const startsAt = new Date(cursor).toISOString();
    const endsAt = new Date(cursor + dur * 1000).toISOString();
    rows.push({
      channel_id: liveChannelId,
      video_id: v.id,
      starts_at: startsAt,
      ends_at: endsAt,
      position,
      is_ad_slot: false,
    });
    cursor += dur * 1000;
    position++;
  }
  // Insert in chunks (Supabase has request size limits).
  const CHUNK = 200;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK);
    const { error } = await supabase.from('scheduled_broadcasts').insert(slice);
    if (error) throw error;
  }
  console.log(`  ✓ scheduled ${rows.length} slots over the next 14 days`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
const t0 = Date.now();
try {
  if (wants('thumbs')) await seedThumbnails();
  if (wants('biz')) await seedBizExtras();
  if (wants('videoad')) await seedVideoAd();
  if (wants('livetv')) await seedLiveTV();
} catch (e) {
  console.error('\nExtras failed:', e?.stack || e);
  process.exit(1);
}
const dt = Math.round((Date.now() - t0) / 1000);
console.log(`\nDone in ${dt}s.`);
