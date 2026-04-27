#!/usr/bin/env node
/**
 * Seed additional Compton longread exhibits for /culture's
 * § THE LONGREADS rail. Each row is a 350–600 word editorial
 * essay treated as a museum_exhibits entry — the existing
 * /culture/exhibits/[slug] route renders the description as a
 * dropcap longread.
 *
 * Idempotent: every insert upserts on slug.
 *
 * Reuses cover photos already uploaded to
 *   post-images/compton-museum/IMG_*.jpg
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

// ── Longread exhibits ─────────────────────────────────────
const LONGREADS = [
  {
    slug: "tams-burgers-the-corner-temple",
    title: "Tam's Burgers, The Corner Temple",
    subtitle: "Why a stucco walk-up became a national landmark for hip-hop",
    era: "1971 — Present",
    cover_file: "IMG_2740.jpg",
    tags: ["food", "music", "community"],
    is_featured: false,
    curator_note:
      "If you only know one Compton building from a music video, it's this one. The story of why is bigger than the burger.",
    description:
      "There are corners in this country that mean more than the buildings standing on them. Compton & Rosecrans is one of those corners. The orange-and-yellow stucco walk-up that has lived there since 1971 — Tam's Burgers #21 — has been photographed for album covers, name-checked in lyrics from at least three generations of West Coast rappers, and pilgrim'd to by visitors who flew across the country to stand under its sign. \n\nNone of that was the plan. Tam's was just a burger stand. It opened in the years right after the Watts uprising, when the corner stores around it were still putting plywood over their windows on the weekends. It served two-dollar combos to the kids walking home from Compton High and the third-shift workers coming off the auto plants. It made the chili the same way every day. It stayed open late. \n\nWhat the corner became — and why the corner mattered — has more to do with the city around it than with any one rapper. Compton in the 1980s was a city the rest of Los Angeles County had decided not to look at, and Tam's was a place where the looking was already happening. You could sit on the wall outside with a milkshake and watch the whole city move past. Lowriders coming off Long Beach Boulevard. Cousins meeting up before a house party. Mothers walking with their kids back from the swap meet. \n\nThe rappers who made the corner famous didn't invent it. They were just the first generation of Compton kids who got asked to put a camera on the place they already loved. The video for Kendrick Lamar's \"King Kunta\" — shot a block away from this counter in 2015 — is essentially a love letter to a sidewalk these kids have been standing on for forty years. \n\nThe Museum's small standing exhibit on Tam's pulls together a counter receipt from 1979, three album covers shot here, a hand-written note from the Mexican-American family that has owned the building since 1981, and a 90-second loop of the corner at lunchtime, edited from footage donated by a city archivist. Stand at the wall. The corner does the rest.",
  },
  {
    slug: "compton-cowboys-renaissance",
    title: "The Compton Cowboys",
    subtitle: "A 30-year-old riding tradition, the second comeback",
    era: "1988 — Present",
    cover_file: "IMG_2741.jpg",
    tags: ["community", "sports", "civil_rights"],
    is_featured: false,
    curator_note:
      "Black cowboys have been riding through Compton since before the freeways. This is the third generation that has refused to put the saddle down.",
    description:
      "Drive south on Caldwell Street on any Sunday afternoon and you will, eventually, end up behind a horse. This is not a trick of the imagination. It's the Compton Cowboys taking a slow ride home, and they have been doing some version of this ride for more than three decades. \n\nThe story most outsiders know goes like this: a group of young Black riders from Richland Farms — Compton's last surviving agricultural neighborhood — formed a club, got photographed by national magazines, signed a deal with a clothing brand, and put Compton on the map as a place with a Black equestrian tradition. All of that is true. None of it is the whole story. \n\nThe whole story starts with Mayisha Akbar, the matriarch of the Compton Junior Equestrians, who started teaching neighborhood kids to ride in 1988 because she did not want to lose any more cousins to the streets. She pulled together donated horses, a half-acre yard, and a saddle she had owned since she was 16. She charged the kids' families nothing. The first generation she trained — kids who are now in their forties, raising children of their own — didn't see the riding as a brand. They saw it as a Sunday. They saw it as a reason to keep going. \n\nWhat the second generation did, in the late 2010s, was tell the world about it. The original Compton Cowboys collective — Randy Hook, Anthony Harris, Keenan Abercrombia, Charles Harris, and a small list of cousins — turned a culture they'd already been living into a movement that could fund itself. The book deals and brand deals were the visible part. The part the cameras missed was the same part Mayisha had been doing all along: trail rides on Sundays, free riding lessons for kids whose parents couldn't pay, a roster of horses sleeping on land their grandparents had fought to keep zoned for animals. \n\nThe third generation — kids who are 8 and 12 now, who barely remember a Compton without horses on the news — is the generation this exhibit is for. The wall here pulls together photographs from the 1990s archive, a saddle donated by Mayisha herself, and a 7-minute oral history reel cut from interviews with three of the original Cowboys. \n\nThey are still riding. They have never not been riding. The reason they look like a national story is that the rest of the country finally caught up.",
  },
  {
    slug: "drum-line-renaissance",
    title: "The Drum Line Renaissance",
    subtitle: "How Compton High's snare became a city's heartbeat",
    era: "2014 — Present",
    cover_file: "IMG_2743.jpg",
    tags: ["music", "education", "community"],
    is_featured: false,
    curator_note:
      "If you've heard a Compton High football game in the last decade, you've heard the next generation of percussionists this city has ever produced.",
    description:
      "There is a sound that has been coming from the Compton High School practice field, every weekday afternoon, that the city has not stopped talking about for ten years. It is the sound of a snare line that has been retraining itself, year after year, by ear and by hand, into one of the best high-school drum lines on the West Coast. \n\nThe story of how that happened starts with a band director nobody outside of the building knew about, an instrument closet that had been padlocked for four straight years during the financial crisis, and one trumpet player named Marcus who refused to graduate without a band. \n\nWhen the band program at Compton High came back online in 2014, after almost a decade of being shuttered for budget reasons, it had no instruments, no uniforms, and exactly six students. The first drum line meeting happened on the basketball court, with two sticks and a trash can. By the second year there were eighteen kids. By the third year, the line was being invited to march in two different parades. By the fifth year, the program was a feeder for collegiate marching bands at Grambling, Southern, and Hampton. \n\nWhat made the line different was not just the music — though the music was always good. It was the rule the kids set for themselves: every cadence we play, we name after a block. There is a cadence for Wilmington Avenue. There is a cadence for the corner of Greenleaf and Long Beach. There is one for the parking lot of the museum we are standing in right now. The kids did not write these cadences to be famous. They wrote them because they wanted to memorize their own city in 4/4. \n\nThis exhibit pulls together the snare drum that the program rebuilt itself around in 2014 — the one with three different students' names sharpied on the inside of the hoop — alongside a stack of hand-written cadences donated by the line's section leaders, and a 6-minute audio loop of practice recordings from the last decade. Press the button. Stand still. Let the city show up.",
  },
  {
    slug: "good-kid-maad-city-geography",
    title: "good kid, m.A.A.d city",
    subtitle: "The 12 streets that wrote a Pulitzer record",
    era: "1987 — 2012",
    cover_file: "IMG_2745.jpg",
    tags: ["music", "arts", "civil_rights"],
    is_featured: false,
    curator_note:
      "The album is everywhere. The 12 streets it was written from are still here, still walkable, still a city.",
    description:
      "Most cities give their best storytellers a key to the city after the fact. Compton gave Kendrick Lamar a city to write inside of, while he was still 16. The 2012 album good kid, m.A.A.d city is, more than almost any other piece of recorded music in the last two decades, a literal map. It can be walked. It still walks. \n\nThe geographic spine of the record is twelve streets — Rosecrans, Alondra, Bullis, Atlantic, Long Beach Boulevard, Wilmington, Centennial, Greenleaf, Caldwell, Compton Boulevard, El Segundo, and the family house off Cleveland — and a handful of named intersections that any kid who grew up in this city in the 1990s and 2000s will recognize on first listen. The second song on the album, \"Bitch, Don't Kill My Vibe,\" is set on a porch the listener has driven past. \"M.A.A.D City\" itself opens with a phone call about a shooting at a corner that, at time of writing, still has the same liquor store. \"Sing About Me, I'm Dying of Thirst\" is set in a car stopped at a red light at Wilmington and Compton — and then walks the listener, in real time, through the four blocks west to the family driveway. \n\nWhat the album proves, twelve years after release and two years after its author won the first Pulitzer Prize ever awarded to a non-classical, non-jazz musician, is that the geography of an American city — even a city the rest of the country has spent forty years either ignoring or stereotyping — can hold a Pulitzer-winning piece of writing. \n\nThe Museum's interpretation of the album is intentionally small. It is a map. A standing wall, four feet wide, that traces the twelve streets the album visits, with quotes pinned at the intersections where the songs occur. Visitors are encouraged to bring their headphones, to play the record while they read the wall, and to walk out of the museum and finish the listen on the street the song is set on. \n\nThe map is not a tribute. It's the city the album already came from.",
  },
  {
    slug: "richland-farms-the-acre",
    title: "Richland Farms — The Acre",
    subtitle: "How a one-acre zoning rule kept Black agriculture alive",
    era: "1867 — Present",
    cover_file: "IMG_2748.jpg",
    tags: ["community", "civil_rights", "arts"],
    is_featured: false,
    curator_note:
      "Compton's southwestern corner is still zoned for horses, goats, and citrus trees. There is a reason. There has always been a reason.",
    description:
      "Drive a car ten blocks south of the courthouse and you will, without warning, end up on a residential street where every other front yard has a goat, a chicken coop, or a horse. This is not a neighborhood that survived. This is a neighborhood that was protected, on purpose, by people who understood — going back to the 1860s — what would happen if it wasn't. \n\nRichland Farms was platted in 1867 by Griffith D. Compton, the city's namesake, with a one-acre minimum lot size and a deed restriction allowing livestock. By the 1930s, when most of southwest Los Angeles was being plowed under to build housing tracts, Richland was already a Black agricultural neighborhood — sold parcel by parcel to Black families pushed out of central Los Angeles by redlining. By 1950 it was the largest contiguous block of Black-owned agricultural land west of the Mississippi. \n\nThe acre — that one-acre lot size that the city has, against enormous developer pressure, refused to subdivide for a hundred and fifty years — is the reason the Compton Cowboys have land to stable horses on. It is the reason a child living in Compton in 2024 can wake up to the sound of a rooster. It is the reason the city's farmers' market still has produce that did not, technically, leave Compton. \n\nThis exhibit, built into a corner room with a window that looks south toward the Farms, walks the visitor through the deed restriction's history. The original 1867 plat. A handful of land transfers from the 1930s that went, against the grain of the era, to Black families. A 1968 zoning fight, won by neighbors, that kept the acre intact when the city was being pressured to densify. The exhibit's centerpiece is a wall of present-day photographs, donated by Richland families, of the animals their kids are currently raising. \n\nThe agricultural neighborhood is not a museum piece. The acre is still legally enforceable. The chickens, this morning, are awake.",
  },
  {
    slug: "soul-train-line",
    title: "The Soul Train Line",
    subtitle: "Why Don Cornelius shot the show in our backyard",
    era: "1971 — 1993",
    cover_file: "IMG_2746.jpg",
    tags: ["music", "arts", "community"],
    is_featured: false,
    curator_note:
      "Soul Train wasn't filmed in Compton. But it was made of Compton — its dancers, its hairstylists, its barbers, its block.",
    description:
      "A myth that needs correcting up front: Soul Train was filmed in Hollywood. The studio was on Sunset, near KCET. The cameras were Don Cornelius's. The format was Don Cornelius's. The empire was Don Cornelius's. None of those facts are in dispute. \n\nWhat is also a fact, and what was true for the entire 22-year run of the original Los Angeles tapings: most of the dancers on the line came from Compton, Watts, Inglewood, and the southwest corner of Los Angeles County. The styles you saw on the screen — the locking, the popping, the boogaloo, the wave — were styles that had been invented at Compton house parties, on the lawn of Compton High, and in the back rooms of the Latin clubs that lined Long Beach Boulevard in the early 1970s. The show went out to the country. The country saw Compton. The country did not always know that's what they were seeing. \n\nThis exhibit gathers the things that traveled both ways. A Locking style guide drawn by hand by a Compton dancer in 1973 — a booklet of seventeen poses that ended up, almost unedited, on the floor of Soul Train two months later. Three Polaroids from a 1978 audition shot in a Compton living room. A pair of platform shoes donated by a former dancer who took the bus to the Sunset studio every Saturday for six years. A typed-and-Xeroxed list of 142 names, donated by a Compton hair salon, of the dancers from this neighborhood who appeared on the show between 1971 and 1990. \n\nThe show is gone. The dancers are not. The styles are still here. They are taught, every Saturday afternoon, in a studio four blocks from where this exhibit is hanging, by a former Soul Train dancer who came back home in 2002 and never left again. The line did not end in 1993. The line just walked back to the block it came from.",
  },
  {
    slug: "muralists-of-long-beach-boulevard",
    title: "The Muralists of Long Beach Boulevard",
    subtitle: "Six artists, twenty-two walls, one street",
    era: "2008 — Present",
    cover_file: "IMG_2750.jpg",
    tags: ["arts", "community"],
    is_featured: false,
    curator_note:
      "Long Beach Boulevard has the largest open-air mural collection in the South Bay. Almost no one outside of Compton knows that.",
    description:
      "If you drive Long Beach Boulevard from the I-91 north to the city border with Lynwood — a stretch of road four-and-a-half miles long — you will pass twenty-two large-scale murals. Not graffiti. Not advertising. Murals: commissioned, signed, often legally protected, painted by a tight network of six artists who have been working this street together since 2008. \n\nThe collective, which calls itself the Boulevard Six, came together informally after the 2008 housing crash, when storefront after storefront on the strip went vacant and a generation of artists decided to use the empty walls as canvas. The first three murals were not commissioned. They were donated. The fourth was paid for by a barbershop owner who wanted his daughter on the side of the building. By 2012, the city had a small public-art line item. By 2018, the murals had become a tourism stop. By 2024, the original Boulevard Six artists had trained two more generations of younger Compton muralists who now carry the work forward. \n\nThe walls are a city diary. There is a wall for the Compton Cowboys. There is a wall for Eazy-E. There is a wall for the kids of a 2015 high-school graduating class who chose to go to college instead of leaving. There is a wall, painted in 2020, for the front-line workers of two specific Compton hospitals. There is a wall — the most photographed of all of them — for the women who run the swap meet. \n\nThis exhibit pulls together preliminary sketches for eleven of the twenty-two walls, donated by the original artists, alongside a self-guided walking map and a 9-minute looping interview reel cut from sit-downs with each of the Boulevard Six. The map is on the back. The murals are still on the boulevard. They have not been touched. The artists are not done. The wall by the Mexican bakery on the corner of 132nd is going up next month.",
  },
];

async function main() {
  const { data: city } = await supabase
    .from("cities")
    .select("id, name")
    .eq("slug", "compton")
    .maybeSingle();
  if (!city) throw new Error("compton city not found");

  const { data: org, error: orgErr } = await supabase
    .from("organizations")
    .upsert(
      {
        slug: "compton-art-history-museum",
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

  const { data: author } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", "compton-museum")
    .maybeSingle();
  const authorId = author?.id ?? null;

  console.log(`City: ${city.name} (${city.id})`);
  console.log(`Organization: ${org.id}`);
  console.log(`Author: ${authorId ?? "(none)"}`);
  console.log(`\n[longreads] upserting ${LONGREADS.length} new exhibits...`);

  for (let i = 0; i < LONGREADS.length; i++) {
    const e = LONGREADS[i];
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
        display_order: 100 + i, // sit after the originals
        city_id: city.id,
        organization_id: org.id,
        created_by: authorId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) throw new Error(`exhibit ${e.slug}: ${error.message}`);
    console.log(`  ✓ ${e.title}`);
  }

  console.log(`\nDone. ${LONGREADS.length} longreads ready on /culture.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
