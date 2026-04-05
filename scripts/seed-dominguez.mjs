#!/usr/bin/env node

/**
 * Seed Dominguez High School with posts, events, and channel content
 * Images from /compton-database/domiguez high school/
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/domiguez high school";
const USER_ID = "b2000001-0002-4000-8000-000000000002";
const CHANNEL_ID = "c3000002-0002-4000-8000-000000000002";
const SCHOOL_ID = "7422112e-a05d-4974-af13-ed73906b6bfe";

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

// ── POSTS (on school page via school_id) ──
const schoolPosts = [
  {
    image: "IMG_2693.jpg",
    body: "DHS Cheer is STATE BOUND! 🏆 After a 1st place win, our cheerleaders are headed to the State Championship Qualifiers! Saturday, April 11th at Knott's Berry Farm, 10AM. Come out and support our Dons cheer squad! #DonsCheer #StateChampionship #DominguezPride",
    daysAgo: 1,
  },
  {
    image: "IMG_2695.jpg",
    body: "1st Platoon Promotions — Congratulations to our Diamond Platoon cadets! MCJROTC at Dominguez High continues to develop disciplined, motivated young leaders. These promotions are earned through hard work and dedication. Semper Fi! 🎖️ #MCJROTC #DiamondPlatoon #DonsPride",
    daysAgo: 3,
  },
  {
    image: "IMG_2696.jpg",
    body: "Our Academic Decathlon team brought the HEAT this year! Look at all those trophies! Proud of every student who competed and represented Dominguez High. Brains AND talent — that's the Dons way. 📚🏆 #AcademicDecathlon #DonsExcellence #ComptonSchools",
    daysAgo: 5,
  },
  {
    image: "IMG_2697.jpg",
    body: "Legends in the building! Alumni and community leaders came back to celebrate with the Dons family. Once a Don, always a Don. Thank you for your continued support and mentorship to our students. 💙🤍 #DonsAlumni #CommunitySupport #DominguezLegacy",
    daysAgo: 8,
  },
  {
    image: "IMG_2698.jpg",
    body: "It's the DONS of a New Era! 🔴🟡 New merch just dropped — hoodies repping that Dominguez pride. This isn't just a school, it's a movement. Get yours and show the world what Dons are about. #DonsOfANewEra #DominguezHigh #SchoolSpirit",
    daysAgo: 10,
  },
  {
    image: "IMG_2699.jpg",
    body: "📢 TUTORING IS AVAILABLE! Before school (7:00-8:30AM) and after school (3:15-4:30PM), Mon-Tue-Thu-Fri. Math, English, Science, Spanish — we've got you covered. No excuses, Dons. Let's get those grades UP! Check the schedule for room numbers. #DonsTutoring #AcademicSupport #NoExcuses",
    daysAgo: 12,
  },
  {
    image: "IMG_2700.jpg",
    body: "CLASS OF 2026 — THIS IS YOUR YEAR! 🎓 Senior gear on sale Dec 1-5 ($30 shirts, $30 hoodies). Claim your FREE prom ticket Dec 8-12 (must have passed GASSP). Senior portraits at Fotorama. Grad Night May 2026 — ALL DAY Disney + California Adventure! Don't miss a single milestone. #ClassOf2026 #DonsSeniors #GradNight",
    daysAgo: 14,
  },
];

// ── EVENTS ──
const events = [
  {
    image: "IMG_2693.jpg",
    title: "DHS Cheer State Championship Qualifiers",
    slug: "dhs-cheer-state-championship-2026",
    description: "Our DHS Cheer squad is STATE BOUND after a 1st place win! Come support the Dominguez Dons cheerleaders as they compete at the State Championship Qualifiers. Show your Dons pride and cheer them on to victory!",
    category: "sports",
    start_date: "2026-04-11",
    start_time: "10:00",
    end_time: "16:00",
    location_name: "Knott's Berry Farm",
    address: "8039 Beach Blvd, Buena Park, CA 90620",
    latitude: 33.8442,
    longitude: -117.9986,
    is_featured: true,
  },
  {
    image: "IMG_2694.jpg",
    title: "Dominguez High 70th Anniversary Open House",
    slug: "dominguez-70th-anniversary-open-house",
    description: "Celebrate 70 YEARS of Dominguez High School! Join us for an evening of Honor Roll Awards, Alumni Senior Lane Ceremony, food, music, student performers, and community partners. Featuring Think Together, St. John's Community Health, Behavioral Health Program, PIQE, Compton Unified School District, and Gear Up Compton.",
    category: "school",
    start_date: "2026-03-18",
    start_time: "16:00",
    end_time: "19:00",
    location_name: "Dominguez High School",
    address: "15301 S San Jose Ave, Compton, CA 90221",
    latitude: 33.8833,
    longitude: -118.2208,
    is_featured: true,
  },
  {
    image: "IMG_2688.jpg",
    title: "DHS Girls Flag Football — Tryouts & Practice",
    slug: "dhs-girls-flag-football-tryouts-2026",
    description: "Girls Flag Football is HERE at Dominguez High! 🏈 8th-12th grade, NO COST. Be part of something bigger — build skills, confidence, and lifelong friendships. No experience needed! Bring cleats, water, outdoor sportswear, and football gloves (optional). Come join the Dons and BE GREAT!",
    category: "sports",
    start_date: "2026-04-07",
    start_time: "15:30",
    end_time: "17:30",
    location_name: "Dominguez High School Football Field",
    address: "15301 S San Jose Ave, Compton, CA 90221",
    latitude: 33.8833,
    longitude: -118.2208,
    is_featured: false,
  },
  {
    image: "IMG_2700.jpg",
    title: "Class of 2026 Grad Night — Disney & California Adventure",
    slug: "dhs-grad-night-2026",
    description: "Class of 2026 — this is YOUR night! ALL DAY at Disney AND California Adventure, 10AM until 3:00AM! Tickets on sale December 15-19, $350. The ultimate celebration for our graduating Dons seniors. Don't miss it!",
    category: "school",
    start_date: "2026-05-22",
    start_time: "10:00",
    end_time: "03:00",
    location_name: "Disneyland Resort",
    address: "1313 Disneyland Dr, Anaheim, CA 92802",
    latitude: 33.8121,
    longitude: -117.919,
    is_featured: true,
  },
];

// ── CHANNEL POSTS (same images, different captions for channel content) ──
const channelPosts = [
  {
    image: "IMG_2694.jpg",
    body: "70 YEARS OF DOMINGUEZ! 🎉 Save the date — Wednesday, March 18th, 4-7 PM. Open House celebrating our legacy with Honor Roll Awards, Alumni Senior Lane Ceremony, food, music, and student performers. Seven decades of producing champions. #70YearsOfDominguez #DonsLegacy #OpenHouse",
    daysAgo: 2,
  },
  {
    image: "IMG_2693.jpg",
    body: "🔥 STATE BOUND! Our DHS Cheer team took 1st place and is heading to State Championship Qualifiers at Knott's Berry Farm, April 11th at 10AM! These young women put in the WORK. Let's show up and show out for our Dons! #DonsCheer #StateBound #Champions",
    daysAgo: 1,
  },
  {
    image: "IMG_2698.jpg",
    body: "New era, same pride. 🔴🟡 The Dons of a New Era collection is here. Rep your school, rep your city. Dominguez High — where legends are made. #DonsOfANewEra #SchoolMerch #DominguezHigh",
    daysAgo: 4,
  },
  {
    image: "IMG_2695.jpg",
    body: "Congratulations to our MCJROTC 1st Platoon on their promotions! Diamond Platoon continues to set the standard for discipline and excellence. These cadets are the future leaders of Compton. 🎖️ #MCJROTC #DonsLeadership #MilitaryScience",
    daysAgo: 6,
  },
  {
    image: "IMG_2699.jpg",
    body: "Need help with your grades? FREE tutoring available before AND after school! Math, English, Science, Spanish. No appointment needed — just show up. Dons take care of Dons. 📚 #FreeTutoring #DonsAcademics #StudentSuccess",
    daysAgo: 9,
  },
];

async function main() {
  console.log("=== Seeding Dominguez High School ===\n");

  // 1. Upload avatar image (use the "Dons of a New Era" hoodie as avatar)
  console.log("1. Updating channel avatar & banner...");
  try {
    const avatarUrl = await uploadImage(`${IMAGE_DIR}/IMG_2698.jpg`, `avatars`);
    const bannerUrl = await uploadImage(`${IMAGE_DIR}/IMG_2694.jpg`, `banners`);

    await supabase
      .from("channels")
      .update({ avatar_url: avatarUrl, banner_url: bannerUrl })
      .eq("id", CHANNEL_ID);

    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", USER_ID);

    console.log(`  -> Avatar: ${avatarUrl.substring(0, 70)}...`);
    console.log(`  -> Banner: ${bannerUrl.substring(0, 70)}...`);
  } catch (err) {
    console.error(`  -> FAILED: ${err.message}`);
  }

  // 2. Create school page posts
  console.log("\n2. Creating school page posts...");
  let postCount = 0;
  for (const post of schoolPosts) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${post.image}`, `dominguez-posts`);
      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();

      const { error } = await supabase.from("posts").insert({
        author_id: USER_ID,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        video_status: null,
        school_id: SCHOOL_ID,
        is_published: true,
        created_at: createdAt,
      });
      if (error) throw error;
      console.log(`  -> [${post.image}] created (${post.daysAgo}d ago)`);
      postCount++;
    } catch (err) {
      console.error(`  -> [${post.image}] FAILED: ${err.message}`);
    }
  }

  // 3. Create events with images
  console.log("\n3. Creating events...");
  let eventCount = 0;
  for (const evt of events) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${evt.image}`, `event-images`);

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
        created_by: USER_ID,
        is_published: true,
        is_featured: evt.is_featured,
      });
      if (error) throw error;
      console.log(`  -> "${evt.title}" created`);
      eventCount++;
    } catch (err) {
      console.error(`  -> "${evt.title}" FAILED: ${err.message}`);
    }
  }

  // 4. Create channel posts (posts linked to channel via author matching channel owner)
  // Channel content is shown by querying posts from the channel owner
  console.log("\n4. Creating channel content posts...");
  let channelCount = 0;
  for (const post of channelPosts) {
    try {
      const imageUrl = await uploadImage(`${IMAGE_DIR}/${post.image}`, `dominguez-channel`);
      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();

      const { error } = await supabase.from("posts").insert({
        author_id: USER_ID,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        video_status: null,
        is_published: true,
        created_at: createdAt,
      });
      if (error) throw error;
      console.log(`  -> [${post.image}] channel post created (${post.daysAgo}d ago)`);
      channelCount++;
    } catch (err) {
      console.error(`  -> [${post.image}] FAILED: ${err.message}`);
    }
  }

  // 5. Update school record with better description
  console.log("\n5. Updating school details...");
  try {
    await supabase
      .from("schools")
      .update({
        description: "Home of the Dons! Dominguez High School has served the Compton community for 70 years, producing champions in academics, athletics, and the arts. Our MCJROTC program, championship cheer squad, academic decathlon team, and dedicated faculty make DHS a cornerstone of excellence in Compton Unified School District.",
      })
      .eq("id", SCHOOL_ID);
    console.log("  -> School description updated");
  } catch (err) {
    console.error(`  -> FAILED: ${err.message}`);
  }

  // 6. Update channel description
  try {
    await supabase
      .from("channels")
      .update({
        description: "Official Dominguez High School channel — Home of the Dons! 70 years of excellence in academics, athletics, arts, and MCJROTC. Follow for campus news, game highlights, student achievements, and upcoming events. It's the Dons of a New Era! 🔴🟡",
      })
      .eq("id", CHANNEL_ID);
    console.log("  -> Channel description updated");
  } catch (err) {
    console.error(`  -> FAILED: ${err.message}`);
  }

  console.log(`\n=== Done! ===`);
  console.log(`Posts created: ${postCount} (school page) + ${channelCount} (channel/pulse)`);
  console.log(`Events created: ${eventCount}`);
  console.log(`Note: Videos skipped — Mux free plan asset limit reached.`);
  console.log(`Login: dominguez_high account with password HubCity123`);
}

main().catch(console.error);
