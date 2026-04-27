#!/usr/bin/env node
/**
 * Seed /live (On Air) with real movie + TV-show poster art so the
 * channel videos catalog feels like a real streaming platform.
 *
 * Cover art is fetched live from the iTunes Search API. Poster
 * URLs sit on the Apple CDN (is*-ssl.mzstatic.com). next.config
 * was updated to whitelist those hosts so <Image> can render
 * them.
 *
 * Mux playback ids: cycled across the 5 real video Mux assets
 * already in the DB (Westside Party, Ebony Witch, BILLS, YAYA,
 * I'm Not Scared) so playback works against existing assets.
 *
 * Channel placement:
 *   - "Culture" (slug: culture) → films + culture features
 *   - "Culture TV" (slug: knect-tv-live) → TV shows + series
 *
 * Each seeded row has the marker " · [hub-cinema-seed]" in its
 * description so reruns can wipe + reseed without touching the
 * platform's real channel_videos (Adiz's music video, Jess's
 * comedy specials, etc.).
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

const SEED_TAG_BASE = "[hub-cinema-seed";
function seedTag(category) {
  return `${SEED_TAG_BASE}:${category}]`;
}

// 5 real video Mux assets in the DB — cycled for playback.
const VIDEO_MUX_IDS = [
  { playback: "EaCHsgmWo7xkN00Pun5uVna7Bb02FzUDtZTY01q00NqRXAg", asset: "XtRa4xIcdOWVIsvKGBnJmOdaT00XZLy2Srh6E6BqDtw8", duration: 169 },
  { playback: "fvOt6Yr4VjM4cMi4wQ7qlSedZfWTr1z00yG4uH5QURmU", asset: "VyDieRQBEj7BOSN7lb7RpoCzNvaRniziY9qWZBoGHp8", duration: 533 },
  { playback: "Pnkvm1o9R3IxVYKnueGeIMcSZNkoMV1Ot2oETkeBj8E", asset: "yAsAYYgYJyTpjGLCWLPDnu3NJZ4P8XQm01DTYxbwbXzk", duration: 191 },
  { playback: "rSMMGbdyVKzX3As01C7014EmA9f4r8f7o0201ujDUuwV101w", asset: "JrLzAETr02G2Bx6lId1UWc022YDRXVPZxYeDPtvbLZfLc", duration: 776 },
  { playback: "s7aVWw1Vt02sNGAdHcmt7Qoe3umHLSwUWKCWezt4428s", asset: "SPenMGu6oC4Cvo4LiYJfc2anPI2LHfJt7x15SiJlBqo", duration: 1125 },
];

// ── Wikipedia REST API lookup ──────────────────────────────────────
// Apple's iTunes Search API has stopped returning movies/TV (Apple
// migrated those off iTunes Store), so we use Wikipedia's REST
// summary endpoint which returns each page's lead image — typically
// the official poster — hosted on upload.wikimedia.org (already in
// next.config). Stable, no key required.
async function wikipediaPoster(title) {
  const slug = title.replace(/ /g, "_");
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(slug)}`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.originalimage?.source) return data.originalimage.source;
    if (data?.thumbnail?.source) return data.thumbnail.source;
    // Fallback: action API with pageimages prop, follows redirects.
    const apiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(slug)}&prop=pageimages&pithumbsize=600&format=json&formatversion=2&redirects=1`,
    );
    if (!apiRes.ok) return null;
    const apiData = await apiRes.json();
    const page = apiData?.query?.pages?.[0];
    return page?.thumbnail?.source ?? null;
  } catch {
    return null;
  }
}

// ── Films (Black + relevant) ────────────────────────────────────────
// Each `wiki` is the exact Wikipedia page slug (use underscores). The
// REST summary endpoint returns the page's lead image — for film
// pages that's the theatrical poster, hosted on Wikimedia.
const FILMS = [
  { title: "Sinners", year: "2025", wiki: "Sinners_(2025_film)", description: "Ryan Coogler's Mississippi vampire epic — Michael B. Jordan in a dual lead role." },
  { title: "Bad Boys: Ride or Die", year: "2024", wiki: "Bad_Boys:_Ride_or_Die", description: "Will Smith + Martin Lawrence are back in Miami. Adil & Bilall direct." },
  { title: "The Color Purple", year: "2023", wiki: "The_Color_Purple_(2023_film)", description: "Blitz Bazawule's musical adaptation of Alice Walker's novel — Fantasia + Taraji P. Henson." },
  { title: "Creed III", year: "2023", wiki: "Creed_III", description: "Adonis Creed faces his oldest friend turned rival. Jordan's directorial debut." },
  { title: "Black Panther: Wakanda Forever", year: "2022", wiki: "Black_Panther:_Wakanda_Forever", description: "Marvel honors Chadwick Boseman with a sweeping return to Wakanda." },
  { title: "Coming 2 America", year: "2021", wiki: "Coming_2_America", description: "King Akeem returns to Queens with his court — three decades after the original." },
  { title: "Get Out", year: "2017", wiki: "Get_Out", description: "Jordan Peele's Oscar-winning horror debut — Daniel Kaluuya in a meet-the-parents weekend gone wrong." },
  { title: "Hidden Figures", year: "2016", wiki: "Hidden_Figures", description: "True story of Black women mathematicians at NASA during the Space Race — Henson, Spencer, Monáe." },
  { title: "Moonlight", year: "2016", wiki: "Moonlight_(2016_film)", description: "Barry Jenkins' Best Picture winner — three chapters, one boy growing up in Liberty City, Miami." },
  { title: "Training Day", year: "2001", wiki: "Training_Day", description: "Denzel Washington's Oscar role — a rookie's first day with a corrupt LAPD narc detective." },
  { title: "Belly", year: "1998", wiki: "Belly_(film)", description: "Hype Williams' visually-iconic Queens crime drama — DMX + Nas." },
  { title: "Set It Off", year: "1996", wiki: "Set_It_Off_(film)", description: "F. Gary Gray's heist drama — Queen Latifah, Jada Pinkett, Vivica Fox, Kimberly Elise." },
  { title: "Friday", year: "1995", wiki: "Friday_(1995_film)", description: "Ice Cube + Chris Tucker on the porch in South Central. F. Gary Gray's debut." },
  { title: "Menace II Society", year: "1993", wiki: "Menace_II_Society", description: "The Hughes Brothers' unforgettable Watts coming-of-age. Tyrin Turner, Larenz Tate." },
  { title: "Boyz n the Hood", year: "1991", wiki: "Boyz_n_the_Hood", description: "John Singleton's debut — a year of South Central LA from a teenager's vantage. Cuba Gooding Jr., Ice Cube, Morris Chestnut." },
];

// ── TV Shows ────────────────────────────────────────────────────────
const SHOWS = [
  { title: "BMF", wiki: "BMF_(TV_series)", description: "STARZ + 50 Cent's chronicle of the Flenory brothers and the rise of the Black Mafia Family in 1980s Detroit." },
  { title: "Snowfall", wiki: "Snowfall_(TV_series)", description: "FX — John Singleton's South Central LA crack-era epic. Damson Idris as Franklin Saint." },
  { title: "The Chi", wiki: "The_Chi", description: "Showtime — Lena Waithe's South Side Chicago ensemble. Coming-of-age, intertwined lives." },
  { title: "P-Valley", wiki: "P-Valley", description: "Starz — Katori Hall's Mississippi Delta strip-club drama. The Pynk, Mercedes, and Autumn Night." },
  { title: "Atlanta", wiki: "Atlanta_(TV_series)", description: "FX — Donald Glover's Earn, Paper Boi, Darius and Van take Atlanta + Europe by storm." },
  { title: "Abbott Elementary", wiki: "Abbott_Elementary_(TV_series)", description: "ABC — Quinta Brunson's mockumentary about underfunded teachers at a Philly elementary school." },
  { title: "Bel-Air", wiki: "Bel-Air_(TV_series)", description: "Peacock — the dramatic reimagining of The Fresh Prince. Jabari Banks as Will." },
  // Replacements for slugs whose Wikipedia pages don't return a lead
  // image — these all have working originalimage entries.
  { title: "Reasonable Doubt", wiki: "Reasonable_Doubt_(TV_series)", description: "Hulu / Onyx Collective — Kerry Washington's Jax Stewart, an unflappable LA defense attorney." },
  { title: "Lovecraft Country", wiki: "Lovecraft_Country_(TV_series)", description: "HBO — Jordan Peele + J.J. Abrams adapt Matt Ruff's novel of 1950s horror + Jim Crow America." },
  { title: "Dear White People", wiki: "Dear_White_People", description: "Netflix — Justin Simien's adaptation of his Sundance debut. Logan Browning as Sam White." },
  { title: "When They See Us", wiki: "When_They_See_Us", description: "Netflix — Ava DuVernay's miniseries on the Central Park Five. Asante Blackk, Caleel Harris." },
  { title: "Empire", wiki: "Empire_(2015_TV_series)", description: "Fox — Lee Daniels + Danny Strong's hip-hop family epic. Terrence Howard, Taraji P. Henson." },
];

// ── Run ─────────────────────────────────────────────────────────────

function pickMuxRotation(idx) {
  return VIDEO_MUX_IDS[idx % VIDEO_MUX_IDS.length];
}

async function findChannelId(slug) {
  const { data } = await supabase
    .from("channels")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

async function wipeSeed() {
  const { data: existing } = await supabase
    .from("channel_videos")
    .select("id")
    .ilike("description", `%${SEED_TAG_BASE}%`);
  const ids = (existing ?? []).map((r) => r.id);
  if (ids.length > 0) {
    await supabase.from("channel_videos").delete().in("id", ids);
    console.log(`  ✓ wiped ${ids.length} prior seed rows`);
  }
}

// ── Family Shows + Movies (kid + family friendly) ──────────────────
const FAMILY = [
  { title: "Encanto", year: "2021", wiki: "Encanto", description: "Disney's Madrigal-family magic-realism musical, set in the Colombian mountains." },
  { title: "Spider-Man: Across the Spider-Verse", year: "2023", wiki: "Spider-Man:_Across_the_Spider-Verse", description: "Sony Animation — Miles Morales meets the Spider-Society. Shameik Moore + Hailee Steinfeld." },
  { title: "Soul", year: "2020", wiki: "Soul_(2020_film)", description: "Pixar — a middle-school music teacher gets the most unexpected jazz gig of his life." },
  { title: "Inside Out 2", year: "2024", wiki: "Inside_Out_2", description: "Pixar — Riley turns 13 and a whole new crew of emotions takes the headquarters." },
  { title: "Moana 2", year: "2024", wiki: "Moana_2", description: "Disney — Moana sails further than any wayfinder before her, with Maui in tow." },
  { title: "Frozen II", year: "2019", wiki: "Frozen_II", description: "Disney — Anna and Elsa head into the unknown to save Arendelle." },
  { title: "The Lion King", year: "2019", wiki: "The_Lion_King_(2019_film)", description: "Photoreal CGI remake of the 1994 classic — Donald Glover, Beyoncé, James Earl Jones." },
  { title: "Sing", year: "2016", wiki: "Sing_(2016_American_film)", description: "Illumination's all-animal singing competition — Matthew McConaughey runs the theater." },
  { title: "Akeelah and the Bee", year: "2006", wiki: "Akeelah_and_the_Bee", description: "Inglewood 11-year-old Akeelah Anderson sets her sights on the Scripps Spelling Bee." },
  { title: "The Hate U Give", year: "2018", wiki: "The_Hate_U_Give_(film)", description: "Adapted from Angie Thomas's novel — Amandla Stenberg as Starr Carter." },
];

// ── Cartoons + Animation Series ─────────────────────────────────────
const CARTOONS = [
  { title: "Bluey", wiki: "Bluey_(2018_TV_series)", description: "Disney+ / ABC Australia — the Heeler family's kid-perspective adventures in Brisbane." },
  { title: "PAW Patrol", wiki: "PAW_Patrol", description: "Nick Jr. — Ryder + the rescue puppies keep Adventure Bay safe, one mission at a time." },
  { title: "Karma's World", wiki: "Karma's_World", description: "Netflix animated series from Ludacris — Karma Grant, the 10-year-old aspiring rapper." },
  { title: "Doc McStuffins", wiki: "Doc_McStuffins", description: "Disney Junior — a six-year-old plays vet to her stuffed-animal patients." },
  { title: "Star Wars: Young Jedi Adventures", wiki: "Star_Wars:_Young_Jedi_Adventures", description: "Disney+ — Padawans Kai Brightstar and Lys Solay train at the High Republic." },
  { title: "We the People", wiki: "We_the_People_(2021_TV_series)", description: "Netflix + Higher Ground — animated civics series with songs by H.E.R., Janelle Monáe, Lin-Manuel Miranda." },
];

// ── Documentaries ──────────────────────────────────────────────────
const DOCS = [
  { title: "13th", year: "2016", wiki: "13th_(film)", description: "Ava DuVernay — the connection between slavery, the 13th Amendment, and U.S. mass incarceration." },
  { title: "Summer of Soul", year: "2021", wiki: "Summer_of_Soul", description: "Questlove's Oscar-winner — the lost 1969 Harlem Cultural Festival, finally on screen." },
];

// Generic rail seeder — replaces the duplicated seedFilms/seedShows.
async function seedRail({ channelId, items, category, label, muxOffset = 0 }) {
  console.log(`\n[${category}] seeding ${items.length} into ${label}…`);
  let ok = 0;
  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    const cover = await wikipediaPoster(it.wiki);
    if (!cover) {
      console.warn(`  ! no Wikipedia poster for ${it.title} — skipping`);
      continue;
    }
    const mux = pickMuxRotation(i + muxOffset);
    const yearSuffix = it.year ? ` (${it.year})` : "";
    const { error } = await supabase.from("channel_videos").insert({
      channel_id: channelId,
      title: it.title,
      description: `${it.description}\n\n${seedTag(category)}`,
      video_type: i === 0 ? "featured" : "on_demand",
      mux_playback_id: mux.playback,
      mux_asset_id: mux.asset,
      duration: mux.duration,
      thumbnail_url: cover,
      status: "ready",
      is_published: true,
      is_featured: i < 2,
      published_at: new Date(Date.now() - (i + muxOffset) * 86400000).toISOString(),
    });
    if (error) console.warn(`  ! ${it.title}: ${error.message}`);
    else {
      console.log(`  ✓ ${it.title}${yearSuffix}`);
      ok += 1;
    }
  }
  console.log(`  → ${ok}/${items.length} landed`);
}

async function main() {
  await wipeSeed();

  const cultureId = await findChannelId("culture");
  if (!cultureId) {
    console.error("Culture channel not found");
    process.exit(1);
  }
  const tvId = await findChannelId("knect-tv-live");
  if (!tvId) {
    console.error("Culture TV channel not found");
    process.exit(1);
  }

  // Films + docs ride on the Culture channel; series ride on Culture TV.
  await seedRail({ channelId: cultureId, items: FILMS, category: "films", label: "Culture · Films", muxOffset: 0 });
  await seedRail({ channelId: tvId, items: SHOWS, category: "shows", label: "Culture TV · Shows", muxOffset: 15 });
  await seedRail({ channelId: cultureId, items: FAMILY, category: "family", label: "Culture · Family", muxOffset: 27 });
  await seedRail({ channelId: tvId, items: CARTOONS, category: "cartoons", label: "Culture TV · Cartoons", muxOffset: 37 });
  await seedRail({ channelId: cultureId, items: DOCS, category: "docs", label: "Culture · Docs", muxOffset: 43 });

  console.log("\n→ visit /live to verify the new posters");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
