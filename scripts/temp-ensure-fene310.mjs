import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const EMAIL = "fene310@hubcity.app";
const PASSWORD = "HubCity123";
// This is the hardcoded UUID used in migration/seed files for fene310
const FIXED_USER_ID = "a5000001-0001-4000-8000-0000000fe310";

async function ensureUser() {
  console.log(`Ensuring user exists: ${EMAIL}`);

  // Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) throw listError;

  const existingUser = users.find(u => u.email === EMAIL);

  if (existingUser) {
    console.log(`User already exists with ID: ${existingUser.id}. Resetting password...`);
    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: PASSWORD,
      email_confirm: true
    });
    if (updateError) throw updateError;
    console.log("Password reset successfully.");
  } else {
    console.log(`User missing. Creating with ID: ${FIXED_USER_ID}...`);
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
      id: FIXED_USER_ID,
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (createError) throw createError;
    console.log(`User created successfully with ID: ${user.id}`);
  }

  // Ensure profile exists
  console.log("Checking profile...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", FIXED_USER_ID)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Profile check error:", profileError.message);
  } else if (!profile) {
    console.log("Profile missing. Creating...");
    const { error: insertError } = await supabase.from("profiles").insert({
      id: FIXED_USER_ID,
      email: EMAIL,
      display_name: "fene310",
      handle: "fene310",
      role: "content_creator",
      verification_status: "verified"
    });
    if (insertError) console.error("Profile creation error:", insertError.message);
    else console.log("Profile created.");
  } else {
    console.log("Profile exists.");
  }
}

ensureUser().catch(err => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
