#!/usr/bin/env node
/**
 * Convert Ayanna Clark's two paint-and-sip events into ticketed events
 * with venue + sections + per-event ticket configs, so RSVP traffic
 * lands as actual orders/tickets her dashboard can check in.
 *
 *   1. Mother's Day Paint & Sip — single GA section, paid.
 *   2. Kids' Paint Party (Saturday Brunch Drop-off) — three sections:
 *        · Kid's Spot                FREE  (entry)
 *        · Brunch Plate (per kid)    paid  (food add-on)
 *        · Parent Coffee + Pastry    paid  (parent waiting bar)
 *      Title + description rewritten to reflect the brunch framing
 *      the host asked for.
 *
 * Idempotent — venue is upserted by slug, sections by venue+name,
 * configs by event+section.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const AYANNA_USER_ID = "a1059076-ae25-4180-81a7-338dd168594c";
const VENUE_SLUG = "ayanna-clark-studio";
const VENUE_NAME = "Ayanna Clark Studio";
const VENUE_ADDRESS = "1604 N Long Beach Blvd, Compton, CA 90221";

const EVENT_MOTHERS_DAY = "50da611b-9a2c-4e9f-af8e-5bceed659792";
const EVENT_KIDS_BRUNCH_SLUG =
  "ayanna-kids-paint-party-saturday-drop-off-mohn4gxs";

async function ensureVenue() {
  const { data: existing } = await supabase
    .from("venues")
    .select("id")
    .eq("slug", VENUE_SLUG)
    .maybeSingle();
  if (existing) {
    console.log(`  ⊘ venue ${VENUE_SLUG} already exists (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase
    .from("venues")
    .insert({
      name: VENUE_NAME,
      slug: VENUE_SLUG,
      address: VENUE_ADDRESS,
      total_capacity: 50,
      is_active: true,
      created_by: AYANNA_USER_ID,
    })
    .select("id")
    .single();
  if (error) {
    console.error("  ! venue insert:", error.message);
    process.exit(1);
  }
  console.log(`  ✓ venue created (${data.id})`);
  return data.id;
}

async function ensureSection(venueId, { name, description, capacity, price, color, sortOrder }) {
  const { data: existing } = await supabase
    .from("venue_sections")
    .select("id")
    .eq("venue_id", venueId)
    .eq("name", name)
    .maybeSingle();
  if (existing) {
    // Refresh price/capacity in case the seed values changed.
    await supabase
      .from("venue_sections")
      .update({ description, capacity, default_price: price, color, sort_order: sortOrder })
      .eq("id", existing.id);
    console.log(`  ⊘ section "${name}" exists — refreshed`);
    return existing.id;
  }
  const { data, error } = await supabase
    .from("venue_sections")
    .insert({
      venue_id: venueId,
      name,
      description,
      capacity,
      default_price: price,
      sort_order: sortOrder,
      color,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`  ! section "${name}":`, error.message);
    return null;
  }
  console.log(`  ✓ section "${name}" created`);
  return data.id;
}

async function ensureConfig(eventId, sectionId, { price, capacity, maxPerOrder }) {
  const { data: existing } = await supabase
    .from("event_ticket_config")
    .select("id, capacity, available_count")
    .eq("event_id", eventId)
    .eq("venue_section_id", sectionId)
    .maybeSingle();
  if (existing) {
    // Top up availability proportionally if capacity grew, but don't
    // wipe sold tickets. Updating price/max-per-order is safe.
    const sold = existing.capacity - existing.available_count;
    const newAvailable = Math.max(0, capacity - sold);
    await supabase
      .from("event_ticket_config")
      .update({
        price,
        capacity,
        available_count: newAvailable,
        max_per_order: maxPerOrder,
        is_active: true,
      })
      .eq("id", existing.id);
    console.log(`    ⊘ config exists — refreshed (avail ${newAvailable}/${capacity})`);
    return existing.id;
  }
  const { data, error } = await supabase
    .from("event_ticket_config")
    .insert({
      event_id: eventId,
      venue_section_id: sectionId,
      price,
      capacity,
      available_count: capacity,
      max_per_order: maxPerOrder,
      is_active: true,
    })
    .select("id")
    .single();
  if (error) {
    console.error(`    ! config insert:`, error.message);
    return null;
  }
  console.log(`    ✓ config created (cap ${capacity} @ $${(price / 100).toFixed(2)})`);
  return data.id;
}

async function setEventTicketed(eventId, venueId, patch = {}) {
  const { error } = await supabase
    .from("events")
    .update({
      is_ticketed: true,
      venue_id: venueId,
      ...patch,
    })
    .eq("id", eventId);
  if (error) {
    console.error(`  ! set is_ticketed on ${eventId}:`, error.message);
    return false;
  }
  console.log(`  ✓ event ${eventId.slice(0, 8)}… → is_ticketed=true`);
  return true;
}

async function main() {
  console.log("\n[venue]");
  const venueId = await ensureVenue();

  console.log("\n[sections]");
  // Sections are venue-wide. Same "GA" section can be reused across
  // events; the brunch sections live on the same venue but only
  // attach to the kids event via event_ticket_config.
  const gaId = await ensureSection(venueId, {
    name: "General Admission",
    description: "All-inclusive paint + light bites. 21+.",
    capacity: 25,
    price: 4500,
    color: "#FFB200",
    sortOrder: 0,
  });
  const kidSpotId = await ensureSection(venueId, {
    name: "Kid's Spot (Free)",
    description: "Drop-off paint party for ages 5–11. 90 minutes.",
    capacity: 18,
    price: 0,
    color: "#76B947",
    sortOrder: 1,
  });
  const brunchPlateId = await ensureSection(venueId, {
    name: "Brunch Plate (per kid)",
    description: "Pancakes, fruit, juice. Optional add-on for the kid's session.",
    capacity: 18,
    price: 1500,
    color: "#E2723B",
    sortOrder: 2,
  });
  const parentCoffeeId = await ensureSection(venueId, {
    name: "Parent Coffee + Pastry",
    description: "Hang in the studio while the kids paint. Served fresh.",
    capacity: 12,
    price: 800,
    color: "#9B6F3D",
    sortOrder: 3,
  });

  // ── Event 1: Mother's Day Paint & Sip ────────────────
  console.log("\n[event 1] Mother's Day Paint & Sip");
  await setEventTicketed(EVENT_MOTHERS_DAY, venueId, {
    max_tickets_per_person: 8,
  });
  if (gaId) {
    await ensureConfig(EVENT_MOTHERS_DAY, gaId, {
      price: 4500,
      capacity: 25,
      maxPerOrder: 8,
    });
  }

  // ── Event 2: Kids' Paint Party — Saturday Brunch ──────
  // Resolve the slug → id, rewrite title/description to land the
  // brunch framing the user asked for, then attach all three sections.
  console.log("\n[event 2] Kids' Paint Party — Brunch Drop-off");
  const { data: ev2 } = await supabase
    .from("events")
    .select("id")
    .eq("slug", EVENT_KIDS_BRUNCH_SLUG)
    .maybeSingle();
  if (!ev2) {
    console.warn(`  ! could not find event slug ${EVENT_KIDS_BRUNCH_SLUG}`);
    return;
  }
  const ev2Id = ev2.id;

  await setEventTicketed(ev2Id, venueId, {
    title: "Kids' Paint Party — Saturday Brunch Drop-off",
    description:
      "FREE drop-off paint party for ages 5–11 from 11AM–12:30PM. " +
      "Add a brunch plate for the kids ($15 — pancakes, fruit, juice) " +
      "or grab a coffee + pastry while you wait ($8). " +
      "Spots are first-come, first-served — reserve early.",
    max_tickets_per_person: 6,
  });
  if (kidSpotId) {
    await ensureConfig(ev2Id, kidSpotId, {
      price: 0,
      capacity: 18,
      maxPerOrder: 4,
    });
  }
  if (brunchPlateId) {
    await ensureConfig(ev2Id, brunchPlateId, {
      price: 1500,
      capacity: 18,
      maxPerOrder: 4,
    });
  }
  if (parentCoffeeId) {
    await ensureConfig(ev2Id, parentCoffeeId, {
      price: 800,
      capacity: 12,
      maxPerOrder: 4,
    });
  }

  console.log(
    "\n→ verify:" +
      "\n   /events/" + EVENT_MOTHERS_DAY +
      "\n   /events/" + EVENT_KIDS_BRUNCH_SLUG +
      "\n   /dashboard/events  → OPEN CHECK-IN button on each",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
