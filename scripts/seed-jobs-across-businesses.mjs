#!/usr/bin/env node
/**
 * Seed a realistic batch of job listings across the seeded businesses
 * so /jobs has content and the apply → receive pipeline (already
 * fully built: /jobs/[id]/apply form, /dashboard/applications,
 * /api/jobs/[id]/apply, RLS) has stuff to flow through.
 *
 * Each business gets 1-3 listings shaped to its category:
 *   • Restaurants → line cook / cashier / dishwasher / catering lead
 *   • Beauty/retail → stylist / sales associate / inventory lead
 *   • Studios → studio assistant / production assistant / framing tech
 *   • Cafes → barista / shift lead
 *
 * Idempotent — wipes prior rows tagged [hub-job-seed] in description
 * before re-inserting, so price/desc tweaks land on rerun without
 * duplicating listings.
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

const SEED_TAG = "[hub-job-seed]";

// Job templates — keyed by business slug. Each entry produces one
// job_listing row; price ranges and copy are tuned to read like
// real Compton small-business postings.
const JOBS_BY_BUSINESS = {
  // ── Restaurants / food ───────────────────────────────────────
  "compton-soul-wings": [
    {
      title: "Line Cook — Wings + Fries",
      type: "full_time",
      sal: { min: 19, max: 22, type: "hourly" },
      desc: "Run the fry station + plating during a 6-hr lunch rush. Soul Wings is busy and growing — we need a steady hand who can keep tickets moving without dropping quality.",
      reqs: "1+ year line experience. Food handler card. Ability to stand a 6-hour shift. Saturday availability is a must.",
    },
    {
      title: "Cashier / Front of House",
      type: "part_time",
      sal: { min: 17, max: 19, type: "hourly" },
      desc: "First face the customer sees. Take orders, run the POS, keep the dining room sharp. Compton Soul Wings is family-style — we're hiring people, not just employees.",
      reqs: "Friendly, on-time, reliable. POS experience a plus but trainable.",
    },
  ],
  "sunrise-plantcake-cafe": [
    {
      title: "Barista — Morning Shift",
      type: "part_time",
      sal: { min: 18, max: 21, type: "hourly" },
      desc: "Pull shots, steam oat milk, set the tone for the morning. We open at 6 AM and the line forms early.",
      reqs: "Latte art appreciated, not required. Must love mornings (genuinely). 6 AM start.",
    },
    {
      title: "Shift Lead",
      type: "full_time",
      sal: { min: 22, max: 26, type: "hourly" },
      desc: "Run the floor on Sunrise's busiest weekend shifts. Open or close, manage 3-5 staff, handle vendor deliveries.",
      reqs: "2+ years café leadership. Reliable transportation. ServSafe a plus.",
    },
  ],
  "yamashita-ramen-bar": [
    {
      title: "Ramen Cook",
      type: "full_time",
      sal: { min: 21, max: 26, type: "hourly" },
      desc: "Help build bowls on the line during dinner service. We'll train on broths and proteins — looking for craftsmanship over experience.",
      reqs: "Open availability nights + weekends. Knife skills. Long shifts on your feet.",
    },
    {
      title: "Server / Bartender",
      type: "part_time",
      sal: { min: 18, max: 20, type: "hourly", note: "+ tips" },
      desc: "Take orders, pour beer + sake, work the bar on busy weekend nights. Tips run strong.",
      reqs: "21+ for bar service. CA Food Handler card. Wed-Sun availability.",
    },
  ],
  "hub-city-burger-house": [
    {
      title: "Grill Cook",
      type: "full_time",
      sal: { min: 20, max: 24, type: "hourly" },
      desc: "Smash burgers, manage the flat-top, keep tickets clean during peak. Hub City moves fast — we need someone who can keep up.",
      reqs: "1+ year grill experience. Food handler card. Saturday + Sunday availability.",
    },
    {
      title: "Drive-Thru / Counter",
      type: "part_time",
      sal: { min: 17, max: 19, type: "hourly" },
      desc: "Take orders, ring registers, keep the dining room and drive-thru window sharp.",
      reqs: "Reliable, friendly, fast on a POS. Bilingual English/Spanish a plus.",
    },
  ],
  "tia-carmen-tacos": [
    {
      title: "Taquero",
      type: "full_time",
      sal: { min: 21, max: 25, type: "hourly" },
      desc: "Run the plancha during lunch + dinner rush. Carne asada, al pastor, suadero. Family business, family wages.",
      reqs: "Spanish preferred. Plancha experience. Knife skills. Weekend availability required.",
    },
    {
      title: "Catering Lead",
      type: "contract",
      sal: { min: 28, max: 35, type: "hourly" },
      desc: "Run our weekend catering events — set up the trompo, manage 2-3 staff, handle the customer hand-off. Independent contractor role, ~3-5 events/month.",
      reqs: "Catering or food-truck management experience. Own transportation. Available most Saturdays.",
    },
  ],
  "pucker-up": [
    {
      title: "Cake Decorator",
      type: "part_time",
      sal: { min: 19, max: 24, type: "hourly" },
      desc: "Pipe, sculpt, and finish custom orders. Pucker Up runs heavy on bridal + birthday — you'll work close with our pastry chef.",
      reqs: "Portfolio required. Buttercream + fondant experience. Tues-Sat schedule.",
    },
  ],

  // ── Beauty / retail ───────────────────────────────────────────
  "glamorous-mane": [
    {
      title: "Stylist (Booth Rental)",
      type: "contract",
      sal: { min: 0, max: 0, type: "commission", note: "Booth rental — keep your full client base" },
      desc: "Booth rental opportunity at Glamorous Mane. Compton's premier salon space — established walk-in flow, supplies-included room, weekly rent.",
      reqs: "CA cosmetology license required. Liability insurance. Existing book preferred.",
    },
    {
      title: "Salon Assistant",
      type: "part_time",
      sal: { min: 17, max: 19, type: "hourly", note: "+ tips" },
      desc: "Shampoo, prep, color mixing, front desk. Great way to learn the salon side of the business while earning hours toward your hours-worked toward licensure.",
      reqs: "Cosmetology school student or recent grad. Weekend availability.",
    },
  ],
  "fakesmiles": [
    {
      title: "Retail Sales Associate",
      type: "part_time",
      sal: { min: 17, max: 20, type: "hourly", note: "+ commission" },
      desc: "Help customers find the fit, manage the floor, run the POS. We hire for vibe — the rest we'll teach.",
      reqs: "Retail or customer-facing experience. Weekend availability. Good with social media a plus.",
    },
    {
      title: "E-commerce + Fulfillment Lead",
      type: "full_time",
      sal: { min: 22, max: 26, type: "hourly" },
      desc: "Run our Shopify backend + ship 30-60 orders a day. You'll own packaging, shipping, returns, and inventory counts.",
      reqs: "Shopify admin experience. Detail-obsessed. M-F daytime schedule.",
    },
  ],
  "bflyy-la": [
    {
      title: "Sales Associate",
      type: "part_time",
      sal: { min: 18, max: 21, type: "hourly", note: "+ commission" },
      desc: "Boutique fitting + styling. We do high-touch — every customer leaves with a complete outfit, not just one piece.",
      reqs: "Fashion or boutique retail experience. Weekend availability required.",
    },
  ],
  "element-78": [
    {
      title: "Café + Coffee Bar Lead",
      type: "full_time",
      sal: { min: 22, max: 26, type: "hourly" },
      desc: "Run the daytime coffee bar at Element 78 — pull shots, manage 1-2 staff, dial in the new espresso menu.",
      reqs: "2+ years café experience. SCAA cert appreciated. Tues-Sat schedule.",
    },
    {
      title: "Personal Trainer (1099)",
      type: "contract",
      sal: { min: 0, max: 0, type: "commission", note: "70/30 split — bring your own clients or use the floor" },
      desc: "Independent contract trainer at Element 78's training floor. Use our equipment, set your own schedule, build your book.",
      reqs: "NASM/ACE/ACSM cert. Liability insurance. Weekday + weekend morning availability.",
    },
  ],

  // ── Studios / artists ─────────────────────────────────────────
  "quiana-lewis-studio": [
    {
      title: "Studio Assistant — Print Production",
      type: "part_time",
      sal: { min: 19, max: 23, type: "hourly" },
      desc: "Help Quiana with print runs, edition numbering, packaging + shipping orders. Great fit for an art-school student or recent grad who wants studio experience.",
      reqs: "Familiarity with giclée printing or willingness to learn. Detail-oriented. 2-3 days/week.",
    },
  ],
  "max-sansing-studio": [
    {
      title: "Production Assistant — Mural Crew",
      type: "contract",
      sal: { min: 25, max: 35, type: "hourly" },
      desc: "Hop on Max's mural commissions — prep walls, mix paint, run lifts, document the process. Project-based contract, paid per gig.",
      reqs: "Comfortable on a scissor lift (we'll train + cert). Reliable transportation. Available for 3-5 day blocks.",
    },
    {
      title: "Studio Photographer (Project)",
      type: "contract",
      sal: { min: 60, max: 90, type: "hourly" },
      desc: "Document each mural commission start-to-finish — process shots, time-lapse, final-piece beauty. ~1 project/month.",
      reqs: "Portfolio required. Own equipment. Available for full-day on-site shoots.",
    },
  ],
  "ayanna-clark-illustrations": [
    {
      title: "Paint & Sip Host",
      type: "part_time",
      sal: { min: 22, max: 28, type: "hourly", note: "+ tips" },
      desc: "Run Ayanna's paint-and-sip nights — set up the studio, walk groups through the painting, keep the room moving. ~2-3 nights/week.",
      reqs: "Comfortable in front of groups of 10-25. Painting/illustration background. Wed-Sat evening availability.",
    },
  ],
};

async function main() {
  // Resolve business slugs → ids in one query.
  const slugs = Object.keys(JOBS_BY_BUSINESS);
  const { data: businesses, error: bErr } = await supabase
    .from("businesses")
    .select("id, slug, name, owner_id, address, city_id")
    .in("slug", slugs);
  if (bErr) {
    console.error("! businesses fetch:", bErr.message);
    process.exit(1);
  }
  const bizBySlug = new Map((businesses ?? []).map((b) => [b.slug, b]));

  // Wipe prior seeded rows so reruns don't pile up.
  console.log("[wipe] removing prior seed rows…");
  const { error: wErr } = await supabase
    .from("job_listings")
    .delete()
    .ilike("description", `%${SEED_TAG}%`);
  if (wErr) console.warn(`  ! ${wErr.message}`);
  else console.log(`  ✓ wiped`);

  // Insert.
  let total = 0;
  for (const [slug, jobs] of Object.entries(JOBS_BY_BUSINESS)) {
    const biz = bizBySlug.get(slug);
    if (!biz) {
      console.warn(`  ! business ${slug} not found — skipping`);
      continue;
    }
    console.log(`\n[${slug}] ${biz.name} — ${jobs.length} listing(s)`);
    for (const j of jobs) {
      // Slugify + suffix the title so a business can have multiple
      // jobs without colliding on the unique slug constraint.
      const baseSlug = j.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const slugFinal = `${slug}-${baseSlug}`;
      const salaryNote = j.sal.note ? ` (${j.sal.note})` : "";
      const description = `${j.desc}\n\n${SEED_TAG}${salaryNote}`;
      // Application deadline = 60 days out so the listing stays open
      // through the demo window without going stale.
      const deadline = new Date(Date.now() + 60 * 86400000)
        .toISOString()
        .split("T")[0];
      const { error } = await supabase.from("job_listings").insert({
        business_id: biz.id,
        title: j.title,
        slug: slugFinal,
        description,
        requirements: j.reqs,
        job_type: j.type,
        salary_min: j.sal.min || null,
        salary_max: j.sal.max || null,
        salary_type: j.sal.type,
        location: biz.address || "Compton, CA",
        is_remote: false,
        is_active: true,
        application_deadline: deadline,
        contact_email: null,
        contact_phone: null,
      });
      if (error) console.warn(`    ! ${j.title}: ${error.message}`);
      else {
        console.log(`    ✓ ${j.title}`);
        total++;
      }
    }
  }

  console.log(
    `\n→ seeded ${total} job listings across ${slugs.length} businesses.` +
      `\n  verify:` +
      `\n    /jobs                              (listing surface)` +
      `\n    /jobs/<slug>                       (detail + apply CTA)` +
      `\n    /dashboard/jobs    (logged in as owner → manage listings)` +
      `\n    /dashboard/applications (incoming applications)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
