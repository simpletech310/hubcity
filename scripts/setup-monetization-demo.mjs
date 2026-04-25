/* eslint-disable no-console */
/**
 * Setup demo monetization for FREQUENCY + ON AIR.
 *
 * What it does (idempotent — safe to re-run):
 *   1. Picks one demo creator (`kevonstage`) and ensures their profile is creator.
 *   2. Creates a Stripe Custom Connect account in test mode with prefilled data
 *      so it auto-becomes `charges_enabled: true` (no human onboarding needed).
 *   3. Inserts/updates `creator_stripe_accounts` for that creator.
 *   4. Creates a Stripe Product + monthly Price ($4.99/mo) and saves the
 *      Stripe IDs on the channel (`subscription_stripe_*`).
 *   5. Marks one of their videos as PPV ($2.99) — viewers must purchase it.
 *   6. Assigns the "Westside Gold" demo album to the same channel and gates
 *      it as `subscribers`-only.
 *   7. Assigns the "Compton Daily" demo podcast (3 episodes) to the same
 *      channel — audio paywall checks `channel_id` + sub status.
 *
 * Test cards (Stripe test mode):
 *   4242 4242 4242 4242 — succeeds
 *   any future expiry, any CVC, any ZIP.
 *
 * Run: node scripts/setup-monetization-demo.mjs
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Stripe from "stripe";

// --- Load env --------------------------------------------------------------
function loadEnv() {
  const txt = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  const env = {};
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"(.*)"$/, "$1");
  }
  return env;
}
const env = loadEnv();
const STRIPE_KEY = env.STRIPE_SECRET_KEY;
const SUPA_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_SVC = env.SUPABASE_SERVICE_ROLE_KEY;
if (!STRIPE_KEY?.startsWith("sk_test_")) {
  console.error("Refusing to run with non-test Stripe key.");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_KEY);

// Demo target — Kevon Stage channel + owner profile.
const CREATOR_ID = "f9c08811-1697-4e04-86de-924b29ef5a45";
const CHANNEL_ID = "e2fd5304-a57a-4a7a-b95c-5dbe94e2de42";
const PPV_VIDEO_ID = "812e8bf0-58b7-468a-8c88-b42deb5fcf86"; // "Marriage Memos"
const SUBS_ALBUM_SLUG = "westside-gold";
const SUBS_PODCAST_SLUG = "compton-daily";

const SUB_PRICE_CENTS = 499;
const PPV_PRICE_CENTS = 299;

// --- REST helpers ----------------------------------------------------------
async function sb(method, path, body) {
  const r = await fetch(`${SUPA_URL}/rest/v1${path}`, {
    method,
    headers: {
      apikey: SUPA_SVC,
      Authorization: `Bearer ${SUPA_SVC}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`Supabase ${method} ${path} → ${r.status} ${txt}`);
  }
  return r.json();
}

async function upsert(path, body, onConflict) {
  const url = onConflict ? `${path}?on_conflict=${onConflict}` : path;
  const r = await fetch(`${SUPA_URL}/rest/v1${url}`, {
    method: "POST",
    headers: {
      apikey: SUPA_SVC,
      Authorization: `Bearer ${SUPA_SVC}`,
      "Content-Type": "application/json",
      Prefer: "return=representation,resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`upsert ${path} → ${r.status} ${txt}`);
  }
  return r.json();
}

// --- 1. Ensure creator profile + connect account ---------------------------
async function ensureConnectAccount() {
  // Look up an existing row.
  const existing = await sb(
    "GET",
    `/creator_stripe_accounts?creator_id=eq.${CREATOR_ID}&select=stripe_account_id,charges_enabled`
  );

  if (existing.length && existing[0].charges_enabled) {
    console.log("✓ Connect account already live:", existing[0].stripe_account_id);
    return existing[0].stripe_account_id;
  }

  // Create a Custom test-mode account with all prefills → charges_enabled becomes true.
  const acct = await stripe.accounts.create({
    type: "custom",
    country: "US",
    email: "kevonstage+demo@hubcity.app",
    business_type: "individual",
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      mcc: "7929", // bands & entertainment
      url: "https://hubcity.app/live/channel/kevonstage",
      product_description: "Comedy channel subscriptions and pay-per-view specials.",
    },
    individual: {
      first_name: "Kevon",
      last_name: "Stage",
      email: "kevonstage+demo@hubcity.app",
      phone: "+14155551234",
      dob: { day: 1, month: 1, year: 1990 },
      address: {
        line1: "address_full_match", // Stripe test magic value
        city: "Compton",
        state: "CA",
        postal_code: "90220",
        country: "US",
      },
      ssn_last_4: "0000",
      id_number: "000000000",
    },
    tos_acceptance: {
      date: Math.floor(Date.now() / 1000),
      ip: "8.8.8.8",
    },
    external_account: {
      object: "bank_account",
      country: "US",
      currency: "usd",
      routing_number: "110000000",
      account_number: "000123456789",
      account_holder_name: "Kevon Stage",
      account_holder_type: "individual",
    },
  });

  // Re-retrieve to confirm charges_enabled.
  const fresh = await stripe.accounts.retrieve(acct.id);
  console.log(
    `✓ Connect account ${fresh.id} — charges_enabled=${fresh.charges_enabled}, payouts_enabled=${fresh.payouts_enabled}`
  );

  await upsert(
    "/creator_stripe_accounts",
    {
      creator_id: CREATOR_ID,
      stripe_account_id: fresh.id,
      onboarding_complete: !!fresh.details_submitted,
      charges_enabled: !!fresh.charges_enabled,
      payouts_enabled: !!fresh.payouts_enabled,
    },
    "creator_id"
  );

  return fresh.id;
}

// --- 2. Channel subscription Product + Price ------------------------------
async function ensureSubscriptionPrice() {
  const channelRows = await sb(
    "GET",
    `/channels?id=eq.${CHANNEL_ID}&select=id,name,subscription_stripe_product_id,subscription_stripe_price_id,subscription_price_cents`
  );
  const channel = channelRows[0];
  if (!channel) throw new Error("Demo channel not found");

  if (
    channel.subscription_stripe_price_id &&
    channel.subscription_price_cents === SUB_PRICE_CENTS
  ) {
    console.log("✓ Channel sub price already set:", channel.subscription_stripe_price_id);
    return channel.subscription_stripe_price_id;
  }

  let productId = channel.subscription_stripe_product_id;
  if (!productId) {
    const product = await stripe.products.create({
      name: `${channel.name} — Channel Subscription`,
      metadata: { channel_id: CHANNEL_ID, demo: "true" },
    });
    productId = product.id;
  }

  const price = await stripe.prices.create({
    product: productId,
    unit_amount: SUB_PRICE_CENTS,
    currency: "usd",
    recurring: { interval: "month" },
    metadata: { channel_id: CHANNEL_ID, demo: "true" },
  });

  await sb("PATCH", `/channels?id=eq.${CHANNEL_ID}`, {
    subscription_price_cents: SUB_PRICE_CENTS,
    subscription_currency: "usd",
    subscription_stripe_product_id: productId,
    subscription_stripe_price_id: price.id,
  });
  console.log(`✓ Channel sub price set: ${price.id} ($${(SUB_PRICE_CENTS / 100).toFixed(2)}/mo)`);
  return price.id;
}

// --- 3. Mark video as PPV --------------------------------------------------
async function gateVideoAsPpv() {
  await sb("PATCH", `/channel_videos?id=eq.${PPV_VIDEO_ID}`, {
    access_type: "ppv",
    is_premium: true,
    price_cents: PPV_PRICE_CENTS,
  });
  console.log(`✓ Video ${PPV_VIDEO_ID} marked PPV @ $${(PPV_PRICE_CENTS / 100).toFixed(2)}`);
}

// --- 4. Gate one demo album as subscribers --------------------------------
async function gateAlbumAsSubscribers() {
  const albums = await sb(
    "GET",
    `/albums?slug=eq.${SUBS_ALBUM_SLUG}&select=id,title`
  );
  if (!albums.length) {
    console.warn(`! Album ${SUBS_ALBUM_SLUG} not found — skipping`);
    return;
  }
  const album = albums[0];
  await sb("PATCH", `/albums?id=eq.${album.id}`, {
    channel_id: CHANNEL_ID,
    creator_id: CREATOR_ID,
    access_type: "subscribers",
  });
  // Tracks should inherit the channel for the audio access gate.
  await sb("PATCH", `/tracks?album_id=eq.${album.id}`, {
    channel_id: CHANNEL_ID,
    creator_id: CREATOR_ID,
  });
  console.log(`✓ Album "${album.title}" → subscribers-only on channel ${CHANNEL_ID}`);
}

// --- 5. Gate one demo podcast as subscribers ------------------------------
async function gatePodcastAsSubscribers() {
  // No access_type column on podcasts; we honor channel_id + channel.has_sub.
  const eps = await sb(
    "GET",
    `/podcasts?show_slug=eq.${SUBS_PODCAST_SLUG}&select=id,title`
  );
  if (!eps.length) {
    console.warn(`! Podcast ${SUBS_PODCAST_SLUG} not found — skipping`);
    return;
  }
  await sb("PATCH", `/podcasts?show_slug=eq.${SUBS_PODCAST_SLUG}`, {
    channel_id: CHANNEL_ID,
    creator_id: CREATOR_ID,
  });
  console.log(`✓ Podcast "${SUBS_PODCAST_SLUG}" (${eps.length} episodes) → channel ${CHANNEL_ID}`);
}

// ---------------------------------------------------------------------------
async function main() {
  console.log("Setting up monetization demo on Kevon Stage…\n");
  await ensureConnectAccount();
  await ensureSubscriptionPrice();
  await gateVideoAsPpv();
  await gateAlbumAsSubscribers();
  await gatePodcastAsSubscribers();

  console.log("\n=== Demo URLs ===");
  console.log(`Channel:    /live/channel/kevonstage  → SUBSCRIBE button (4.99/mo)`);
  console.log(`PPV video:  /live/watch/${PPV_VIDEO_ID}  → BUY $${(PPV_PRICE_CENTS/100).toFixed(2)}`);
  console.log(`PPV album:  /frequency/album/${SUBS_ALBUM_SLUG}  → SUBSCRIBE TO LISTEN`);
  console.log(`Podcast:    /frequency/podcast/${SUBS_PODCAST_SLUG}  → SUBSCRIBE TO LISTEN`);
  console.log(`\nTest card: 4242 4242 4242 4242  any future date  any CVC`);
  console.log(`Earnings dashboard: /dashboard/creator/earnings (after sub/ppv completes)`);
}

main().catch((err) => {
  console.error("Setup failed:", err);
  process.exit(1);
});
