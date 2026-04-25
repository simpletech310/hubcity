/**
 * List all Mux assets (read-only).
 * Pulls credentials from .env.local in cwd.
 */
import { readFileSync } from 'fs';

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
if (!TOKEN_ID || !TOKEN_SECRET) {
  console.error('Missing MUX_TOKEN_ID or MUX_TOKEN_SECRET in .env.local');
  process.exit(1);
}

const AUTH = Buffer.from(`${TOKEN_ID}:${TOKEN_SECRET}`).toString('base64');
const headers = { Authorization: `Basic ${AUTH}` };

async function muxGet(path) {
  const res = await fetch(`https://api.mux.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status} ${await res.text()}`);
  return res.json();
}

async function listAllAssets() {
  const all = [];
  let page = 1;
  while (true) {
    const data = await muxGet(`/video/v1/assets?limit=100&page=${page}`);
    if (!data.data || !data.data.length) break;
    all.push(...data.data);
    if (data.data.length < 100) break;
    page++;
  }
  return all;
}

function fmtDate(ts) { return new Date(parseInt(ts) * 1000).toISOString().split('T')[0]; }
function fmtDur(s) { if (!s) return 'N/A'; const m = Math.floor(s/60); const x = Math.round(s%60); return `${m}m${x}s`; }

const assets = await listAllAssets();
console.log(`Total assets in Mux account: ${assets.length}\n`);
assets.sort((a, b) => parseInt(a.created_at) - parseInt(b.created_at));
for (const a of assets) {
  const pb = a.playback_ids?.[0]?.id || 'none';
  const aspect = a.aspect_ratio || (a.max_stored_resolution || 'audio?');
  console.log(`${a.id} | pb=${pb} | ${a.status.padEnd(8)} | ${fmtDur(a.duration).padEnd(8)} | ${aspect.padEnd(8)} | ${fmtDate(a.created_at)}`);
}
console.log(`\n=> ${assets.length} of 10 used`);
