import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local manually
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  if (!process.env[key]) process.env[key] = val;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_PASSWORD = "HubCity2026!";

interface TestUser {
  email: string;
  display_name: string;
  handle: string;
  role: "citizen" | "business_owner" | "city_official" | "admin";
  bio: string;
  zip: string;
  district: number;
  verification_status: "verified";
}

const users: TestUser[] = [
  // ── Admin ──────────────────────────────────────────
  {
    email: "admin@hubcity.test",
    display_name: "Hub City Admin",
    handle: "hubcityadmin",
    role: "admin",
    bio: "Platform administrator for Hub City.",
    zip: "90220",
    district: 1,
    verification_status: "verified",
  },

  // ── City Official ──────────────────────────────────
  {
    email: "official@hubcity.test",
    display_name: "Council Member Davis",
    handle: "cmdavis",
    role: "city_official",
    bio: "District 2 City Council Representative. Serving the Compton community.",
    zip: "90221",
    district: 2,
    verification_status: "verified",
  },

  // ── Business Owner: Restaurant ─────────────────────
  {
    email: "restaurant@hubcity.test",
    display_name: "Marcus Johnson",
    handle: "marcusgrill",
    role: "business_owner",
    bio: "Owner of Marcus's Soul Kitchen on Compton Blvd. Born and raised in Compton.",
    zip: "90220",
    district: 1,
    verification_status: "verified",
  },

  // ── Business Owner: Barber ─────────────────────────
  {
    email: "barber@hubcity.test",
    display_name: "Deshawn Williams",
    handle: "freshcutz",
    role: "business_owner",
    bio: "Owner of Fresh Cutz Barbershop. 15 years cutting in Compton.",
    zip: "90222",
    district: 3,
    verification_status: "verified",
  },

  // ── Citizen: Mother with kids at Compton High ──────
  {
    email: "maria@hubcity.test",
    display_name: "Maria Rodriguez",
    handle: "mariarodriguez",
    role: "citizen",
    bio: "Mom of 3. Kids at Compton High. Active PTA member and community volunteer.",
    zip: "90221",
    district: 2,
    verification_status: "verified",
  },

  // ── Citizen: Father looking for jobs ───────────────
  {
    email: "james@hubcity.test",
    display_name: "James Thompson",
    handle: "jamest",
    role: "citizen",
    bio: "Recently relocated to Compton. Looking for work and getting connected with the community.",
    zip: "90220",
    district: 1,
    verification_status: "verified",
  },

  // ── Citizen: Young adult / College student ─────────
  {
    email: "student@hubcity.test",
    display_name: "Aaliyah Carter",
    handle: "aaliyahc",
    role: "citizen",
    bio: "Compton College student. Studying business. Born and raised here.",
    zip: "90222",
    district: 3,
    verification_status: "verified",
  },

  // ── Citizen: Senior resident ───────────────────────
  {
    email: "senior@hubcity.test",
    display_name: "Dorothy Mae Brown",
    handle: "dorothybrown",
    role: "citizen",
    bio: "Retired teacher. 40+ years in Compton. Active at First AME Church.",
    zip: "90223",
    district: 4,
    verification_status: "verified",
  },

  // ── Resource Manager / Nonprofit ───────────────────
  {
    email: "nonprofit@hubcity.test",
    display_name: "Keisha Williams",
    handle: "keishawilliams",
    role: "city_official",
    bio: "Director of Compton Community Resource Center. Managing grants and youth programs.",
    zip: "90221",
    district: 2,
    verification_status: "verified",
  },
];

async function seedUsers() {
  console.log("Seeding test users...\n");

  for (const u of users) {
    // Create auth user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: u.email,
        password: TEST_PASSWORD,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message.includes("already been registered")) {
        console.log(`  SKIP  ${u.email} (already exists)`);
        // Still update profile in case role/data changed
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (eu) => eu.email === u.email
        );
        if (existing) {
          await supabase.from("profiles").upsert({
            id: existing.id,
            display_name: u.display_name,
            handle: u.handle,
            role: u.role,
            bio: u.bio,
            zip: u.zip,
            district: u.district,
            city: "Compton",
            state: "CA",
            verification_status: u.verification_status,
          });
        }
        continue;
      }
      console.error(`  FAIL  ${u.email}: ${authError.message}`);
      continue;
    }

    const userId = authData.user.id;

    // Upsert profile
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: u.display_name,
      handle: u.handle,
      role: u.role,
      bio: u.bio,
      zip: u.zip,
      district: u.district,
      city: "Compton",
      state: "CA",
      verification_status: u.verification_status,
    });

    if (profileError) {
      console.error(`  FAIL  ${u.email} profile: ${profileError.message}`);
    } else {
      console.log(
        `  OK    ${u.email.padEnd(28)} ${u.role.padEnd(16)} ${u.display_name}`
      );
    }
  }

  console.log("\n──────────────────────────────────────────────");
  console.log("All accounts use password: " + TEST_PASSWORD);
  console.log("──────────────────────────────────────────────\n");
}

seedUsers().catch(console.error);
