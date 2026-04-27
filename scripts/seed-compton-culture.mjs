#!/usr/bin/env node
/**
 * Seed Compton's /culture surface with real per-city rows:
 *
 *   - 4 museum_exhibits (one is_featured)
 *   - 8 gallery_items   (artworks, photos, artifacts)
 *   - 6 notable_people  (music · sports · politics · activism)
 *   - 8 city_history    (Compton timeline entries)
 *
 * Reuses museum cover photos already uploaded to
 *   post-images/compton-museum/IMG_*.jpg
 * by the seed-compton-museum-posts.mjs script. Notable-people
 * portraits stay null — the UI's gold-initial fallback handles them.
 *
 * Idempotent: every insert upserts on slug (or year+city for
 * history) so re-runs refresh content instead of duplicating.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env.local");
try {
  const env = readFileSync(envPath, "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const img = (file) =>
  supabase.storage
    .from("post-images")
    .getPublicUrl(`compton-museum/${file}`).data.publicUrl;

// ── Exhibits ───────────────────────────────────────────────
const EXHIBITS = [
  {
    slug: "voices-of-compton",
    title: "Proud Origins",
    subtitle: "Come with the flag of your origin",
    description:
      "A spring exhibition built around the Compton Museum's Proud Origins Walk — fifty years of oral histories, photographs, and field recordings from the families that made this city. Spanning the housing battles of the 1970s, the immigrant-led mutual-aid networks of the 1990s, and the youth-led organizing of today. Curated in partnership with families across Compton, who were asked one question: where does your block come from?",
    curator_note:
      "We let the city tell its own story this season. The wall texts are quotes — not curators.",
    era: "1975 — Present",
    cover_file: "IMG_2744.jpg",
    tags: ["arts", "community", "civil_rights"],
    is_featured: true,
    wing: "East Wing",
  },
  {
    slug: "music-and-movement",
    title: "Music & Movement",
    subtitle: "From Eazy and Dre to Kendrick",
    description:
      "The sound of this city, told through artifacts you can stand next to. Lyric sheets, mixing-board photos, fan-made flyers, and the actual microphone from a 1989 NWA studio session. A room that hums even when it's empty.",
    curator_note:
      "Hip-hop changed this city's relationship to its own image. This room is about that turn.",
    era: "1986 — 2024",
    cover_file: "IMG_2739.jpg",
    tags: ["music", "arts"],
    is_featured: false,
    wing: "Music Gallery",
  },
  {
    slug: "black-compton-portraits",
    title: "Black Compton",
    subtitle: "Portraits of a city that built itself",
    description:
      "A standing wall of family portraits — barbers, teachers, pastors, mechanics, mothers — each donated by a Compton household. The wall grows every quarter. Submit yours at the front desk.",
    curator_note:
      "Compton was built by Black families who refused to leave. This wall is a thank-you note that takes up a whole floor.",
    era: "1950 — Present",
    cover_file: "IMG_2737.jpg",
    tags: ["community", "civil_rights", "arts"],
    is_featured: false,
    wing: "Second Floor",
  },
  {
    slug: "compton-comets-1958",
    title: "The 1958 Compton Comets",
    subtitle: "A letterman jacket finds its way home",
    description:
      "A small but deep show built around a single restored 1958 Compton Comets letterman jacket donated by the family of a former player. Surrounding it: yearbooks, game programs, letters from teammates, and a 12-minute oral history reel.",
    curator_note:
      "Sometimes one object is the whole show.",
    era: "1958",
    cover_file: "IMG_2747.jpg",
    tags: ["sports", "community"],
    is_featured: false,
    wing: "Archives Room",
  },
];

// ── Gallery items ─────────────────────────────────────────
const GALLERY = [
  {
    slug: "rotunda-light-2026",
    title: "Rotunda Light",
    item_type: "photo",
    description:
      "Late-afternoon sun cuts through the museum's rotunda. Shot for the spring docent program guide.",
    image_file: "IMG_2742.jpg",
    artist_name: "Hub City Editors",
    year_created: "2026",
    medium: "Digital photograph",
    tags: ["arts"],
  },
  {
    slug: "founders-room-installation",
    title: "Founders Room",
    item_type: "photo",
    description:
      "Wide installation shot of the Founders Room. Every name on the wall is a Compton household that helped fund the museum's founding.",
    image_file: "IMG_2738.jpg",
    artist_name: "Compton Museum Archives",
    year_created: "2024",
    medium: "Digital photograph",
    tags: ["community"],
  },
  {
    slug: "music-movement-gallery-detail",
    title: "Music & Movement, gallery detail",
    item_type: "photo",
    description:
      "A wall of mixed-media works tracing Compton's hip-hop lineage from Eazy and Dre to Kendrick.",
    image_file: "IMG_2739.jpg",
    artist_name: "Compton Museum Archives",
    year_created: "2025",
    medium: "Digital photograph",
    tags: ["music"],
  },
  {
    slug: "1972-council-program",
    title: "1972 City Council Program",
    item_type: "document",
    description:
      'Six-page program from a 1972 Compton City Council session. The cover quote: "the work begins after the meeting."',
    image_file: "IMG_2740.jpg",
    artist_name: "Anonymous, City of Compton",
    year_created: "1972",
    medium: "Print, archival paper",
    tags: ["politics", "community"],
  },
  {
    slug: "spring-field-trip-2025",
    title: "Spring Field-Trip",
    item_type: "photo",
    description:
      "Centennial High students at the Voices of Compton opening. The kids asked the right question: who decides what makes it into a museum?",
    image_file: "IMG_2741.jpg",
    artist_name: "Hub City Editors",
    year_created: "2025",
    medium: "Digital photograph",
    tags: ["youth", "education"],
  },
  {
    slug: "comets-letterman-jacket-1958",
    title: "1958 Compton Comets Letterman Jacket",
    item_type: "artifact",
    description:
      "Restored varsity jacket donated by the family of a former player. Wool body, leather sleeves, brass buttons. On display through summer.",
    image_file: "IMG_2747.jpg",
    artist_name: "Anonymous, Compton High School",
    year_created: "1958",
    medium: "Wool, leather, brass",
    dimensions: "Adult medium",
    tags: ["sports", "community"],
  },
  {
    slug: "peoples-compton-flyer-archive",
    title: "A People's Compton — Flyer Archive",
    item_type: "artifact",
    description:
      "A wall display of organizing flyers, mixtape sleeves, and church bulletins from the 1970s through the early 2000s. Crowdsourced from neighborhood collections.",
    image_file: "IMG_2744.jpg",
    artist_name: "Crowdsourced",
    year_created: "1972 — 2004",
    medium: "Mixed paper",
    tags: ["community", "civil_rights"],
  },
  {
    slug: "first-friday-popup-exterior",
    title: "First Friday Pop-Up — exterior",
    item_type: "photo",
    description:
      "The museum's First Friday Pop-Up returns to the front steps every month. Vendors, music, free guided tours.",
    image_file: "IMG_2750.jpg",
    artist_name: "Hub City Editors",
    year_created: "2025",
    medium: "Digital photograph",
    tags: ["arts", "community", "family"],
  },
];

// ── Notable people ────────────────────────────────────────
const PEOPLE = [
  {
    slug: "dr-dre-compton",
    name: "Dr. Dre",
    title: "Producer, rapper, founder of Aftermath Entertainment",
    bio:
      "Born Andre Romelle Young in Compton in 1965. A founding member of N.W.A and one of the most influential producers in the history of hip-hop. The 2015 album Compton was a love letter back to the city that raised him.",
    birth_year: 1965,
    category: "music",
    notable_achievements: [
      "Founded Aftermath Entertainment",
      "Produced The Chronic, 2001, and Compton",
      "Co-founded Beats Electronics",
    ],
    era: "1986 — Present",
    tags: ["music", "compton-original"],
    display_order: 1,
  },
  {
    slug: "kendrick-lamar-compton",
    name: "Kendrick Lamar",
    title: "Pulitzer-winning rapper, songwriter",
    bio:
      "Born in Compton in 1987. The first rapper to win the Pulitzer Prize for Music (2018, for DAMN.). His 2012 album good kid, m.A.A.d city is widely regarded as one of the great American records about a single city.",
    birth_year: 1987,
    category: "music",
    notable_achievements: [
      "Pulitzer Prize for Music, 2018",
      "Multiple Grammy Awards including Best Rap Album",
      "Headlined the 2025 Super Bowl halftime show",
    ],
    era: "2010 — Present",
    tags: ["music", "compton-original"],
    display_order: 2,
  },
  {
    slug: "eric-eazy-e-wright",
    name: "Eric \"Eazy-E\" Wright",
    title: "Rapper, founder of Ruthless Records",
    bio:
      "Born in Compton in 1964. Founded Ruthless Records and N.W.A — the group that put Compton on the global hip-hop map. His 1988 verse on Straight Outta Compton is one of the most quoted opening lines in rap history.",
    birth_year: 1964,
    death_year: 1995,
    category: "music",
    notable_achievements: [
      "Founded Ruthless Records",
      "Co-founded N.W.A",
      "Launched the careers of Bone Thugs-N-Harmony",
    ],
    era: "1986 — 1995",
    tags: ["music", "compton-original"],
    display_order: 3,
  },
  {
    slug: "serena-williams",
    name: "Serena Williams",
    title: "23-time Grand Slam tennis champion",
    bio:
      "Trained on the public courts of Compton with her sister Venus and her father Richard. Widely considered one of the greatest tennis players of all time, with 23 singles Grand Slam titles.",
    birth_year: 1981,
    category: "sports",
    notable_achievements: [
      "23 singles Grand Slam titles",
      "4 Olympic gold medals",
      "Co-founded Serena Ventures",
    ],
    era: "1995 — Present",
    tags: ["sports", "compton-original"],
    display_order: 4,
  },
  {
    slug: "venus-williams",
    name: "Venus Williams",
    title: "7-time Grand Slam tennis champion, entrepreneur",
    bio:
      "Grew up training in Compton alongside her younger sister Serena. Pioneered the modern power game in women's tennis and built a fashion and design business alongside her playing career.",
    birth_year: 1980,
    category: "sports",
    notable_achievements: [
      "7 singles Grand Slam titles",
      "5 Olympic gold medals",
      "Founded EleVen by Venus Williams",
    ],
    era: "1994 — Present",
    tags: ["sports", "compton-original"],
    display_order: 5,
  },
  {
    slug: "maxine-waters-compton",
    name: "Maxine Waters",
    title: "U.S. Representative, civil-rights leader",
    bio:
      "Has represented California's 43rd Congressional District (which includes parts of Compton) since 1991. A relentless voice for working-class Black Americans, financial-system reform, and the Congressional Black Caucus.",
    birth_year: 1938,
    category: "politics",
    notable_achievements: [
      "Chair of the House Financial Services Committee",
      "Founder of the Congressional Black Caucus PAC",
      "Spirit of Democracy Award, 1992",
    ],
    era: "1976 — Present",
    tags: ["politics", "civil_rights"],
    display_order: 6,
  },
];

// ── City history (Compton timeline) ───────────────────────
const HISTORY = [
  {
    year: "1888",
    sort_year: 1888,
    title: "Compton incorporates",
    description:
      "Founded by a group of 30 families led by Griffith Dickenson Compton, the city is incorporated as one of the oldest in Los Angeles County.",
    category: "founding",
    color: "#C5A04E",
  },
  {
    year: "1924",
    sort_year: 1924,
    title: "Compton/Woodley Airport opens",
    description:
      "One of the oldest airports in the LA basin opens its doors. It will go on to host Tomorrow's Aeronautical Museum, a youth-focused aviation program.",
    category: "industry",
    color: "#C5A04E",
  },
  {
    year: "1948",
    sort_year: 1948,
    title: "Shelley v. Kraemer",
    description:
      "The Supreme Court strikes down racially restrictive housing covenants — opening the door for Black families to begin moving into Compton in larger numbers throughout the 1950s.",
    category: "civil_rights",
    color: "#9C8347",
  },
  {
    year: "1969",
    sort_year: 1969,
    title: "First Black mayor in California",
    description:
      "Douglas F. Dollarhide is elected mayor of Compton — the first Black mayor of any sizable city west of the Mississippi.",
    category: "politics",
    color: "#9C8347",
  },
  {
    year: "1986",
    sort_year: 1986,
    title: "N.W.A forms",
    description:
      "Eazy-E founds Ruthless Records and N.W.A in Compton. The 1988 album Straight Outta Compton will reshape American popular music and the city's place in the global imagination.",
    category: "music",
    color: "#C5A04E",
  },
  {
    year: "1995",
    sort_year: 1995,
    title: "Williams sisters turn pro",
    description:
      "Venus and Serena Williams — trained on Compton's public courts — both turn professional. Together they will rewrite the modern era of women's tennis.",
    category: "sports",
    color: "#C5A04E",
  },
  {
    year: "2012",
    sort_year: 2012,
    title: "good kid, m.A.A.d city",
    description:
      "Kendrick Lamar releases his major-label debut, a concept album about coming of age in Compton. It will be widely regarded as one of the great American records about a single American city.",
    category: "music",
    color: "#C5A04E",
  },
  {
    year: "2023",
    sort_year: 2023,
    title: "Compton Art & History Museum opens",
    description:
      "A community-centered museum opens at 306 W Compton Blvd, bringing together art, history, and gathering space for the city's cultural renaissance.",
    category: "renaissance",
    color: "#C5A04E",
  },
];

async function main() {
  // Resolve city + a created_by author (the museum profile is a
  // good editorial owner for this content).
  const { data: city } = await supabase
    .from("cities")
    .select("id, slug, name")
    .eq("slug", "compton")
    .maybeSingle();
  if (!city) throw new Error("compton city not found");
  const { data: author } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", "compton-museum")
    .maybeSingle();
  const authorId = author?.id ?? null;

  console.log(`City: ${city.name} (${city.id})`);
  console.log(`Editorial author: ${authorId ?? "(none — created_by null)"}\n`);

  // Ensure the Compton Museum organization row exists. Migration 053
  // wired culture_* tables to require organization_id, so a real
  // institution row is the natural owner for all this content.
  const orgSlug = "compton-art-history-museum";
  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .upsert(
      {
        slug: orgSlug,
        name: "Compton Art & History Museum",
        type: "cultural",
        city_id: city.id,
        description:
          "A community-centered space bringing together art, history, and gathering room for the Compton renaissance.",
        website: "https://www.comptonmuseum.org",
        verified: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();
  if (orgErr) throw new Error(`org upsert: ${orgErr.message}`);
  const organizationId = orgRow.id;
  console.log(`Organization: Compton Art & History Museum (${organizationId})\n`);

  // ── Exhibits ────────────────────────────────────────────
  console.log("[exhibits] upserting 4 museum exhibits...");
  for (const e of EXHIBITS) {
    const { error } = await supabase.from("museum_exhibits").upsert(
      {
        slug: e.slug,
        title: e.title,
        subtitle: e.subtitle,
        description: e.description,
        cover_image_url: img(e.cover_file),
        curator_note: e.curator_note,
        era: e.era,
        tags: e.tags,
        is_featured: e.is_featured,
        is_published: true,
        city_id: city.id,
        organization_id: organizationId,
        created_by: authorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`exhibit ${e.slug}: ${error.message}`);
    console.log(`  ✓ ${e.title}${e.is_featured ? " (featured)" : ""}`);
  }

  // ── Gallery items ───────────────────────────────────────
  console.log("\n[gallery] upserting 8 gallery items...");
  for (const g of GALLERY) {
    const { error } = await supabase.from("gallery_items").upsert(
      {
        slug: g.slug,
        title: g.title,
        item_type: g.item_type,
        description: g.description,
        image_urls: [img(g.image_file)],
        artist_name: g.artist_name,
        year_created: g.year_created,
        medium: g.medium,
        dimensions: g.dimensions ?? null,
        tags: g.tags,
        is_published: true,
        city_id: city.id,
        organization_id: organizationId,
        created_by: authorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`gallery ${g.slug}: ${error.message}`);
    console.log(`  ✓ ${g.title} (${g.item_type})`);
  }

  // ── People ──────────────────────────────────────────────
  console.log("\n[people] upserting 6 notable people...");
  for (const p of PEOPLE) {
    const { error } = await supabase.from("notable_people").upsert(
      {
        slug: p.slug,
        name: p.name,
        title: p.title,
        bio: p.bio,
        birth_year: p.birth_year,
        death_year: p.death_year ?? null,
        category: p.category,
        portrait_url: null,
        notable_achievements: p.notable_achievements,
        era: p.era,
        tags: p.tags,
        is_published: true,
        display_order: p.display_order,
        city_id: city.id,
        organization_id: organizationId,
        created_by: authorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`person ${p.slug}: ${error.message}`);
    console.log(`  ✓ ${p.name} (${p.category})`);
  }

  // ── City history ────────────────────────────────────────
  console.log("\n[history] inserting 8 timeline entries...");
  // city_history likely doesn't have a unique key on (city_id, year) —
  // wipe Compton's existing rows then re-insert so re-runs stay clean.
  await supabase.from("city_history").delete().eq("city_id", city.id);
  for (const h of HISTORY) {
    const { error } = await supabase.from("city_history").insert({
      city_id: city.id,
      year: h.year,
      sort_year: h.sort_year,
      title: h.title,
      description: h.description,
      color: h.color,
      category: h.category,
    });
    if (error) throw new Error(`history ${h.year}: ${error.message}`);
    console.log(`  ✓ ${h.year} · ${h.title}`);
  }

  console.log("\n=== DONE ===");
  console.log("  exhibits:  4");
  console.log("  gallery:   8");
  console.log("  people:    6");
  console.log("  history:   8");
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
