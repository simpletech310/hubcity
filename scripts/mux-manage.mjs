/**
 * Mux Asset Management Script
 * Lists all assets, identifies oldest 4, deletes them to free up slots.
 */

const MUX_TOKEN_ID = 'a9b71f93-1893-4c1f-9766-61c6c0277f2b';
const MUX_TOKEN_SECRET = 'oKjxTigBfYMsPQj5Os8J8/kpWUYmRj1N634/S0XUodKczfXBy8TtaYFnDR4rjO0KvB5QIUTZmHv';

const AUTH = Buffer.from(`${MUX_TOKEN_ID}:${MUX_TOKEN_SECRET}`).toString('base64');

const headers = {
  'Authorization': `Basic ${AUTH}`,
  'Content-Type': 'application/json',
};

async function muxGet(path) {
  const res = await fetch(`https://api.mux.com${path}`, { headers });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

async function muxDelete(path) {
  const res = await fetch(`https://api.mux.com${path}`, { method: 'DELETE', headers });
  if (!res.ok) throw new Error(`DELETE ${path} failed: ${res.status} ${await res.text()}`);
  return res.status;
}

async function listAllAssets() {
  let allAssets = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await muxGet(`/video/v1/assets?limit=100&page=${page}`);
    allAssets = allAssets.concat(data.data);
    hasMore = data.data.length === 100;
    page++;
  }
  return allAssets;
}

function formatDate(ts) {
  return new Date(parseInt(ts) * 1000).toISOString().split('T')[0];
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// --- Main ---
async function main() {
  console.log('=== Fetching all Mux assets ===\n');

  const assets = await listAllAssets();
  console.log(`Total assets found: ${assets.length}\n`);

  // Sort by created_at ascending (oldest first)
  assets.sort((a, b) => parseInt(a.created_at) - parseInt(b.created_at));

  // Display all assets
  console.log('ID                           | Playback ID                  | Status  | Duration | Created');
  console.log('-'.repeat(110));
  for (const a of assets) {
    const pbId = a.playback_ids?.[0]?.id || 'none';
    console.log(
      `${a.id} | ${pbId.padEnd(28)} | ${a.status.padEnd(7)} | ${formatDuration(a.duration).padEnd(8)} | ${formatDate(a.created_at)}`
    );
  }

  if (assets.length <= 6) {
    console.log(`\nOnly ${assets.length} assets exist. No deletion needed.`);
    return;
  }

  // Identify 4 oldest to delete
  const toDelete = assets.slice(0, 4);
  console.log(`\n=== Deleting 4 oldest assets ===\n`);

  for (const a of toDelete) {
    const pbId = a.playback_ids?.[0]?.id || 'none';
    console.log(`Deleting: ${a.id} (playback: ${pbId}, created: ${formatDate(a.created_at)})`);
    const status = await muxDelete(`/video/v1/assets/${a.id}`);
    console.log(`  -> Deleted (HTTP ${status})`);
  }

  // Verify remaining
  console.log('\n=== Verifying remaining assets ===\n');
  const remaining = await listAllAssets();
  console.log(`Remaining assets: ${remaining.length}`);

  if (remaining.length === 6) {
    console.log('SUCCESS: 6 assets remain. 4 slots are now free (10-slot free plan).');
  } else {
    console.log(`WARNING: Expected 6 remaining, got ${remaining.length}.`);
  }

  console.log('\nRemaining assets:');
  remaining.sort((a, b) => parseInt(a.created_at) - parseInt(b.created_at));
  for (const a of remaining) {
    const pbId = a.playback_ids?.[0]?.id || 'none';
    console.log(`  ${a.id} | ${pbId} | ${formatDate(a.created_at)}`);
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
