#!/usr/bin/env node
// Deletes every Mux video asset in the connected Mux account. Mux is
// account-scoped (shared between old and new Supabase projects).
//
// Live streams are not auto-deleted — they're a different resource type and
// we only have one or two configured by hand. We list and report them but
// leave them alone unless --include-live is passed.
//
// Idempotent: re-running on an empty account is a no-op.

import Mux from '@mux/mux-node';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const tokenId = process.env.MUX_TOKEN_ID;
const tokenSecret = process.env.MUX_TOKEN_SECRET;
if (!tokenId || !tokenSecret) {
  console.error('Missing MUX_TOKEN_ID / MUX_TOKEN_SECRET');
  process.exit(1);
}

const mux = new Mux({ tokenId, tokenSecret });

const includeLive = process.argv.includes('--include-live');

let totalAssets = 0;
let deletedAssets = 0;
let failedAssets = 0;

console.log('Listing Mux assets…');

// Mux v12 SDK returns a PagePromise that auto-paginates with for await.
const allAssetIds = [];
for await (const a of mux.video.assets.list({ limit: 100 })) {
  allAssetIds.push(a.id);
}

totalAssets = allAssetIds.length;
console.log(`Found ${totalAssets} asset(s). Deleting…`);

for (const id of allAssetIds) {
  try {
    await mux.video.assets.delete(id);
    console.log(`  ✓ ${id}`);
    deletedAssets++;
  } catch (e) {
    console.error(`  ✗ ${id}: ${e?.message || e}`);
    failedAssets++;
  }
}

// Report live streams.
const liveList = [];
for await (const ls of mux.video.liveStreams.list({ limit: 100 })) {
  liveList.push(ls);
}

console.log(`\nLive streams found: ${liveList.length}`);
if (liveList.length > 0 && !includeLive) {
  console.log('  (run with --include-live to delete them too)');
  for (const ls of liveList) {
    console.log(`  · ${ls.id} status=${ls.status}`);
  }
} else if (includeLive) {
  for (const ls of liveList) {
    try {
      await mux.video.liveStreams.delete(ls.id);
      console.log(`  ✓ live ${ls.id}`);
    } catch (e) {
      console.error(`  ✗ live ${ls.id}: ${e?.message || e}`);
    }
  }
}

console.log(`\nDone. assets total=${totalAssets} deleted=${deletedAssets} failed=${failedAssets}`);
process.exit(failedAssets > 0 ? 1 : 0);
