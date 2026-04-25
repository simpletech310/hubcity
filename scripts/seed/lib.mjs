// Shared seed helpers: clients, file upload, auth user creation, slugify.

import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());

import { createClient } from '@supabase/supabase-js';
import Mux from '@mux/mux-node';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing Supabase env');
  process.exit(1);
}

if (!SUPABASE_URL.includes('fahqtnwwikvocpvvfgqi')) {
  console.error(`Refusing to run: SUPABASE_URL must point at the new project. Got: ${SUPABASE_URL}`);
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const mux = (() => {
  if (!process.env.MUX_TOKEN_ID || !process.env.MUX_TOKEN_SECRET) return null;
  return new Mux({
    tokenId: process.env.MUX_TOKEN_ID,
    tokenSecret: process.env.MUX_TOKEN_SECRET,
  });
})();

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function shortHash(s, n = 6) {
  return crypto.createHash('sha1').update(s).digest('hex').slice(0, n);
}

const MIME = {
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.gif':  'image/gif',
  '.bmp':  'image/bmp',
  '.heic': 'image/heic',
  '.svg':  'image/svg+xml',
  '.mp4':  'video/mp4',
  '.mov':  'video/quicktime',
  '.m4v':  'video/x-m4v',
  '.mp3':  'audio/mpeg',
  '.m4a':  'audio/mp4',
};

export function mimeFor(p) {
  return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

let uploadsThisRun = 0;

// Skip bmp — Supabase storage rejects them by mime type. The seed
// just falls back to no asset rather than failing the row.
const UNSUPPORTED_EXTS = new Set(['.bmp']);
// Project-level upload cap is 50 MB. Skip larger files with a warning.
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
let skippedLarge = 0;

/**
 * Upload a local file to a Supabase storage bucket. Returns the public URL,
 * or null if the file extension is unsupported or the file is too large.
 * Idempotent and retries once on transient errors (e.g. Gateway Timeout).
 */
export async function uploadFile(localPath, bucket, key) {
  if (UNSUPPORTED_EXTS.has(path.extname(localPath).toLowerCase())) {
    return null;
  }
  const stat = fs.statSync(localPath);
  if (stat.size > MAX_UPLOAD_BYTES) {
    skippedLarge++;
    console.log(`  ⤷ skip ${path.basename(localPath)} (${(stat.size / 1024 / 1024).toFixed(1)} MB > 50 MB cap)`);
    return null;
  }
  const buf = fs.readFileSync(localPath);
  const contentType = mimeFor(localPath);

  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(key, buf, {
      contentType,
      upsert: false,
    });
    if (!error || /already exists|duplicate/i.test(error.message)) {
      uploadsThisRun++;
      const { data } = supabase.storage.from(bucket).getPublicUrl(key);
      return data.publicUrl;
    }
    if (/timeout|gateway|503|502/i.test(error.message)) {
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      continue;
    }
    throw new Error(`upload ${bucket}/${key}: ${error.message}`);
  }
  throw new Error(`upload ${bucket}/${key}: exhausted retries`);
}

export function getUploadCount() { return uploadsThisRun; }
export function getSkippedLarge() { return skippedLarge; }

/**
 * Create a Supabase auth user + profile. Idempotent: re-uses existing user if
 * the email is already taken (looks up by email).
 *
 * Returns the profile row.
 */
export async function createUserWithProfile({
  email,
  password = 'HubCity1!',
  handle,
  displayName,
  role = 'content_creator',
  cityId = null,
  cityName = null,
  avatarUrl = null,
  coverUrl = null,
  bio = null,
  isCreator = true,
  followerCount = 0,
  websiteUrl = null,
  socialLinks = {},
}) {
  // Check if user already exists by email.
  const existingByHandle = await supabase
    .from('profiles')
    .select('id, handle')
    .eq('handle', handle)
    .maybeSingle();
  if (existingByHandle.data?.id) {
    // Update mutable fields.
    await supabase.from('profiles').update({
      display_name: displayName,
      avatar_url: avatarUrl,
      cover_url: coverUrl,
      bio,
      city_id: cityId,
      ...(cityName ? { city: cityName } : {}),
      is_creator: isCreator,
      follower_count: followerCount,
      website_url: websiteUrl,
      social_links: socialLinks,
    }).eq('id', existingByHandle.data.id);
    return { id: existingByHandle.data.id, handle };
  }

  // Try to find by email in auth.
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existingAuth = list?.users?.find?.((u) => u.email?.toLowerCase() === email.toLowerCase());
  let userId = existingAuth?.id;

  if (!userId) {
    const { data: created, error: cErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName, handle },
    });
    if (cErr) throw new Error(`createUser ${email}: ${cErr.message}`);
    userId = created.user.id;
  }

  // Upsert profile.
  const { error: pErr } = await supabase.from('profiles').upsert({
    id: userId,
    display_name: displayName,
    handle,
    role,
    city_id: cityId,
    ...(cityName ? { city: cityName } : {}),
    avatar_url: avatarUrl,
    cover_url: coverUrl,
    bio,
    is_creator: isCreator,
    creator_approved_at: isCreator ? new Date().toISOString() : null,
    follower_count: followerCount,
    website_url: websiteUrl,
    social_links: socialLinks,
    onboarding_completed: true,
  }, { onConflict: 'id' });
  if (pErr) throw new Error(`upsert profile ${handle}: ${pErr.message}`);

  return { id: userId, handle };
}

/**
 * Upload a file to Mux and poll until the asset is `ready`. Returns
 * { asset_id, playback_id, duration_seconds }.
 */
export async function uploadToMux(localPath, { audioOnly = false, label = '' } = {}) {
  if (!mux) throw new Error('Mux client not configured');
  const buf = fs.readFileSync(localPath);

  const upload = await mux.video.uploads.create({
    cors_origin: '*',
    new_asset_settings: {
      playback_policy: ['public'],
      encoding_tier: 'baseline',
      ...(audioOnly ? { audio_only: true } : {}),
    },
  });

  const url = upload.url;
  // Use Node's fetch to PUT binary.
  const putRes = await fetch(url, {
    method: 'PUT',
    body: buf,
    headers: { 'Content-Type': mimeFor(localPath) },
  });
  if (!putRes.ok) {
    throw new Error(`Mux PUT failed (${label}): ${putRes.status} ${await putRes.text()}`);
  }

  // Poll the upload → asset_id.
  let assetId = null;
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const u = await mux.video.uploads.retrieve(upload.id);
    if (u.asset_id) { assetId = u.asset_id; break; }
    if (u.status === 'errored' || u.status === 'cancelled') {
      throw new Error(`Mux upload ${label} ${u.status}`);
    }
  }
  if (!assetId) throw new Error(`Mux upload ${label} timed out before asset created`);

  // Poll asset → ready.
  let asset = null;
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    asset = await mux.video.assets.retrieve(assetId);
    if (asset.status === 'ready') break;
    if (asset.status === 'errored') {
      throw new Error(`Mux asset ${label} errored`);
    }
  }
  if (asset?.status !== 'ready') throw new Error(`Mux asset ${label} not ready`);

  const playbackId = asset.playback_ids?.[0]?.id;
  if (!playbackId) throw new Error(`Mux asset ${label} has no playback id`);

  return {
    asset_id: assetId,
    playback_id: playbackId,
    duration_seconds: Math.round(asset.duration ?? 0),
  };
}

/** Get city UUID by slug. */
export async function getCityIdBySlug(slug) {
  const { data, error } = await supabase.from('cities').select('id').eq('slug', slug).maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

/** List files in a folder, filtered by extensions. */
export function listFiles(dir, exts) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => exts.some((e) => f.toLowerCase().endsWith(e)))
    .map((f) => path.join(dir, f));
}

/** Pick first matching file (for avatar selection). */
export function firstFile(dir, exts) {
  return listFiles(dir, exts)[0] ?? null;
}
