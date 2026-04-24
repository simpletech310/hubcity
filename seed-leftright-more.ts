import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    if (!user) {
        console.error("LeftRight user not found");
        return;
    }
    const userId = user.id;

    // Seed Posts
    const postsToInsert = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Compton's rising stars in the building! The brunch vibes were immaculate. 🌟",
            image_url: '/images/leftright/IMG_3112.jpg',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Another sold out weekend at AY MI PA! Big shoutout to everyone pulling up. 🥂",
            image_url: '/images/leftright/IMG_3114.jpg',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "When the DJ drops that classic R&B cut and the whole venue sings along 🎤🎶",
            image_url: '/images/leftright/IMG_3118.jpg',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Bottomless mimosas and endless good energy. The LeftRight family knows how to turn up! 🥂",
            image_url: '/images/leftright/IMG_3119.jpg',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "VIP sections going crazy. We do this every Saturday! Secure your tables early. 🍾",
            image_url: '/images/leftright/IMG_3121.jpg',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    const { error: postErr } = await supabase.from('posts').insert(postsToInsert);
    console.log("Posts Insert Err:", postErr);

    // Seed Reels
    const reelsToInsert = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            video_url: '/images/leftright/leftright_reel_19601.mov',
            caption: 'The energy was absolutely unmatched!!! Compton let\'s go! 🔥',
            is_published: true,
            like_count: Math.floor(Math.random() * 2000) + 500,
            view_count: Math.floor(Math.random() * 10000) + 3000,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            video_url: '/images/leftright/leftright_reel_21021.mov',
            caption: 'POV: You secured the VIP booth for the wildest R&B brunch in the city. 🍾',
            is_published: true,
            like_count: Math.floor(Math.random() * 2000) + 500,
            view_count: Math.floor(Math.random() * 10000) + 3000,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            video_url: '/images/leftright/leftright_reel_24570.mov',
            caption: 'LeftRight Entertainment taking over the weekend. Pure vibes. 🥂',
            is_published: true,
            like_count: Math.floor(Math.random() * 2000) + 500,
            view_count: Math.floor(Math.random() * 10000) + 3000,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            video_url: '/images/leftright/leftright_reel_28959.mov',
            caption: 'When the whole venue knows the lyrics word for word! 🎤',
            is_published: true,
            like_count: Math.floor(Math.random() * 2000) + 500,
            view_count: Math.floor(Math.random() * 10000) + 3000,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    const { error: reelErr } = await supabase.from('reels').insert(reelsToInsert);
    console.log("Reels Insert Err:", reelErr);
    
    // Seed Gallery
    const galleryToInsert = [
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3112.jpg', display_order: 1 },
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3114.jpg', display_order: 2 },
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3118.jpg', display_order: 3 },
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3119.jpg', display_order: 4 },
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3121.jpg', display_order: 5 },
        { id: crypto.randomUUID(), owner_id: userId, image_url: '/images/leftright/IMG_3122.jpg', display_order: 6 },
    ];
    
    const { error: galErr } = await supabase.from('profile_gallery_images').insert(galleryToInsert);
    console.log("Gallery Insert Err:", galErr);
}
main();
