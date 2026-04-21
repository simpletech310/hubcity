import pkg from 'pg';
const { Client } = pkg;
import { createHash } from 'node:crypto';

const c = new Client('postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres');

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
  try {
    console.log("Connecting to DB...");
    await c.connect();
    
    console.log("Beginning transaction...");
    await c.query('BEGIN');

    // 1. Update EVERYONE in auth.users to the new password
    console.log(`Setting all existing auth.users password to: ${NEW_PASSWORD}`);
    const bulkUpdate = await c.query(`
      UPDATE auth.users 
      SET encrypted_password = crypt($1, gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now())
    `, [NEW_PASSWORD]);
    console.log(`  -> Updated ${bulkUpdate.rowCount} users.`);

    // 2. Ensure Special Creators
    for (const u of SPECIAL_CREATORS) {
      console.log(`Ensuring special creator: ${u.email}`);
      await upsertUser(u.id, u.email, NEW_PASSWORD, u.name, u.handle, u.role);
    }

    // 3. Ensure Manifest Creators
    for (const handle of MANIFEST_HANDLES) {
      const id = handleToUuid(handle);
      const email = `${handle}@seed.hubcityapp.local`;
      console.log(`Ensuring manifest creator: ${email}`);
      await upsertUser(id, email, NEW_PASSWORD, handle, handle, 'content_creator');
    }

    await c.query('COMMIT');
    console.log("\n=== Synchronization Complete ===");
    await c.end();
  } catch (err) {
    if (c) await c.query('ROLLBACK');
    console.error("Synchronization Error:", err.message);
    process.exit(1);
  }
}

async function upsertUser(id, email, password, name, handle, role) {
  // Upsert into auth.users
  await c.query(`
    INSERT INTO auth.users (
      id, instance_id, aud, role, email, encrypted_password, 
      email_confirmed_at, 
      raw_app_meta_data, raw_user_meta_data, 
      created_at, updated_at, is_sso_user, is_anonymous
    ) VALUES (
      $1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', $2, 
      crypt($3, gen_salt('bf')), now(), 
      '{"provider":"email","providers":["email"]}', '{}', 
      now(), now(), false, false
    ) ON CONFLICT (id) DO UPDATE SET 
      encrypted_password = crypt($3, gen_salt('bf')),
      email = $2,
      email_confirmed_at = COALESCE(auth.users.email_confirmed_at, now())
  `, [id, email, password]);

  // Upsert into auth.identities
  await c.query(`
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      $1, $1, jsonb_build_object('sub', $1, 'email', $2), 'email', now(), now(), now()
    ) ON CONFLICT (provider, id) DO NOTHING
  `, [id, email]);

  // Ensure profile exists in public.profiles
  await c.query(`
    INSERT INTO public.profiles (
      id, display_name, handle, role, verification_status, city, state, is_creator
    ) VALUES (
      $1, $2, $3, $4, 'verified', 'Compton', 'CA', true
    ) ON CONFLICT (id) DO UPDATE SET 
      role = $4,
      verification_status = 'verified',
      is_creator = true
  `, [id, name, handle, role]);
}

synchronize();
