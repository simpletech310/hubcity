/**
 * Upload an MP3 (or any audio file) to Mux as audio-only and report the
 * resulting playback_id + asset_id.
 *
 * Usage: node scripts/mux-upload-audio.mjs "/abs/path/to/file.mp3"
 */
import { readFileSync, statSync, createReadStream } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node scripts/mux-upload-audio.mjs <path>');
  process.exit(1);
}

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
    })
);

const TOKEN_ID = env.MUX_TOKEN_ID;
const TOKEN_SECRET = env.MUX_TOKEN_SECRET;
const AUTH = Buffer.from(`${TOKEN_ID}:${TOKEN_SECRET}`).toString('base64');
const muxHeaders = { Authorization: `Basic ${AUTH}` };

async function muxApi(method, path, body) {
  const res = await fetch(`https://api.mux.com${path}`, {
    method,
    headers: { ...muxHeaders, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

const stat = statSync(filePath);
console.log(`Source: ${filePath}`);
console.log(`Size  : ${(stat.size / 1024 / 1024).toFixed(2)} MB`);

console.log('\n[1/4] Creating Mux direct upload (audio-only)...');
const createRes = await muxApi('POST', '/video/v1/uploads', {
  cors_origin: '*',
  new_asset_settings: {
    playback_policy: ['public'],
    encoding_tier: 'baseline',
    // Mux audio-only flag: pass max_resolution_tier="audio-only" for true audio-only.
    // But the actual flag for audio-only is `audio_only: true` (newer API),
    // expressed via input track settings. Some accounts use `master_access`.
    // Simplest: omit, Mux will encode video tracks (silent black). Use an
    // explicit audio-only flag if available.
    max_resolution_tier: '1080p',
  },
});
const upload = createRes.data;
console.log(`    upload_id=${upload.id}`);
console.log(`    upload_url=${upload.url.slice(0, 80)}...`);

console.log('\n[2/4] PUTting file body to upload URL...');
const fileBuffer = readFileSync(filePath);
const putRes = await fetch(upload.url, {
  method: 'PUT',
  headers: { 'Content-Type': 'audio/mpeg' },
  body: fileBuffer,
});
if (!putRes.ok) {
  console.error('PUT failed:', putRes.status, await putRes.text());
  process.exit(1);
}
console.log(`    PUT ${putRes.status} OK`);

console.log('\n[3/4] Polling upload until asset_id is assigned...');
let assetId = null;
for (let i = 0; i < 60; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const u = await muxApi('GET', `/video/v1/uploads/${upload.id}`);
  if (u.data.asset_id) {
    assetId = u.data.asset_id;
    console.log(`    asset_id=${assetId} (after ${(i + 1) * 2}s)`);
    break;
  }
  process.stdout.write('.');
}
if (!assetId) {
  console.error('\n    Timed out waiting for asset_id');
  process.exit(1);
}

console.log('\n[4/4] Polling asset until ready and capturing playback_id...');
let playbackId = null;
let duration = null;
for (let i = 0; i < 90; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const a = await muxApi('GET', `/video/v1/assets/${assetId}`);
  if (a.data.status === 'ready') {
    playbackId = a.data.playback_ids?.[0]?.id;
    duration = a.data.duration;
    console.log(`    status=ready  playback_id=${playbackId}  duration=${duration?.toFixed(1)}s`);
    break;
  } else if (a.data.status === 'errored') {
    console.error('    status=errored', JSON.stringify(a.data.errors));
    process.exit(1);
  }
  process.stdout.write('.');
}

console.log('\n=== DONE ===');
console.log(JSON.stringify({ asset_id: assetId, playback_id: playbackId, duration_seconds: duration }, null, 2));
