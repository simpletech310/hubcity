#!/usr/bin/env node

/**
 * Seed Andre Spicer's posts with real images and videos
 * Uploads to Supabase storage, creates posts in the database
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/Andre Spicer Post";

// Get Andre Spicer's user ID
async function getSpicerId() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", "council_spicer")
    .single();
  if (error) throw new Error(`Failed to find Spicer profile: ${error.message}`);
  return data.id;
}

// Upload image to Supabase storage
async function uploadImage(filePath, userId) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `spicer-posts/${userId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error(`Upload failed for ${fileName}:`, error.message);
    // Try alternate bucket
    const { error: err2 } = await supabase.storage
      .from("media")
      .upload(storagePath, fileBuffer, {
        contentType: "image/jpeg",
        cacheControl: "3600",
        upsert: false,
      });
    if (err2) throw new Error(`Upload failed: ${err2.message}`);
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(storagePath);
    return urlData.publicUrl;
  }

  const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(storagePath);
  return urlData.publicUrl;
}

// Create a post
async function createPost(userId, body, imageUrl, createdAt) {
  const { data, error } = await supabase
    .from("posts")
    .insert({
      author_id: userId,
      body,
      image_url: imageUrl || null,
      media_type: imageUrl ? "image" : null,
      is_published: true,
      created_at: createdAt,
    })
    .select("id, body, image_url, created_at")
    .single();

  if (error) throw new Error(`Post creation failed: ${error.message}`);
  return data;
}

// Posts with their images and captions
const posts = [
  {
    image: "IMG_2645.jpg",
    body: "Great time chopping it up with the homies today. Building community one conversation at a time. This is what Compton is about — real people, real connections. #District2 #ComptonLove",
    daysAgo: 1,
  },
  {
    image: "IMG_2646.jpg",
    body: "Honored to speak at Thee Love Gala — For the Love of Legacy. When we celebrate our community, we strengthen it. Thank you to everyone who came out and showed love. #TheeLoveGala #ComptonLegacy",
    daysAgo: 2,
  },
  {
    image: "IMG_2647.jpg",
    body: "Andre Spicer for Mayor. Standing at the podium, speaking truth for the people of Compton. Every decision I make is for YOU — the residents, the families, the dreamers. We are building something special. #Spicer4Mayor #ComptonForward",
    daysAgo: 3,
  },
  {
    image: "IMG_2648.jpg",
    body: "Nothing means more than family. My grandmother has been my rock and my inspiration. Everything I do in service to Compton, I do because of the values she instilled in me. Love you, Grandma. #Family #ComptonRoots",
    daysAgo: 4,
  },
  {
    image: "IMG_2649.jpg",
    body: "Thee Love Gala — For the Love of Legacy. Sat, Feb 28th, 2026, 6-10 PM. Black tie, vintage-inspired. Live band. A fundraiser in support of Compton's future. Hosted by The Voice of Reason, Radio Personality Zo Williams. #TheeLoveGala #ComptonEvents",
    daysAgo: 5,
  },
  {
    image: "IMG_2650.jpg",
    body: "TOWN HALL MEETING — Standing Together: A Community Conversation on ICE & Public Safety. Resources offered, conversation, and response. Dollarhide Community Center, 301 N. Tamarind Ave. Thurs Feb 26, 6PM-8PM. Your voice matters, Compton. #TownHall #ComptonSafety #District2",
    daysAgo: 6,
  },
  {
    image: "IMG_2652.jpg",
    body: "Legacy Honorees: Abigail & Marquell Byrd, Founders of the Compton Art & History Museum. Honoring Excellence in Community Uplift. Celebrate their legacy at Thee Love Gala, Feb 28th. These are the people who make Compton great. #ComptonArt #ComptonHistory",
    daysAgo: 7,
  },
  {
    image: "IMG_2653.jpg",
    body: "The Power of Community Partnerships. Amplifying our impact through strategic alliances, working hand-in-hand with residents, local organizations, and businesses to create lasting positive change. Community development meets civic engagement. From now to next. #ComptonPartnerships #CivicEngagement",
    daysAgo: 8,
  },
  {
    image: "IMG_2654.jpg",
    body: "Stroke, Vote, Song — Paint with Purpose, Vote for the Future! Community fundraiser on Feb 20, 6-9 PM. $40 min donation, 18 and up. Hosted by Compton Wellness Collective. Art, music, and civic engagement all in one night. #NowToNext #ComptonCulture",
    daysAgo: 9,
  },
  {
    image: "IMG_2655.jpg",
    body: "Out in the community, connecting with the people. Stopped by Ruthless Hair Salon on the block tonight. Supporting local businesses is not just talk — it is action. Compton entrepreneurs are the backbone of our city. #ShopLocal #ComptonBusiness",
    daysAgo: 10,
  },
  {
    image: "IMG_2658.jpg",
    body: "SENIOR RESOURCE FAIR — Compton District 2 Mayor Pro Tem Andre Spicer. Free community event spotlighting programs and services that support Seniors. Health & Wellness, Living Accommodations, Civil & Social Outreach, and more! Sat Feb 7, 10AM-2PM, Dollarhide Community Center. #ComptonSeniors #District2",
    daysAgo: 12,
  },
];

async function main() {
  console.log("Starting Andre Spicer post seeding...\n");

  const userId = await getSpicerId();
  console.log(`Found Andre Spicer: ${userId}\n`);

  // First, delete any existing seed posts from migration 025
  const { data: existingPosts } = await supabase
    .from("posts")
    .select("id")
    .eq("author_id", userId);

  if (existingPosts && existingPosts.length > 0) {
    console.log(`Deleting ${existingPosts.length} existing seed posts...`);
    await supabase
      .from("posts")
      .delete()
      .eq("author_id", userId);
  }

  for (const post of posts) {
    try {
      const imagePath = `${IMAGE_DIR}/${post.image}`;
      console.log(`Uploading ${post.image}...`);
      const imageUrl = await uploadImage(imagePath, userId);
      console.log(`  -> ${imageUrl.substring(0, 80)}...`);

      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();
      const created = await createPost(userId, post.body, imageUrl, createdAt);
      console.log(`  -> Post created: ${created.id} (${post.daysAgo}d ago)\n`);
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}\n`);
    }
  }

  // Update avatar to use the gala photo (IMG_2646 - him speaking at mic)
  console.log("Uploading avatar photo...");
  try {
    const avatarPath = `${IMAGE_DIR}/IMG_2646.jpg`;
    const avatarUrl = await uploadImage(avatarPath, `avatar-${userId}`);
    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId);
    console.log(`  -> Avatar updated: ${avatarUrl.substring(0, 80)}...\n`);
  } catch (err) {
    console.error(`  -> Avatar update failed: ${err.message}\n`);
  }

  console.log("Done! Andre Spicer now has real posts with images.");
  console.log("Login: council.spicer@hubcity.app / HubCity123");
}

main().catch(console.error);
