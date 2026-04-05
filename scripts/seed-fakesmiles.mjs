#!/usr/bin/env node

/**
 * Seed "We Need More Real" / Fake Smiles business account
 * Posts, products (menu_items), avatar/banner, promotion
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { basename } from "path";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const POST_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/fakesmiles/post";
const PRODUCT_DIR = "/Users/tj/Documents/Claude/Projects/HubCity MVP/compton-database/fakesmiles/products";
const USER_ID = "a6000001-0001-4000-8000-000000000310";
const BUSINESS_ID = "b6000001-0001-4000-8000-000000000310";
const CHANNEL_ID = "c6000001-0001-4000-8000-000000000310";

async function uploadImage(filePath, subdir) {
  const fileName = basename(filePath);
  const fileBuffer = readFileSync(filePath);
  const storagePath = `${subdir}/${Date.now()}-${fileName.replace(/ /g, "_")}`;

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

// ── POSTS ──
const posts = [
  {
    image: "IMG_2714 2.jpg",
    body: "You Can't Stop Me From Smiling 😤🎨 Hand-painted art piece. This is the energy behind everything we do at Fake Smiles. Positive vibes, real talk, Compton spirit.",
    daysAgo: 1,
  },
  {
    image: "IMG_2717 2.jpg",
    body: "Thank You For Smiling ✌️ New tote bags just dropped! Black canvas, yellow graphics. Perfect for carrying your essentials with some Hub City flair. Available now on our page. #FakeSmiles #WeNeedMoreReal #ComptonFashion",
    daysAgo: 3,
  },
  {
    image: "IMG_2718 2.jpg",
    body: "Pop-up shop set up and ready to rock! 🏪 We Need More Real bringing the full collection to the streets — hoodies, hats, tees, totes, and more. Compton, pull up and shop local. #PopUpShop #WeNeedMoreReal #ComptonRetail",
    daysAgo: 5,
  },
  {
    image: "IMG_2730 2.jpg",
    body: "The 'Really That Guy' Graphic Tee 🔥 Close-up details. Hand-finished quality with jewel accents. Limited run, Compton exclusive. Available now. #FakeSmiles #GraphicTee #StreetWear",
    daysAgo: 7,
  },
  {
    image: "IMG_2731 2.jpg",
    body: "Zoom in on the details 🔍💎 Every piece tells a story. The craftsmanship is in the details — jewel grillz, green glow, premium print. This is Compton fashion at its finest. #FakeSmiles #Details #Quality",
    daysAgo: 9,
  },
  {
    image: "IMG_2734 2.jpg",
    body: "NEW DROP: Houndstooth Bucket Hat 🎩 The Fake Smiles houndstooth fuzzy bucket with our signature smiley patch. Cozy, fly, and 100% Compton. Cop yours before they're gone! #FakeSmiles #BucketHat #NewDrop",
    daysAgo: 11,
  },
  {
    image: "IMG_2735 2.jpg",
    body: "Rocking the patches 🛹 Fake Smiles custom patch shorts at the market. When your brand hits the streets, you know it's real. Compton creativity on display. #FakeSmiles #StreetStyle #ComptonMade",
    daysAgo: 13,
  },
];

// ── PRODUCTS (menu_items) ──
const products = [
  {
    images: ["IMG_2719 2.jpg"],
    name: "Rhinestone Beanie - White",
    description: "White knit beanie with Fake Smiles smiley patch and rhinestone gems.",
    price: 3500,
    category: "Hats",
    sort_order: 1,
  },
  {
    images: ["IMG_2720 2.jpg"],
    name: "Checkered Fuzzy Bucket Hat - Green",
    description: "Green and white checkered fuzzy bucket hat with Fake Smiles smiley patch.",
    price: 4000,
    category: "Hats",
    sort_order: 2,
  },
  {
    images: ["IMG_2721 2.jpg"],
    name: "Gothic F Snapback - Lavender",
    description: "Cream and lavender snapback with gothic 'F' embroidery front, Fake Smiles text on back.",
    price: 3800,
    category: "Hats",
    sort_order: 3,
  },
  {
    images: ["IMG_2722 2.jpg", "IMG_2723 2.jpg"],
    name: "Gothic F Snapback - Forest Green",
    description: "Cream and forest green suede brim snapback with gothic 'F' embroidery. Fake Smiles embroidered on back.",
    price: 3800,
    category: "Hats",
    sort_order: 4,
  },
  {
    images: ["IMG_2724 2.jpg", "IMG_2725 2.jpg"],
    name: "Gothic F Snapback - Black Camo",
    description: "White crown with black camo brim snapback. Gothic 'F' front, Fake Smiles embroidered back.",
    price: 3800,
    category: "Hats",
    sort_order: 5,
  },
  {
    images: ["IMG_2726 2.jpg"],
    name: "Fake Smiles Logo Hoodie - Neon Green",
    description: "Neon green pullover hoodie with oversized Fake Smiles chenille smiley patch.",
    price: 6500,
    category: "Hoodies",
    sort_order: 6,
  },
  {
    images: ["IMG_2728 2.jpg", "IMG_2729 2.jpg"],
    name: "'Really That Guy' Graphic Tee",
    description: "Black oversized tee. Front: character portrait with green glow. Back: 'Oh My God I'm Really That Guy' text.",
    price: 4500,
    category: "Tees",
    sort_order: 7,
  },
  {
    images: ["IMG_2732 2.jpg"],
    name: "Corduroy Bucket Hat - Purple",
    description: "Purple corduroy bucket hat with Fake Smiles smiley patch.",
    price: 4000,
    category: "Hats",
    sort_order: 8,
  },
];

async function main() {
  console.log("=== Seeding Fake Smiles / We Need More Real ===\n");

  // 1. Upload avatar (IMG_2733 2.jpg — logo)
  console.log("1. Setting avatar (brand logo)...");
  let avatarUrl;
  try {
    avatarUrl = await uploadImage(`${PRODUCT_DIR}/IMG_2733 2.jpg`, "avatars");
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", USER_ID);
    await supabase.from("channels").update({ avatar_url: avatarUrl }).eq("id", CHANNEL_ID);
    console.log(`   -> Avatar set: ${avatarUrl}`);
  } catch (err) {
    console.error(`   -> Avatar FAILED: ${err.message}`);
  }

  // 2. Upload banner (IMG_2718 2.jpg — pop-up shop)
  console.log("\n2. Setting banner (pop-up shop)...");
  let bannerUrl;
  try {
    bannerUrl = await uploadImage(`${POST_DIR}/IMG_2718 2.jpg`, "banners");
    await supabase.from("channels").update({ banner_url: bannerUrl }).eq("id", CHANNEL_ID);
    await supabase.from("businesses").update({ banner_url: bannerUrl }).eq("id", BUSINESS_ID);
    console.log(`   -> Banner set: ${bannerUrl}`);
  } catch (err) {
    console.error(`   -> Banner FAILED: ${err.message}`);
  }

  // 3. Create posts
  console.log("\n3. Creating posts...");
  for (const post of posts) {
    try {
      const imageUrl = await uploadImage(`${POST_DIR}/${post.image}`, "fakesmiles-posts");
      const createdAt = new Date(Date.now() - post.daysAgo * 86400000).toISOString();
      const { error } = await supabase.from("posts").insert({
        author_id: USER_ID,
        body: post.body,
        image_url: imageUrl,
        media_type: "image",
        is_published: true,
        created_at: createdAt,
      });
      if (error) throw error;
      console.log(`   -> [${post.image}] created (${post.daysAgo}d ago)`);
    } catch (err) {
      console.error(`   -> [${post.image}] FAILED: ${err.message}`);
    }
  }

  // 4. Upload product images and create menu_items
  console.log("\n4. Creating products (menu_items)...");
  const allProductImageUrls = [];
  for (const product of products) {
    try {
      // Upload first image as the main image_url
      const mainImageUrl = await uploadImage(`${PRODUCT_DIR}/${product.images[0]}`, "fakesmiles-products");
      allProductImageUrls.push(mainImageUrl);

      // Upload additional images if any
      for (let i = 1; i < product.images.length; i++) {
        const extraUrl = await uploadImage(`${PRODUCT_DIR}/${product.images[i]}`, "fakesmiles-products");
        allProductImageUrls.push(extraUrl);
      }

      const { error } = await supabase.from("menu_items").insert({
        business_id: BUSINESS_ID,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: mainImageUrl,
        category: product.category,
        sort_order: product.sort_order,
        is_available: true,
      });
      if (error) throw error;
      console.log(`   -> "${product.name}" — $${(product.price / 100).toFixed(2)} [${product.category}]`);
    } catch (err) {
      console.error(`   -> "${product.name}" FAILED: ${err.message}`);
    }
  }

  // 5. Update business image_urls with all product images
  console.log("\n5. Updating business image_urls...");
  try {
    const { error } = await supabase
      .from("businesses")
      .update({ image_urls: allProductImageUrls })
      .eq("id", BUSINESS_ID);
    if (error) throw error;
    console.log(`   -> Set ${allProductImageUrls.length} product image URLs on business`);
  } catch (err) {
    console.error(`   -> FAILED: ${err.message}`);
  }

  // 6. Create promotion / coupon
  console.log("\n6. Creating promotion...");
  try {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 86400000);
    const { error } = await supabase.from("food_promotions").insert({
      business_id: BUSINESS_ID,
      title: "GRAND OPENING — 15% Off Everything",
      description: "Use code HUBCITY15 at checkout for 15% off your entire order. Valid on all Fake Smiles / We Need More Real merchandise. Welcome to the Hub City!",
      promo_type: "discount",
      promo_code: "HUBCITY15",
      discount_percent: 15,
      valid_from: now.toISOString(),
      valid_until: thirtyDaysLater.toISOString(),
      is_active: true,
    });
    if (error) throw error;
    console.log(`   -> "GRAND OPENING — 15% Off Everything" (code: HUBCITY15, valid 30 days)`);
  } catch (err) {
    console.error(`   -> Promotion FAILED: ${err.message}`);
  }

  console.log("\n=== Done! ===");
  console.log("Login: tonythe1@hubcity.app / HubCity1");
  console.log(`Business: We Need More Real (${BUSINESS_ID})`);
  console.log(`Channel: We Need More Real (${CHANNEL_ID})`);
}

main().catch(console.error);
