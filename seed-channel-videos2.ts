import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: channel } = await supabase.from('channels').select('id, owner_id').eq('slug', 'leftright').single();

    const videosToInsert = [
        {
            id: crypto.randomUUID(),
            channel_id: channel.id,
            title: 'Welcome to LeftRight TV!',
            description: 'The energy was absolutely unmatched!!! Compton let\'s go! 🔥',
            video_type: 'original',
            video_url: '/images/leftright/leftright_reel_19601.mov',
            status: 'ready',
            is_published: true,
            published_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: Math.floor(Math.random() * 5000),
            is_featured: true,
            access_type: 'free',
            thumbnail_url: '/images/leftright/comedy_showcase.png'
        },
        {
            id: crypto.randomUUID(),
            channel_id: channel.id,
            title: 'VIP Booth Access',
            description: 'POV: You secured the VIP booth for the wildest R&B brunch in the city. 🍾',
            video_type: 'original',
            video_url: '/images/leftright/leftright_reel_21021.mov',
            status: 'ready',
            is_published: true,
            published_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: Math.floor(Math.random() * 5000),
            is_featured: false,
            access_type: 'free',
            thumbnail_url: '/images/leftright/IMG_3121.jpg'
        },
        {
            id: crypto.randomUUID(),
            channel_id: channel.id,
            title: 'Weekend Takeover',
            description: 'LeftRight Entertainment taking over the weekend. Pure vibes. 🥂',
            video_type: 'original',
            video_url: '/images/leftright/leftright_reel_24570.mov',
            status: 'ready',
            is_published: true,
            published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: Math.floor(Math.random() * 5000),
            is_featured: false,
            access_type: 'free',
            thumbnail_url: '/images/leftright/IMG_3114.jpg'
        },
        {
            id: crypto.randomUUID(),
            channel_id: channel.id,
            title: 'Sing Along Series',
            description: 'When the whole venue knows the lyrics word for word! 🎤',
            video_type: 'original',
            video_url: '/images/leftright/leftright_reel_28959.mov',
            status: 'ready',
            is_published: true,
            published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            view_count: Math.floor(Math.random() * 5000),
            is_featured: false,
            access_type: 'free',
            thumbnail_url: '/images/leftright/IMG_3118.jpg'
        }
    ];

    const { error: cvErr } = await supabase.from('channel_videos').insert(videosToInsert);
    console.log("Channel Videos Insert Err:", cvErr);
}
main();
