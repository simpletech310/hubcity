import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://fahqtnwwikvocpvvfgqi.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ"
);

// Compton chain businesses with real addresses and coordinates
const chains = [
  // Fast Food
  {
    name: "McDonald's",
    slug: "mcdonalds-compton-blvd",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "World-famous burgers, fries, and breakfast. Drive-thru and dine-in available.",
    address: "801 W Compton Blvd, Compton, CA 90220",
    latitude: 33.8964,
    longitude: -118.2289,
    phone: "(310) 635-0045",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "McDonald's",
    slug: "mcdonalds-long-beach-blvd",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "World-famous burgers, fries, and breakfast. Drive-thru and dine-in available.",
    address: "1700 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9102,
    longitude: -118.1893,
    phone: "(310) 639-4212",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Taco Bell",
    slug: "taco-bell-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Mexican-inspired fast food. Tacos, burritos, quesadillas, and nachos.",
    address: "1820 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9113,
    longitude: -118.1891,
    phone: "(310) 639-7873",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Carl's Jr.",
    slug: "carls-jr-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Charbroiled burgers, hand-breaded chicken tenders, and breakfast burritos.",
    address: "700 W Compton Blvd, Compton, CA 90220",
    latitude: 33.8963,
    longitude: -118.2273,
    phone: "(310) 605-5010",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Jack in the Box",
    slug: "jack-in-the-box-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Burgers, tacos, breakfast, and late-night eats. Open 24 hours.",
    address: "1120 S Central Ave, Compton, CA 90220",
    latitude: 33.8879,
    longitude: -118.2124,
    phone: "(310) 635-8982",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Popeyes Louisiana Kitchen",
    slug: "popeyes-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Cajun-style fried chicken, biscuits, and Southern sides.",
    address: "301 W Compton Blvd, Compton, CA 90220",
    latitude: 33.8965,
    longitude: -118.2221,
    phone: "(310) 604-0303",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Wingstop",
    slug: "wingstop-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Classic and boneless wings in bold flavors. Fries, sides, and dips.",
    address: "1633 E Compton Blvd, Compton, CA 90221",
    latitude: 33.8963,
    longitude: -118.1949,
    phone: "(310) 884-2999",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Subway",
    slug: "subway-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Fresh subs, wraps, and salads made to order.",
    address: "1786 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9109,
    longitude: -118.1892,
    phone: "(310) 537-1310",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Church's Chicken",
    slug: "churchs-chicken-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Southern-style fried chicken, honey biscuits, and jalapeño peppers.",
    address: "901 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9015,
    longitude: -118.1896,
    phone: "(310) 639-8122",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Pizza Hut",
    slug: "pizza-hut-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Pizza, wings, pasta, and breadsticks. Delivery and carryout.",
    address: "1805 W Rosecrans Ave, Compton, CA 90220",
    latitude: 33.9013,
    longitude: -118.2350,
    phone: "(310) 632-6666",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Domino's Pizza",
    slug: "dominos-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Pizza delivery and carryout. Wings, pasta, sandwiches, and desserts.",
    address: "425 W Compton Blvd, Compton, CA 90220",
    latitude: 33.8964,
    longitude: -118.2240,
    phone: "(310) 631-7100",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Little Caesars",
    slug: "little-caesars-compton",
    category: "restaurant",
    business_type: "food",
    business_sub_type: "brick_and_mortar",
    description: "Hot-N-Ready pizzas, Crazy Bread, and wings at affordable prices.",
    address: "1524 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9080,
    longitude: -118.1894,
    phone: "(310) 639-0600",
    district: 2,
    account_type: "ads_only",
  },

  // Retail / Big Box
  {
    name: "Walmart Supercenter",
    slug: "walmart-compton",
    category: "retail",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Groceries, electronics, home goods, pharmacy, and more. Everyday low prices.",
    address: "501 N Santa Fe Ave, Compton, CA 90221",
    latitude: 33.8998,
    longitude: -118.2008,
    phone: "(310) 764-3028",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Best Buy",
    slug: "best-buy-compton",
    category: "retail",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Consumer electronics, computers, appliances, and tech services.",
    address: "1717 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9103,
    longitude: -118.1893,
    phone: "(310) 604-0010",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Ross Dress for Less",
    slug: "ross-compton",
    category: "retail",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Off-price department store with brand-name clothing, shoes, and home decor.",
    address: "1641 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9091,
    longitude: -118.1894,
    phone: "(310) 763-5488",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Dollar Tree",
    slug: "dollar-tree-compton",
    category: "retail",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Everything $1.25 and under. Party supplies, food, household items, and crafts.",
    address: "1630 E Compton Blvd, Compton, CA 90221",
    latitude: 33.8962,
    longitude: -118.1950,
    phone: "(310) 603-1155",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "AutoZone",
    slug: "autozone-compton",
    category: "auto",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Auto parts, accessories, and tools. Free battery testing and oil recycling.",
    address: "1223 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9050,
    longitude: -118.1896,
    phone: "(310) 537-0884",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "O'Reilly Auto Parts",
    slug: "oreilly-compton",
    category: "auto",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Auto parts, tools, and accessories. Free services including battery testing.",
    address: "609 W Rosecrans Ave, Compton, CA 90222",
    latitude: 33.9013,
    longitude: -118.2192,
    phone: "(310) 884-2855",
    district: 1,
    account_type: "ads_only",
  },

  // Pharmacy / Health
  {
    name: "CVS Pharmacy",
    slug: "cvs-compton",
    category: "health",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Pharmacy, health products, beauty, snacks, and photo services. MinuteClinic available.",
    address: "1920 W Rosecrans Ave, Compton, CA 90220",
    latitude: 33.9013,
    longitude: -118.2365,
    phone: "(310) 537-7835",
    district: 1,
    account_type: "ads_only",
  },
  {
    name: "Walgreens",
    slug: "walgreens-compton",
    category: "health",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Pharmacy, health & wellness, beauty, and convenience items. Photo services available.",
    address: "100 E Compton Blvd, Compton, CA 90220",
    latitude: 33.8965,
    longitude: -118.2183,
    phone: "(310) 604-0147",
    district: 1,
    account_type: "ads_only",
  },

  // Services
  {
    name: "T-Mobile",
    slug: "tmobile-compton",
    category: "services",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Wireless carrier with phones, plans, and accessories. 5G network coverage.",
    address: "1616 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9085,
    longitude: -118.1894,
    phone: "(310) 763-0041",
    district: 2,
    account_type: "ads_only",
  },
  {
    name: "Metro by T-Mobile",
    slug: "metro-tmobile-compton",
    category: "services",
    business_type: "retail",
    business_sub_type: "brick_and_mortar",
    description: "Prepaid wireless plans, smartphones, and accessories at affordable prices.",
    address: "1048 N Long Beach Blvd, Compton, CA 90221",
    latitude: 33.9033,
    longitude: -118.1896,
    phone: "(310) 884-0022",
    district: 2,
    account_type: "ads_only",
  },
];

async function seedChains() {
  console.log("Seeding chain businesses into Compton directory...\n");

  // First add account_type column if it doesn't exist
  // We can't run DDL directly, so we'll rely on the column existing
  // or handle it gracefully

  let inserted = 0;
  let skipped = 0;

  for (const chain of chains) {
    // Check if already exists by slug
    const { data: existing } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", chain.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP: ${chain.name} (${chain.slug}) — already exists`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from("businesses").insert({
      ...chain,
      image_urls: [],
      badges: [],
      menu: [],
      hours: {},
      rating_avg: 0,
      rating_count: 0,
      vote_count: 0,
      is_featured: false,
      is_published: true,
      accepts_orders: false,
      accepts_bookings: false,
      delivery_enabled: false,
      min_order: 0,
      is_mobile_vendor: false,
      vendor_status: "inactive",
      chamber_status: "active",
    });

    if (error) {
      // If account_type column doesn't exist, try without it
      if (error.message?.includes("account_type")) {
        const { account_type, ...withoutAccountType } = chain;
        const { error: err2 } = await supabase.from("businesses").insert({
          ...withoutAccountType,
          image_urls: [],
          badges: [],
          menu: [],
          hours: {},
          rating_avg: 0,
          rating_count: 0,
          vote_count: 0,
          is_featured: false,
          is_published: true,
          accepts_orders: false,
          accepts_bookings: false,
          delivery_enabled: false,
          min_order: 0,
          is_mobile_vendor: false,
          vendor_status: "inactive",
          chamber_status: "active",
        });
        if (err2) {
          console.error(`  ERROR: ${chain.name} — ${err2.message}`);
        } else {
          console.log(`  ADDED (no account_type col): ${chain.name}`);
          inserted++;
        }
      } else {
        console.error(`  ERROR: ${chain.name} — ${error.message}`);
      }
    } else {
      console.log(`  ADDED: ${chain.name} (${chain.slug})`);
      inserted++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
}

seedChains().catch(console.error);
