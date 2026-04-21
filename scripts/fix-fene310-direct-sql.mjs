import pkg from 'pg';
const { Client } = pkg;

const c = new Client('postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres');

const EMAIL = 'fene310@hubcity.app';
const PASSWORD = 'HubCity123';
const FIXED_USER_ID = 'a5000001-0001-4000-8000-0000000fe310';

async function fix() {
  try {
    console.log("Connecting to DB...");
    await c.connect();
    
    console.log("Beginning transaction...");
    await c.query('BEGIN');

    // Ensure pgcrypto
    await c.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    // Insert into auth.users (minimal required columns)
    console.log("Inserting into auth.users...");
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
        email_confirmed_at = now()
    `, [FIXED_USER_ID, EMAIL, PASSWORD]);

    // Insert into auth.identities
    console.log("Inserting into auth.identities...");
    await c.query(`
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
      ) VALUES (
        $1, $1, jsonb_build_object('sub', $1, 'email', $2), 'email', now(), now(), now()
      ) ON CONFLICT (provider, id) DO NOTHING
    `, [FIXED_USER_ID, EMAIL]);

    // Ensure profile exists in public.profiles
    console.log("Ensuring profile in public.profiles...");
    await c.query(`
      INSERT INTO public.profiles (
        id, display_name, handle, role, verification_status, city, state
      ) VALUES (
        $1, 'fene310', 'fene310', 'content_creator', 'verified', 'Compton', 'CA'
      ) ON CONFLICT (id) DO UPDATE SET 
        role = 'content_creator',
        verification_status = 'verified'
    `, [FIXED_USER_ID]);

    await c.query('COMMIT');
    console.log("Successfully created/updated fene310 account via SQL.");
    await c.end();
  } catch (err) {
    await c.query('ROLLBACK');
    console.error("SQL Error:", err.message);
    await c.end();
  }
}

fix();
