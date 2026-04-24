import pkg from 'pg';
import crypto from 'crypto';
const { Client } = pkg;

const c = new Client('postgresql://postgres:6jUT,kHkxtkt$3u@db.fahqtnwwikvocpvvfgqi.supabase.co:5432/postgres');

async function checkAndSeed() {
  try {
    console.log("Connecting to DB...");
    await c.connect();

    const userId = 'a8000001-0001-4000-8000-000000000003';

    // Verify user exists first
    const userRes = await c.query('SELECT display_name FROM profiles WHERE id = $1', [userId]);
    if (userRes.rowCount === 0) {
        console.log("LeftRight user not found. Did the primary seed script run?");
        return;
    }

    // Now seed posts for this account representing their past events
    // Posts images: e.g. IMG_3112.jpg, IMG_3115.jpg, IMG_3118.jpg, IMG_3119.jpg, IMG_3121.jpg, IMG_3122.jpg
    
    const posts = [
        {
            id: crypto.randomUUID(),
            body: "Just wrapped up our legendary Sneaker Gala! The energy was unmatched. The city really showed out for this one. Next one drops soon, don't miss out! 🔥👟 #LeftRightEnt #SneakerGala",
            media_urls: JSON.stringify(['/images/leftright/IMG_3112.jpg', '/images/leftright/IMG_3118.jpg']),
            like_count: 345,
            comment_count: 56,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 wks ago
        },
        {
            id: crypto.randomUUID(),
            body: "Pop-Up Lounge Vol. 3 was a movie! Shoutout to everyone who pulled up to vibe with us. If you weren't there, where were you? 👀🌴 #DayParty #LeftRightEnt",
            media_urls: JSON.stringify(['/images/leftright/IMG_3119.jpg', '/images/leftright/IMG_3122.jpg', '/images/leftright/IMG_3121.jpg']),
            like_count: 512,
            comment_count: 89,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
        },
        {
            id: crypto.randomUUID(),
            body: "R&B Brunch Saturday is OFFICIALLY sold out! The waitlist is open. AY MI PA! is about to go crazy. See y'all this weekend! 🥂🥞🎶",
            media_urls: JSON.stringify(['/images/leftright/IMG_3115.jpg']), // Assuming IMG_3115 is a promo flyer
            like_count: 289,
            comment_count: 140,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
        }
    ];

    for (const p of posts) {
        await c.query(`
            INSERT INTO public.posts (id, author_id, body, media_urls, is_published, like_count, comment_count, reaction_counts, created_at, updated_at)
            VALUES ($1, $2, $3, $4::jsonb, true, $5, $6, '{"heart": 100, "fire": 150}'::jsonb, $7, $7)
            ON CONFLICT (id) DO NOTHING;
        `, [p.id, userId, p.body, p.media_urls, p.like_count, p.comment_count, p.created_at]);
    }
    
    console.log("Seeded posts for LeftRight Entertainment successfully.");

    await c.end();
  } catch (err) {
    console.error("Error:", err);
  }
}

checkAndSeed();
