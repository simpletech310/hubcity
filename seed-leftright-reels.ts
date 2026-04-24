import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    const userId = user.id;

    // Seed Reels again with video_path
    const reelsToInsert = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            video_url: '/images/leftright/leftright_reel_19601.mov',
            video_path: '/images/leftright/leftright_reel_19601.mov',
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
            video_path: '/images/leftright/leftright_reel_21021.mov',
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
            video_path: '/images/leftright/leftright_reel_24570.mov',
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
            video_path: '/images/leftright/leftright_reel_28959.mov',
            caption: 'When the whole venue knows the lyrics word for word! 🎤',
            is_published: true,
            like_count: Math.floor(Math.random() * 2000) + 500,
            view_count: Math.floor(Math.random() * 10000) + 3000,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    const { error: reelErr } = await supabase.from('reels').insert(reelsToInsert);
    console.log("Reels Insert Err:", reelErr);
}
main();
