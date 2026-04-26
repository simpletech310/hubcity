#!/usr/bin/env node
/**
 * Upload the 3 real Element 78 product photos to Supabase storage and
 * point the matching menu_items rows at them. Replaces the Unsplash
 * placeholders we ship with migration 105.
 *
 * Source: /Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Businesses/element 78 busniess/products/
 *
 * Mapping (deterministic — TJ can swap via dashboard later if the
 * filename → product pairing is wrong):
 *   IMG_3318.jpg → E78 Training Tee
 *   IMG_3319.jpg → E78 Performance Joggers
 *   IMG_3321.jpg → Tripod Hydration Bottle
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

const E78_PRODUCTS_DIR =
  "/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/Compton Accounts/Businesses/element 78 busniess/products";

const MAPPING = [
  { file: "IMG_3318.jpg", product: "E78 Training Tee" },
  { file: "IMG_3319.jpg", product: "E78 Performance Joggers" },
  { file: "IMG_3321.jpg", product: "Tripod Hydration Bottle" },
];

async function uploadOne(filename) {
  const buf = readFileSync(`${E78_PRODUCTS_DIR}/${filename}`);
  const dest = `element78/products/${filename}`;
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
  // Resolve Element 78 business
  const { data: biz } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", "element-78")
    .maybeSingle();
  if (!biz) throw new Error("Element 78 business not found");

  for (const m of MAPPING) {
    console.log(`Uploading ${m.file} for "${m.product}"...`);
    const url = await uploadOne(m.file);
    console.log(`  → ${url}`);
    const { error: updErr } = await supabase
      .from("menu_items")
      .update({ image_url: url, updated_at: new Date().toISOString() })
      .eq("business_id", biz.id)
      .eq("name", m.product);
    if (updErr) throw updErr;
    console.log(`  ✓ updated menu_items.image_url for "${m.product}"`);
  }

  // Verify
  const { data: items } = await supabase
    .from("menu_items")
    .select("name, price, image_url")
    .eq("business_id", biz.id)
    .order("sort_order");
  console.log("\nFinal Element 78 menu_items:");
  for (const i of items ?? []) {
    const u = i.image_url ?? "(none)";
    const short = u.length > 80 ? u.slice(0, 60) + "…" + u.slice(-15) : u;
    console.log(`  ${i.name.padEnd(28)} | $${(i.price / 100).toFixed(2).padStart(6)} | ${short}`);
  }
}

main().catch((err) => {
  console.error("FAILED:", err.stack || err.message || err);
  process.exit(1);
});
