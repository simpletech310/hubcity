import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log("Executing seed with image_url (legacy column array/string handling)...");
    
    // We saw image_url on the schema, but we want an array. We will store it as a JSON string or take just the first image if it's a string column. Let's see if image_urls exists or we just use image_url and serialize or use the first image.
    
    // Check type of image_url
    const userId = 'a8000001-0001-4000-8000-000000000003';
    
    const posts = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Just wrapped up our legendary Sneaker Gala! The energy was unmatched. The city really showed out for this one. Next one drops soon, don't miss out! 🔥👟 #LeftRightEnt #SneakerGala",
            image_url: '/images/leftright/IMG_3112.jpg',
            like_count: 345,
            comment_count: 56,
            is_published: true,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Pop-Up Lounge Vol. 3 was a movie! Shoutout to everyone who pulled up to vibe with us. If you weren't there, where were you? 👀🌴 #DayParty #LeftRightEnt",
            image_url: '/images/leftright/IMG_3119.jpg',
            like_count: 512,
            comment_count: 89,
            is_published: true,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "R&B Brunch Saturday is OFFICIALLY sold out! The waitlist is open. AY MI PA! is about to go crazy. See y'all this weekend! 🥂🥞🎶",
            image_url: '/images/leftright/IMG_3115.jpg',
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
seed();
