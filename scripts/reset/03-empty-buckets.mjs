#!/usr/bin/env node
// Removes all objects from every Supabase storage bucket. Buckets themselves
// are preserved. Idempotent.

import { createClient } from '@supabase/supabase-js';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing SUPABASE env');
  process.exit(1);
}

if (!SUPABASE_URL.includes('fahqtnwwikvocpvvfgqi')) {
  console.error(`Refusing to run: SUPABASE_URL must point at the new project. Got: ${SUPABASE_URL}`);
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: buckets, error } = await supabase.storage.listBuckets();
if (error) {
  console.error('Failed to list buckets:', error);
  process.exit(1);
}

let totalRemoved = 0;

async function emptyFolder(bucket, prefix = '') {
  let removedHere = 0;
  // listrecursive=true is not supported; recurse manually.
  const { data: entries, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error) {
    console.error(`  ! ${bucket}/${prefix} list failed: ${error.message}`);
    return 0;
  }
  if (!entries || entries.length === 0) return 0;

  // Files (entries with id !== null are files in newer SDK; fall back to checking metadata)
  const files = [];
  const folders = [];
  for (const e of entries) {
    if (e.id === null || e.metadata === null) {
      folders.push(e.name);
    } else {
      files.push(prefix ? `${prefix}/${e.name}` : e.name);
    }
  }

  if (files.length > 0) {
    const { error: rmErr } = await supabase.storage.from(bucket).remove(files);
    if (rmErr) {
      console.error(`  ! ${bucket} remove failed: ${rmErr.message}`);
    } else {
      removedHere += files.length;
    }
  }
  for (const f of folders) {
    removedHere += await emptyFolder(bucket, prefix ? `${prefix}/${f}` : f);
  }
  return removedHere;
}

for (const b of buckets) {
  const removed = await emptyFolder(b.name);
  console.log(`  ✓ ${b.name}: removed ${removed} object(s)`);
  totalRemoved += removed;
}

console.log(`\nTotal removed: ${totalRemoved}`);
