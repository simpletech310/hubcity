#!/usr/bin/env node
// Reset orchestrator. Runs:
//   1. Mux purge        (account-scoped)
//   2. Wipe DB rows     (TRUNCATE all public tables except reference data + DELETE auth.users)
//   3. Empty buckets    (remove all storage objects, keep bucket configs)
//   4. Cancel Stripe    (defensive — should be 0 after the wipe)
//   5. Ensure buckets   (idempotent — creates any missing buckets)

import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const HERE = path.dirname(fileURLToPath(import.meta.url));

const STEPS = [
  { label: '1. Purge Mux assets',         cmd: ['node', path.join(HERE, '01-purge-mux.mjs')] },
  { label: '2. Wipe DB rows',             cmd: ['bash', path.join(HERE, '02-wipe-db.sh')] },
  { label: '3. Empty storage buckets',    cmd: ['node', path.join(HERE, '03-empty-buckets.mjs')] },
  { label: '4. Cancel any leftover subs', cmd: ['node', path.join(HERE, '04-cancel-stripe-subs.mjs')] },
  { label: '5. Ensure buckets exist',     cmd: ['node', path.join(HERE, '05-ensure-buckets.mjs')] },
];

const skip = process.argv.includes('--yes');

if (!skip) {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log('\nThis will:');
  console.log('  · DELETE every Mux video asset (account-wide)');
  console.log('  · TRUNCATE every public-schema table on the new Supabase project except reference data (cities, audio_genres, …)');
  console.log('  · DELETE every Supabase auth.users record');
  console.log('  · REMOVE every object from every storage bucket');
  console.log('  · Cancel any leftover Stripe subscriptions');
  console.log('\nThis is destructive. Type "RESET" to continue:');
  const ans = (await rl.question('> ')).trim();
  rl.close();
  if (ans !== 'RESET') {
    console.log('Aborted.');
    process.exit(0);
  }
}

function run(cmd) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd[0], cmd.slice(1), {
      stdio: 'inherit',
      env: process.env,
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`exit ${code}`));
    });
  });
}

for (const step of STEPS) {
  console.log(`\n─── ${step.label} ───`);
  try {
    await run(step.cmd);
  } catch (e) {
    console.error(`\nStep failed: ${step.label}`);
    console.error(e?.message || e);
    process.exit(1);
  }
}

console.log('\nReset complete. Project is empty and ready for seeding.');
