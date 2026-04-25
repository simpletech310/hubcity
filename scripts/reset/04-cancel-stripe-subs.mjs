#!/usr/bin/env node
// Cancel any active Stripe subscriptions still recorded in the (now-wiped)
// channel_subscriptions table. After running 02-wipe-db.sql there should be
// none — this is defensive.

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SERVICE_KEY || !STRIPE_KEY) {
  console.error('Missing env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-11-20.acacia' });

const { data: subs, error } = await supabase
  .from('channel_subscriptions')
  .select('id, stripe_subscription_id, status')
  .eq('status', 'active')
  .not('stripe_subscription_id', 'is', null);

if (error) {
  console.error('Read failed:', error);
  process.exit(1);
}

if (subs.length === 0) {
  console.log('No active subscriptions to cancel.');
  process.exit(0);
}

for (const sub of subs) {
  try {
    await stripe.subscriptions.cancel(sub.stripe_subscription_id);
    console.log(`  ✓ ${sub.stripe_subscription_id}`);
  } catch (e) {
    if (e?.code === 'resource_missing') continue;
    console.error(`  ✗ ${sub.stripe_subscription_id}: ${e?.message}`);
  }
}
