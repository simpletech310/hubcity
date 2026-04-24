import pkg from 'pg';
import fs from 'fs';
import path from 'path';
const { Client } = pkg;

const c = new Client('postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres');

async function checkAndSeed() {
  try {
    console.log("Connecting to DB...");
    await c.connect();
    
    const sourceDir = '/Users/tj/Documents/Claude/Projects/HubCity MVP/Assets/leftright post';
    const destDir = '/Users/tj/Documents/Claude/Projects/HubCity MVP/hubcity-app/public/images/leftright';
    
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    const files = fs.readdirSync(sourceDir);
    for (const file of files) {
      if (file !== '.DS_Store') {
        fs.copyFileSync(path.join(sourceDir, file), path.join(destDir, file));
      }
    }
    console.log("Copied assets to public/images/leftright");

    const userId = 'a8000001-0001-4000-8000-000000000003';
    
    // Auth user
    await c.query(`
      INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, confirmation_token, recovery_token, email_change_token_new, email_change)
      VALUES ($1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'leftright@hubcity.app', crypt('HubCity2026!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), false, '', '', '', '')
      ON CONFLICT (id) DO UPDATE SET encrypted_password = crypt('HubCity2026!', gen_salt('bf')), email = 'leftright@hubcity.app';
    `, [userId]);

    await c.query(`
      INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
      VALUES ($1::uuid, $1::uuid, $1::text, 'email', jsonb_build_object('sub', $1::text, 'email', 'leftright@hubcity.app'), now(), now(), now())
      ON CONFLICT DO NOTHING;
    `, [userId]);

    // Profile
    await c.query(`
      INSERT INTO public.profiles (id, display_name, handle, role, verification_status, city, state, is_creator, onboarding_completed, avatar_url)
      VALUES ($1, 'LeftRight Entertainment', 'leftright', 'content_creator', 'verified', 'Riverside', 'CA', true, true, '/images/leftright/IMG_3114.jpg')
      ON CONFLICT (id) DO UPDATE SET role = 'content_creator', verification_status = 'verified', is_creator = true, onboarding_completed = true;
    `, [userId]);

    console.log("User leftright@hubcity.app seeded.");

    const eventColsQuery = await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'events';");
    const cols = eventColsQuery.rows.map(r => r.column_name);
    console.log("Event columns:", cols);

    const hasTicketPrice = cols.includes('ticket_price');
    const hasIsTicketed = cols.includes('is_ticketed');
    const hasTicketUrl = cols.includes('ticket_url');

    // Create the event based on available schema
    const eventId = 'a8000001-0001-4000-8000-000000000004';
    
    // We will build the query dynamically depending on exactly what ticket columns exist
    let colsToInsert = ['id', 'title', 'slug', 'description', 'category', 'start_date', 'start_time', 'location_name', 'address', 'image_url', 'is_published', 'created_by'];
    let vals = [
      eventId,
      'R&B Brunch Saturday at AY MI PA!',
      'rb-brunch-saturday-aymipa',
      'Live DJ at 11:30. Buy One Get One Bottomless Mimosas! Brunch starts at 10 AM. VIP and Reservations via OpenTable.',
      'culture',
      '2026-04-25',
      '10:00:00',
      'AY MI PA! Dine and Lounge',
      'Riverside, CA',
      '/images/leftright/IMG_3111.jpg',
      true,
      userId
    ];

    if (hasIsTicketed) {
      colsToInsert.push('is_ticketed');
      vals.push(true);
    }
    if (hasTicketPrice) {
      colsToInsert.push('ticket_price');
      vals.push(2000); // 20 bucks
    }
    if (hasTicketUrl) {
      colsToInsert.push('ticket_url');
      vals.push('https://opentable.com');
    }

    const placeholders = vals.map((_, i) => '$' + (i + 1)).join(', ');
    const query = "INSERT INTO public.events (" + colsToInsert.join(', ') + ") VALUES (" + placeholders + ") ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title;";
    await c.query(query, vals);
    console.log("Ticketed event seeded successfully.");

    await c.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkAndSeed();
