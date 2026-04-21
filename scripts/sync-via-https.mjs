import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

const SUPABASE_URL = "https://fahqtnwwikvocpvvfgqi.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhaHF0bnd3aWt2b2NwdnZmZ3FpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDYyOTE3NSwiZXhwIjoyMDkwMjA1MTc1fQ.uk9GphoXwJP9v0AYbsqM1iUVqLpRZI9qRDgiK9cQOpQ";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const NEW_PASSWORD = 'HubCity2026!';

function handleToUuid(handle) {
  const h = createHash("sha256").update(`hubcity-creator:${handle}`).digest("hex");
  return [
    h.slice(0, 8),
    h.slice(8, 12),
    "4" + h.slice(13, 16),
    "8" + h.slice(17, 20),
    h.slice(20, 32),
  ].join("-");
}

const MANIFEST_HANDLES = [
  'beflyla', 'espresso', 'kevonstage', 'lil_duval', 'fene310', 'scentofhustle', 'andrespicer', 'wickdconfections'
];

const SPECIAL_CREATORS = [
  { id: 'a5000001-0001-4000-8000-0000000fe310', email: 'fene310@hubcity.app', handle: 'fene310', name: 'fene310', role: 'content_creator' },
  { id: 'a5000002-0002-4000-8000-000000ca4d01', email: 'comptonmuseum@hubcity.app', handle: 'comptonmuseum', name: 'Compton Art & History Museum', role: 'city_ambassador' },
  { id: 'b2000001-0002-4000-8000-000000000002', email: 'dominguez@hubcity.app', handle: 'dominguez_high', name: 'Dominguez High School', role: 'city_ambassador' },
  { id: 'a6000001-0001-4000-8000-000000000310', email: 'tonythe1@hubcity.app', handle: 'fakesmiles', name: 'Fake Smiles', role: 'business_owner' }
];

async function synchronize() {
  console.log("Starting sync via Supabase JS Client (HTTPS)...");

  // Note: We can't bulk update passwords via the JS client easily 
  // without looping through every user, which might be slow.
  // But we can ensure the main ones are set.

  for (const u of SPECIAL_CREATORS) {
    await provision(u.id, u.email, NEW_PASSWORD, u.name, u.handle, u.role);
  }

  for (const handle of MANIFEST_HANDLES) {
    const id = handleToUuid(handle);
    const email = `${handle}@seed.hubcityapp.local`;
    await provision(id, email, NEW_PASSWORD, handle, handle, 'content_creator');
  }

  console.log("\n=== Synchronization Complete ===");
}

async function provision(id, email, password, name, handle, role) {
  console.log(`Ensuring ${email}...`);
  
  // 1. Auth User
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    id: id,
    email: email,
    password: password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes("already registered") || authError.message.includes("exists")) {
      console.log(`  -> User exists, updating password...`);
      const { error: updateError } = await supabase.auth.admin.updateUserById(id, {
        password: password
      });
      if (updateError) console.error(`  ! Update password FAILED: ${updateError.message}`);
    } else {
      console.error(`  ! Auth create FAILED: ${authError.message}`);
    }
  } else {
    console.log(`  -> Created new auth user.`);
  }

  // 2. Profile
  const { error: pError } = await supabase.from('profiles').upsert({
    id: id,
    display_name: name,
    handle: handle,
    role: role,
    verification_status: 'verified',
    is_creator: true
  });

  if (pError) console.error(`  ! Profile upsert FAILED: ${pError.message}`);
  else console.log(`  -> Profile ensured.`);
}

synchronize().catch(console.error);
