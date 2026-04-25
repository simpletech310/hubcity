#!/usr/bin/env node
// Creates every storage bucket the app expects on the NEW Supabase project.
// Most RLS policies are applied by the SQL migrations themselves; this just
// ensures the buckets physically exist.
//
// Idempotent: createBucket returns "already exists" → ignored.

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

// Public buckets used by the app. Project migrations create them with the
// correct file size limits — we only ensure they exist. No fileSizeLimit set
// here so the script doesn't conflict with project-level caps.
const BUCKETS = [
  { name: 'profile-avatars',   public: true },
  { name: 'profile-covers',    public: true },
  { name: 'post-images',       public: true },
  { name: 'post-videos',       public: true },
  { name: 'group-media',       public: true },
  { name: 'reels',             public: true },
  { name: 'media',             public: true },
  { name: 'business-images',   public: true },
  { name: 'audio-art',         public: true },
  { name: 'menu-item-images',  public: true },
  { name: 'show-posters',      public: true },
  { name: 'resumes',           public: false },
];

let created = 0;
let existed = 0;
let failed = 0;

for (const cfg of BUCKETS) {
  const { error } = await supabase.storage.createBucket(cfg.name, {
    public: cfg.public,
    fileSizeLimit: cfg.fileSizeLimit ?? undefined,
  });
  if (!error) {
    console.log(`  ✓ ${cfg.name}: created`);
    created++;
    continue;
  }
  // Supabase JS surfaces "Bucket already exists" or 409 — accept both.
  const msg = String(error?.message || error);
  if (/already exists/i.test(msg) || error?.statusCode === '409') {
    console.log(`  · ${cfg.name}: already exists`);
    existed++;
  } else {
    console.error(`  ✗ ${cfg.name}: ${msg}`);
    failed++;
  }
}

console.log(`\nBuckets: created=${created} existed=${existed} failed=${failed}`);
process.exit(failed > 0 ? 1 : 0);
