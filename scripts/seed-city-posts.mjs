#!/usr/bin/env node

/**
 * Seed posts from the "City post" folder across multiple accounts
 */

import { createClient } from "@supabase/supabase-js";
import Mux from "@mux/mux-node";
import { readFileSync, statSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const MUX_TOKEN_ID = "130b2ec4-c099-4605-993c-c4921db299ea";
const MUX_TOKEN_SECRET = "kgny3kqbXFmsrjrRWk8Vwi+cdLBzlrDoYhp2hpuVMT9AdJjXXbgqMHm0Os8GLtajaGmcqFujUyP";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const mux = new Mux({ tokenId: MUX_TOKEN_ID, tokenSecret: MUX_TOKEN_SECRET });

const IMAGE_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/City post";

// All posts mapped to accounts with captions
const posts = [
  // ── Andre Spicer (council_spicer) ──
  {
    handle: "council_spicer",
    image: "IMG_2662.jpg",
    body: "Compton District 2 Expungement & Resource Fair — FREE legal help for our residents. Get your record cleared, access job resources, and connect with community services. This is what second chances look like. Dollarhide Community Center. #District2 #SecondChances #ComptonResources",
    daysAgo: 11,
  },
  {
    handle: "council_spicer",
    image: "IMG_2664.jpg",
    body: "Location Energy Session — a night of inspiration, networking, and community building. Supporting Compton's next chapter, one connection at a time. Thank you to everyone who came out and showed love. #Spicer4Mayor #NowToNext #ComptonEnergy",
    daysAgo: 13,
  },
  {
    handle: "council_spicer",
    image: "IMG_2667.jpg",
    body: "Hub City Alphas — proud to support Alpha Phi Alpha Fraternity, Inc. in their community presentation. Greek organizations have been pillars in Compton for decades, mentoring youth and driving civic engagement. #HubCityAlphas #CommunityLeadership #District2",
    daysAgo: 15,
  },

  // ── Mayor Sharif (mayor_sharif) ──
  {
    handle: "mayor_sharif",
    image: "IMG_2665.jpg",
    body: "Spring Drop-In Activities Camp at Lueders Park! Free for Compton youth — arts & crafts, sports, games, and more. Keeping our kids active, creative, and safe during spring break. Registration open now. #ComptonParks #YouthPrograms #SpringBreak",
    daysAgo: 3,
  },
  {
    handle: "mayor_sharif",
    image: "IMG_2666.jpg",
    body: "Metro rail construction is progressing right here in Compton. This investment in public transit will connect our city to jobs, education, and opportunity across LA County. The future of Compton mobility is on track. #MetroCompton #PublicTransit #Infrastructure",
    daysAgo: 6,
  },
  {
    handle: "mayor_sharif",
    image: "IMG_2668.jpg",
    body: "Economic Development Strategic Plan Summit — bringing together city leaders, business owners, and residents to chart Compton's economic future. Smart growth, local hiring, and sustainable development. Together we build. #ComptonEconomy #StrategicPlan #CityHall",
    daysAgo: 9,
  },
  {
    handle: "mayor_sharif",
    image: "IMG_2673.jpg",
    body: "On this Veterans Day, we honor the brave men and women from Compton who served our nation. Your sacrifice and service will never be forgotten. Thank you to all our veterans — today and every day. 🇺🇸 #VeteransDay #ComptonVeterans #ThankYouForYourService",
    daysAgo: 14,
  },
  {
    handle: "mayor_sharif",
    image: "IMG_2678.jpg",
    body: "Spring Break is here, Compton! CUSD has a full lineup of activities and programs to keep our students engaged and having fun. Check with your school for details. Let's make this break count! #CUSD #SpringBreak #ComptonSchools",
    daysAgo: 17,
  },

  // ── Jonathan Bowers (council_bowers) ──
  {
    handle: "council_bowers",
    image: "IMG_2671.jpg",
    body: "FREE CPR & AED Training for District 3 residents! Knowing CPR can save a life — and I want every resident in my district to have that power. Sign up today, bring a friend, and let's build a safer Compton together. #District3 #CPRTraining #CommunitySafety",
    daysAgo: 7,
  },

  // ── Compton High (compton_high) ──
  {
    handle: "compton_high",
    image: "IMG_2676.jpg",
    body: "Senior Highlight: Xavier — Musical Theatre! From the stage to graduation, our Tarbabes are shining in every spotlight. Congratulations Xavier on an incredible high school career. The arts are alive at Compton High! 🎭 #ComptonHigh #SeniorHighlight #MusicalTheatre #Tarbabes",
    daysAgo: 2,
  },
  {
    handle: "compton_high",
    image: "IMG_2677.jpg",
    body: "5th Annual Football Combine at Compton High! Athletes, this is your chance to showcase your skills in front of college scouts. Speed, strength, agility — bring your A-game. Registration details coming soon. #ComptonHighFootball #CollegeRecruiting #TarbabePride",
    daysAgo: 4,
  },
  {
    handle: "compton_high",
    image: "IMG_2682.jpg",
    body: "Our students are the future of Compton. Every day, they walk these halls with determination, creativity, and pride. Proud of each and every Tarbabe. #ComptonHigh #StudentLife #TarbabePride",
    daysAgo: 8,
  },
  {
    handle: "compton_high",
    image: "IMG_2683.jpg",
    body: "Happy National Assistant Principals Week! Thank you to our incredible assistant principals who keep Compton High running every single day. Your leadership, dedication, and love for our students does not go unnoticed. #AssistantPrincipalsWeek #ComptonHigh #ThankYou",
    daysAgo: 10,
  },
  {
    handle: "compton_high",
    image: "IMG_2684.jpg",
    body: "Compton High School students are meeting UC and Cal State requirements at record rates! Our students are college-ready and proving that excellence lives right here in Compton. The future is bright. #ComptonHigh #CollegeReady #AcademicExcellence #Tarbabes",
    daysAgo: 12,
  },
  {
    handle: "compton_high",
    image: "IMG_2685.jpg",
    body: "Our students out here spreading the word and getting involved! When young people lead, communities thrive. Stay connected, stay engaged, Compton. #ComptonHigh #StudentLeadership #CommunityEngagement",
    daysAgo: 16,
  },
  {
    handle: "compton_high",
    image: "IMG_2689.jpg",
    body: "In The Heights — Senior Night at Compton High Theatre! What an incredible performance by our talented seniors. The music, the dancing, the emotion — our theatre program is world-class. Standing ovation! 🎶 #InTheHeights #ComptonHighTheatre #SeniorNight #Tarbabes",
    daysAgo: 18,
  },

  // ── Dominguez High (dominguez_high) ──
  {
    handle: "dominguez_high",
    image: "IMG_2686.jpg",
    body: "Heat on the mound! Our Dominguez Dons baseball pitcher bringing the fire this season. Come out and support your Dons on the diamond. Game schedule posted on our channel. ⚾ #DominguezBaseball #DonsBaseball #ComptonBaseball",
    daysAgo: 3,
  },
  {
    handle: "dominguez_high",
    image: "IMG_2687.jpg",
    body: "2026 Military Ball — Dominguez High School MCJROTC! Our cadets clean up NICE. Proud of our young men and women in uniform. Discipline, honor, and service — the Dominguez way. #MCJROTC #MilitaryBall #DominguezHigh #DonsPride",
    daysAgo: 7,
  },
  {
    handle: "dominguez_high",
    image: "IMG_2688.jpg",
    body: "Girls Flag Football is HERE at Dominguez High! 🏈 Ladies, it's your time to shine on the field. Tryouts coming soon — speed, skill, and heart required. Let's build something special. #GirlsFlagFootball #DominguezHigh #DonsAthletics",
    daysAgo: 11,
  },

  // ── Ambassadors ──
  {
    handle: "aaliyah_arts",
    image: "IMG_2661.jpg",
    body: "1st Sundaes Open Mic Night! Poetry, music, comedy — whatever your art is, bring it to the stage. Compton's creative community is alive and thriving. First Sunday of every month. Pull up and share your gift. 🎤 #OpenMic #ComptonArts #1stSundaes #HubCityCulture",
    daysAgo: 1,
  },
  {
    handle: "aaliyah_arts",
    image: "IMG_2663.jpg",
    body: "From Compton to the world! Traveling through Japan and the Philippines — bringing Hub City energy everywhere we go. Experiencing different cultures and bringing that inspiration back home. Global citizens, Compton roots. 🌏 #ComptonAbroad #CulturalExchange #HubCityGlobal",
    daysAgo: 5,
  },
  {
    handle: "mspat_compton",
    image: "IMG_2669.jpg",
    body: "Beautiful evening with the queens of Compton! Our senior women are the backbone of this community — wisdom, grace, and strength in every room they enter. Celebrating our elders is celebrating our legacy. #ComptonSeniors #CommunityLove #Elders #HubCityLegacy",
    daysAgo: 4,
  },
  {
    handle: "coach_deshawn",
    image: "IMG_2670.jpg",
    body: "Cricket Academy Winter/Spring Cohort is OPEN! 🏏 Yes, cricket in Compton! Expanding horizons, building discipline, and trying something new. Youth ages 8-18 welcome. Let's grow the game right here in Hub City. #CricketCompton #YouthSports #CoachDeshawn #NewSport",
    daysAgo: 6,
  },
  {
    handle: "bigmarc_compton",
    image: "IMG_2674.jpg",
    body: "Night of Champions — World Boxing Council dinner! Honored to be in the room with legends. Compton has always produced champions, in the ring and in life. Big things happening for our city. 🥊 #NightOfChampions #WBC #ComptonChampions #Boxing",
    daysAgo: 10,
  },
  {
    handle: "mspat_compton",
    image: "IMG_2679.jpg",
    body: "Our young people visiting Public Works on a field trip! Showing them the careers that keep our city running — engineers, operators, planners. When kids see it, they can be it. Invest in our youth, invest in Compton's future. #FieldTrip #PublicWorks #ComptonYouth #CareerExposure",
    daysAgo: 13,
  },
  {
    handle: "coach_deshawn",
    image: "IMG_2680.jpg",
    body: "TRACK SEASON! 🏃‍♂️ Nothing but speed and determination on this track. Compton athletes have always been built different — fast feet, strong hearts. Proud of every athlete out here putting in the work. #TrackAndField #ComptonAthletics #YouthSports #SpeedCity",
    daysAgo: 15,
  },
];

// Cache for user IDs
const userIdCache = {};

async function getUserId(handle) {
  if (userIdCache[handle]) return userIdCache[handle];
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("handle", handle)
    .single();
  if (error) throw new Error(`Profile not found for @${handle}: ${error.message}`);
  userIdCache[handle] = data.id;
  return data.id;
}

async function uploadImage(filePath, userId) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `city-posts/${userId}/${Date.now()}-${fileName}`;

  const { error } = await supabase.storage
    .from("post-images")
    .upload(storagePath, fileBuffer, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
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

async function uploadVideoToMux(filePath) {
  const fileName = filePath.split("/").pop();
  const fileSize = statSync(filePath).size;
  console.log(`  Video: ${fileName} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`);

  const upload = await mux.video.uploads.create({
    cors_origin: "*",
    new_asset_settings: {
      playback_policy: ["public"],
      encoding_tier: "baseline",
    },
  });

  console.log(`  Upload ID: ${upload.id}`);
  console.log(`  Uploading to Mux...`);

  const fileBuffer = readFileSync(filePath);
  const response = await fetch(upload.url, {
    method: "PUT",
    body: fileBuffer,
    headers: {
      "Content-Type": "video/quicktime",
      "Content-Length": String(fileSize),
    },
  });

  if (!response.ok) {
    throw new Error(`Mux upload failed: ${response.status} ${response.statusText}`);
  }

  console.log(`  Upload complete! Waiting for asset...`);

  let asset = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 3000));
    const uploadStatus = await mux.video.uploads.retrieve(upload.id);
    if (uploadStatus.asset_id) {
      asset = await mux.video.assets.retrieve(uploadStatus.asset_id);
      console.log(`  Asset ID: ${asset.id}`);
      console.log(`  Playback ID: ${asset.playback_ids?.[0]?.id}`);
      break;
    }
    process.stdout.write(".");
  }

  return {
    uploadId: upload.id,
    assetId: asset?.id || null,
    playbackId: asset?.playback_ids?.[0]?.id || null,
    status: asset?.status || "preparing",
  };
}

async function main() {
  console.log("Starting City post seeding...\n");
  console.log(`Total posts to create: ${posts.length} images + 1 video\n`);

  let created = 0;
  let failed = 0;

  // Image posts
  for (const post of posts) {
    try {
      const userId = await getUserId(post.handle);
      const filePath = `${IMAGE_DIR}/${post.image}`;
      console.log(`[${post.handle}] ${post.image}`);

      const imageUrl = await uploadImage(filePath, userId);
      console.log(`  -> uploaded`);

      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();

      // Determine school_id if this is a school account
      let schoolId = null;
      if (post.handle === "compton_high" || post.handle === "dominguez_high") {
        const slug = post.handle === "compton_high" ? "compton-high" : "dominguez-high";
        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("slug", slug)
          .single();
        schoolId = school?.id || null;
      }

      const insertData = {
        author_id: userId,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        video_status: null,
        is_published: true,
        created_at: createdAt,
      };
      if (schoolId) insertData.school_id = schoolId;

      const { error } = await supabase.from("posts").insert(insertData);
      if (error) throw error;

      console.log(`  -> post created (${post.daysAgo}d ago)`);
      created++;
    } catch (err) {
      console.error(`  -> FAILED: ${err.message}`);
      failed++;
    }
  }

  // Video post — assign to mayor_sharif as a city update video
  try {
    console.log(`\n[mayor_sharif] Video: ScreenRecording_04-05-2026 09-09-52_1.mov`);
    const userId = await getUserId("mayor_sharif");
    const videoPath = `${IMAGE_DIR}/ScreenRecording_04-05-2026 09-09-52_1.mov`;
    const muxData = await uploadVideoToMux(videoPath);

    const createdAt = new Date(Date.now() - 1 * 86400000).toISOString();

    const { error } = await supabase.from("posts").insert({
      author_id: userId,
      body: "City update from the Mayor's office. Compton is moving forward — new developments, community programs, and infrastructure improvements happening across all four districts. Stay informed, stay engaged. This is YOUR city. #ComptonForward #MayorUpdate #CityHall",
      media_type: "video",
      mux_upload_id: muxData.uploadId,
      mux_asset_id: muxData.assetId,
      mux_playback_id: muxData.playbackId,
      video_status: muxData.playbackId ? "ready" : "preparing",
      is_published: true,
      created_at: createdAt,
    });
    if (error) throw error;

    console.log(`  -> video post created (1d ago)`);
    created++;
  } catch (err) {
    console.error(`  -> VIDEO FAILED: ${err.message}`);
    failed++;
  }

  console.log(`\nDone! Created: ${created}, Failed: ${failed}`);
  console.log("Note: Video may take 1-3 minutes to finish processing on Mux.");
}

main().catch(console.error);
