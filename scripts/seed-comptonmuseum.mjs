#!/usr/bin/env node

/**
 * Seed Compton Art & History Museum account with posts, events, and channel content
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/compton museum";
const HOMESCREEN_DIR = `${IMAGE_DIR}/Homescreen art`;
const USER_ID = "a5000002-0002-4000-8000-000000ca4d01";
const CHANNEL_ID = "c5000002-0002-4000-8000-000000ca4d01";

async function uploadImage(filePath, subdir) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `${subdir}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw new Error(`Upload failed for ${fileName}: ${error.message}`);

  const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(storagePath);
  return urlData.publicUrl;
}

// ── Image Posts ──
const posts = [
  {
    image: "IMG_2737.jpg",
    body: "📚 BOOK TALK: 'We Now Belong to Ourselves' with Arianne Edmonds. Wednesday, March 25th at 6PM. Arianne is a fifth-generation Angeleno whose work explores memory, legacy, and storytelling in shaping our understanding of Black history. Free admission. @COMPTONMUSEUM | 106 W Compton Blvd #200A #ComptonMuseum #BookTalk #BlackHistory",
    daysAgo: 2,
  },
  {
    image: "IMG_2738.jpg",
    body: "The Compton Art & History Museum is more than a building — it's a movement. Every exhibition, every event, every conversation that happens here is about reclaiming and celebrating Compton's story. Pull up and be part of the culture. 🏛️✊ #ComptonMuseum #ComptonCulture #ArtAndHistory",
    daysAgo: 5,
  },
  {
    image: "IMG_2739.jpg",
    body: "Art night at the museum! Our community gatherings bring together artists, creators, and culture lovers from across Compton and beyond. The energy in this space is something you have to experience. Next event coming soon — stay tuned! 🎨🔥 #ComptonMuseum #ArtNight #Community",
    daysAgo: 8,
  },
  {
    image: "IMG_2740.jpg",
    body: "Forever & Ever ❤️ Love, legacy, and the bonds that make Compton strong. Our latest exhibition celebrates the people and relationships that define this city. Come through and feel the warmth. #ComptonMuseum #ForeverAndEver #ComptonLove",
    daysAgo: 10,
  },
  {
    image: "IMG_2743.jpg",
    body: "History lives in these walls. The Compton Art & History Museum is dedicated to preserving the artifacts, stories, and memories that tell the real story of Compton — from its founding to today. Every visit is a journey through time. 📜🏛️ #ComptonHistory #Museum #Heritage",
    daysAgo: 12,
  },
  {
    image: "IMG_2744.jpg",
    body: "The museum after hours — when the art speaks loudest. Our evening events create intimate spaces for conversation, connection, and culture. Thank you to everyone who makes this place special. 🌙✨ #MuseumAfterHours #ComptonNights #ArtAndCulture",
    daysAgo: 14,
  },
  {
    image: "IMG_2745.jpg",
    body: "Compton creatives STAND UP! 🎬 Our partnership with Urban Films Festival brings independent cinema to the heart of Compton. Supporting local filmmakers and storytellers is what we do. #UrbanFilmsFestival #ComptonMuseum #IndieFilm #ComptonCreatives",
    daysAgo: 3,
  },
  {
    image: "IMG_2746.jpg",
    body: "Urban Films Festival x Compton Museum 🎬🏛️ When film meets history, magic happens. Celebrating independent cinema and the storytellers who dare to tell Compton's truth. The Watts Towers may be in the background, but Compton's creative scene is front and center. #UrbanFilms #ComptonMuseum",
    daysAgo: 6,
  },
  {
    image: "IMG_2747.jpg",
    body: "Exhibition opening night! The museum was packed with community members, artists, and cultural leaders. This is what happens when you build a space that truly belongs to the people. Thank you Compton! 🙏🎨 #ComptonMuseum #ExhibitionOpening #ComptonPride",
    daysAgo: 16,
  },
  {
    image: "IMG_2748.jpg",
    body: "Inside the gallery — every piece tells a story, every wall holds a memory. The Compton Art & History Museum is a living archive of our city's creativity and resilience. Come see for yourself. 🖼️ #ComptonArt #Gallery #MuseumLife",
    daysAgo: 18,
  },
  {
    image: "IMG_2750.jpg",
    body: "Community is our greatest exhibit. From film screenings to book talks, art shows to community forums — the Compton Museum is where culture comes alive. We're open and waiting for you. 🏛️💛 #ComptonMuseum #CommunityFirst #ComptonCulture",
    daysAgo: 20,
  },
];

// ── Events ──
const events = [
  {
    image: "IMG_2737.jpg",
    title: "Book Talk: We Now Belong to Ourselves",
    slug: "book-talk-arianne-edmonds-2026",
    description: "Join author Arianne Edmonds for an intimate book talk about 'We Now Belong to Ourselves.' Arianne is a fifth-generation Angeleno whose work emphasizes the role of memory, legacy, and storytelling in shaping public understanding of Black history. Free admission.",
    category: "culture",
    start_date: "2026-03-25",
    start_time: "18:00",
    end_time: "20:00",
    location_name: "Compton Art & History Museum",
    address: "106 W Compton Blvd #200A, Compton, CA 90220",
    latitude: 33.8958,
    longitude: -118.2201,
    is_featured: true,
  },
  {
    image: "IMG_2746.jpg",
    title: "Urban Films Festival at Compton Museum",
    slug: "urban-films-festival-compton-2026",
    description: "The Urban Films Festival comes to the Compton Art & History Museum! A celebration of independent cinema featuring local and international filmmakers. Film screenings, Q&A sessions, and networking. Support Compton's creative community.",
    category: "culture",
    start_date: "2026-04-19",
    start_time: "17:00",
    end_time: "22:00",
    location_name: "Compton Art & History Museum",
    address: "106 W Compton Blvd #200A, Compton, CA 90220",
    latitude: 33.8958,
    longitude: -118.2201,
    is_featured: true,
  },
];

async function main() {
  console.log("=== Seeding Compton Art & History Museum ===\n");

  // 1. Create auth user
  console.log("1. Creating auth user...");
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: "comptonmuseum@hubcity.app",
    password: "HubCity123",
    email_confirm: true,
    user_metadata: { display_name: "Compton Art & History Museum" },
  });

  if (authError) {
    if (authError.message.includes("already been registered")) {
      console.log("  -> User already exists, looking up via profiles...");
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("handle", "comptonmuseum")
        .single();
      if (profile) {
        console.log(`  -> Found existing user: ${profile.id}`);
        var userId = profile.id;
      } else {
        throw new Error("User exists but could not be found in profiles");
      }
    } else {
      throw authError;
    }
  } else {
    var userId = authData.user.id;
    console.log(`  -> Created user: ${userId}`);
  }

  // Wait for auth trigger to create profile
  console.log("  -> Waiting for profile trigger...");
  await new Promise((r) => setTimeout(r, 2000));

  // 2. Update profile
  console.log("\n2. Updating profile...");
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: "Compton Art & History Museum",
      handle: "comptonmuseum",
      role: "city_ambassador",
      bio: "The Compton Art & History Museum preserves and celebrates the rich cultural heritage of Compton through art exhibitions, community events, film festivals, and educational programs. Located at 106 W Compton Blvd #200A.",
      verification_status: "verified",
      district: 1,
    })
    .eq("id", userId);

  if (profileError) throw new Error(`Profile update failed: ${profileError.message}`);
  console.log("  -> Profile updated");

  // 3. Create channel
  console.log("\n3. Creating channel...");
  const { error: channelError } = await supabase.from("channels").insert({
    id: CHANNEL_ID,
    owner_id: userId,
    name: "Compton Museum",
    slug: "compton-museum",
    type: "organization",
    description: "Official channel of the Compton Art & History Museum. Exhibitions, events, film screenings, book talks, and community gatherings celebrating Compton's cultural legacy.",
    is_active: true,
  });

  if (channelError && !channelError.message.includes("duplicate")) {
    throw new Error(`Channel creation failed: ${channelError.message}`);
  }
  console.log("  -> Channel created");

  // 4. Upload avatar
  console.log("\n4. Setting avatar...");
  try {
    const avatarUrl = await uploadImage(`${HOMESCREEN_DIR}/IMG_2741.jpg`, "avatars");
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", userId);
    await supabase.from("channels").update({ avatar_url: avatarUrl }).eq("id", CHANNEL_ID);
    console.log(`  -> Avatar set`);
  } catch (err) {
    console.error(`  -> Avatar FAILED: ${err.message}`);
  }

  // 5. Upload banner
  console.log("\n5. Setting channel banner...");
  try {
    const bannerUrl = await uploadImage(`${HOMESCREEN_DIR}/IMG_2742.jpg`, "banners");
    await supabase.from("channels").update({ banner_url: bannerUrl }).eq("id", CHANNEL_ID);
    console.log(`  -> Banner set`);
  } catch (err) {
    console.error(`  -> Banner FAILED: ${err.message}`);
  }

  // 6. Create posts
  console.log("\n6. Creating posts...");
  for (const post of posts) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${post.image}`, "museum-posts");
      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();
      const { error } = await supabase.from("posts").insert({
        author_id: userId,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        video_status: null,
        is_published: true,
        created_at: createdAt,
      });
      if (error) throw error;
      console.log(`  -> [${post.image}] created (${post.daysAgo}d ago)`);
    } catch (err) {
      console.error(`  -> [${post.image}] FAILED: ${err.message}`);
    }
  }

  // 7. Create events
  console.log("\n7. Creating events...");
  for (const evt of events) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${evt.image}`, "event-images");
      const { error } = await supabase.from("events").insert({
        title: evt.title,
        slug: evt.slug,
        description: evt.description,
        category: evt.category,
        start_date: evt.start_date,
        start_time: evt.start_time,
        end_time: evt.end_time,
        location_name: evt.location_name,
        address: evt.address,
        latitude: evt.latitude,
        longitude: evt.longitude,
        image_url: imageUrl,
        created_by: userId,
        is_published: true,
        is_featured: evt.is_featured,
      });
      if (error) throw error;
      console.log(`  -> "${evt.title}" created`);
    } catch (err) {
      console.error(`  -> "${evt.title}" FAILED: ${err.message}`);
    }
  }

  console.log("\n=== Done! ===");
  console.log("Login: comptonmuseum@hubcity.app / HubCity123");
}

main().catch(console.error);
