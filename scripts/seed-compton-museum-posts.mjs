#!/usr/bin/env node
/**
 * Upload the 13 Compton Art & History Museum photos in
 *   /Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/compton museum
 * to Supabase storage and create one post per image, attributed to
 * the @compton-museum profile, staggered across the past three weeks
 * so the feed reads as lived-in instead of "just dropped".
 *
 * Idempotent: re-running upserts the storage objects (so the URLs
 * stay stable) and skips posts whose image_url is already on the
 * museum's wall.
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

const SRC_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/compton museum";

const MUSEUM_HANDLE = "compton-museum";
const TAGS = ["compton", "comptonmuseum", "art", "history", "culture"];

// One curated caption per photo. Order matches the directory listing.
// Captions are intentionally varied — exhibit notes, programming
// announcements, behind-the-scenes shots, and call-to-actions —
// so the wall reads like a real museum's social feed.
const POSTS = [
  {
    file: "IMG_2737.jpg",
    body: "Open today, 11–5. New Black Compton wall just installed on the second floor — a living timeline of the families that built this city.",
    daysAgo: 22,
  },
  {
    file: "IMG_2738.jpg",
    body: "Inside the Founders Room. Every name on this wall is a door we opened together. Free admission Sundays for Compton residents.",
    daysAgo: 20,
  },
  {
    file: "IMG_2739.jpg",
    body: "The Music & Movement gallery is back. From Eazy and Dre to Kendrick — the sound of this city, told through artifacts you can stand next to.",
    daysAgo: 18,
  },
  {
    file: "IMG_2740.jpg",
    body: "Pulled from the archives this week: a 1972 city council program. Six pages, three districts represented, one quote pinned at the top — \"the work begins after the meeting.\"",
    daysAgo: 16,
  },
  {
    file: "IMG_2741.jpg",
    body: "Photo of the day. The kids on this field trip asked the right question: \"who decides what makes it into a museum?\" We told them: you do, eventually.",
    daysAgo: 15,
  },
  {
    file: "IMG_2742.jpg",
    body: "Late-afternoon light on the rotunda. Curators are quiet because they know the building is the loudest exhibit.",
    daysAgo: 13,
  },
  {
    file: "IMG_2743.jpg",
    body: "Featured artist drop. New mixed-media work from a Compton High senior just went up in the East Wing. Artist talk this Saturday at 2pm.",
    daysAgo: 11,
  },
  {
    file: "IMG_2744.jpg",
    body: "Now showing: A People's Compton — fifty years of neighborhood organizing in flyers, photographs, and field recordings. Open through July.",
    daysAgo: 9,
  },
  {
    file: "IMG_2745.jpg",
    body: "Volunteer Tuesdays are back. Help us re-catalog the Cesar Chavez collection — coffee, lunch, and a deeper relationship with this city's history on the house.",
    daysAgo: 7,
  },
  {
    file: "IMG_2746.jpg",
    body: "School groups visiting this week from Centennial High, Roosevelt Middle, and Bunche Elementary. If you're a CUSD teacher, our spring slots are still open — DM to book.",
    daysAgo: 5,
  },
  {
    file: "IMG_2747.jpg",
    body: "From the workshop: restoring a 1958 Compton Comets letterman jacket donated by the family of a former player. Going on display next month.",
    daysAgo: 4,
  },
  {
    file: "IMG_2748.jpg",
    body: "Quiet morning at the museum. The doors open at 11 — coffee from the cafe, no admission required to walk through the lobby exhibits.",
    daysAgo: 2,
  },
  {
    file: "IMG_2750.jpg",
    body: "This weekend: First Friday Pop-Up. Vendors, music, and a free guided tour at 7pm. Bring the family. Bring a friend who's never been.",
    daysAgo: 1,
  },
];

async function uploadOne(filename) {
  const buf = readFileSync(`${SRC_DIR}/${filename}`);
  const dest = `compton-museum/${filename}`;
  const { error } = await supabase.storage
    .from("post-images")
    .upload(dest, buf, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: true,
    });
  if (error) throw new Error(`upload ${dest}: ${error.message}`);
  return supabase.storage.from("post-images").getPublicUrl(dest).data.publicUrl;
}

async function main() {
  // 1. Resolve the museum profile
  const { data: profile, error: pErr } = await supabase
    .from("profiles")
    .select("id, display_name, handle")
    .eq("handle", MUSEUM_HANDLE)
    .maybeSingle();
  if (pErr) throw pErr;
  if (!profile) throw new Error(`@${MUSEUM_HANDLE} profile not found`);
  console.log(
    `Author: ${profile.display_name} (@${profile.handle}) ${profile.id}\n`
  );

  // 2. Pull existing image_urls so we don't double-post if re-run.
  const { data: existing } = await supabase
    .from("posts")
    .select("image_url")
    .eq("author_id", profile.id);
  const seen = new Set(
    (existing ?? [])
      .map((p) => p.image_url)
      .filter((u) => typeof u === "string")
  );

  let inserted = 0;
  let skipped = 0;
  for (const post of POSTS) {
    const url = await uploadOne(post.file);
    if (seen.has(url)) {
      console.log(`  skip ${post.file} — already posted`);
      skipped++;
      continue;
    }
    const createdAt = new Date(
      Date.now() - post.daysAgo * 24 * 60 * 60 * 1000
    ).toISOString();
    const { error: insErr } = await supabase.from("posts").insert({
      author_id: profile.id,
      body: post.body,
      image_url: url,
      is_published: true,
      hashtags: TAGS,
      created_at: createdAt,
      updated_at: createdAt,
    });
    if (insErr) throw new Error(`post ${post.file}: ${insErr.message}`);
    console.log(`  ✓ posted ${post.file} (${post.daysAgo}d ago)`);
    inserted++;
  }

  console.log(`\n=== DONE ===  inserted=${inserted}  skipped=${skipped}`);
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
