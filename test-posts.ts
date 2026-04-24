import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    console.log("Checking columns for posts...");
    // Hacky but safe way to check columns using Supabase - do a limit 1 query
    const { data, error } = await supabase.from('posts').select('*').limit(1);
    if (data && data.length > 0) {
        console.log("Columns:", Object.keys(data[0]));
    } else {
        console.log("Empty or error:", error);
        
        // Let's seed using `image_urls` which is standard on our new schema
        console.log("Executing seed with image_urls...");
        
        const userId = 'a8000001-0001-4000-8000-000000000003';
        const posts = [
            {
                id: crypto.randomUUID(),
                author_id: userId,
                body: "Just wrapped up our legendary Sneaker Gala! The energy was unmatched. The city really showed out for this one. Next one drops soon, don't miss out! 🔥👟 #LeftRightEnt #SneakerGala",
                image_urls: ['/images/leftright/IMG_3112.jpg', '/images/leftright/IMG_3118.jpg'],
                like_count: 345,
                comment_count: 56,
                is_published: true,
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: crypto.randomUUID(),
                author_id: userId,
                body: "Pop-Up Lounge Vol. 3 was a movie! Shoutout to everyone who pulled up to vibe with us. If you weren't there, where were you? 👀🌴 #DayParty #LeftRightEnt",
                image_urls: ['/images/leftright/IMG_3119.jpg', '/images/leftright/IMG_3122.jpg', '/images/leftright/IMG_3121.jpg'],
                like_count: 512,
                comment_count: 89,
                is_published: true,
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: crypto.randomUUID(),
                author_id: userId,
                body: "R&B Brunch Saturday is OFFICIALLY sold out! The waitlist is open. AY MI PA! is about to go crazy. See y'all this weekend! 🥂🥞🎶",
                image_urls: ['/images/leftright/IMG_3115.jpg'],
                like_count: 289,
                comment_count: 140,
                is_published: true,
                created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
        ];

        for (const post of posts) {
            const { error: insertErr } = await supabase.from('posts').insert(post);
            if (insertErr) console.error("Error inserting post:", insertErr);
            else console.log("Post inserted!");
        }
    }
}
checkColumns();
