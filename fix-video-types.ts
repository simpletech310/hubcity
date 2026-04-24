import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('*').eq('handle', 'leftright').single();
    const userId = user.id;

    // 1. Delete all channel_videos from LeftRight's channel
    const { data: channel } = await supabase.from('channels').select('id').eq('owner_id', userId).single();
    if (channel) {
        await supabase.from('channel_videos').delete().eq('channel_id', channel.id);
        console.log("Deleted LeftRight channel videos");
    }

    // 2. Delete the 3 large videos from the reels table
    const largeVideos = [
        '/images/leftright/leftright_reel_19601.mov',
        '/images/leftright/leftright_reel_21021.mov',
        '/images/leftright/leftright_reel_28959.mov'
    ];
    const { error: delReelErr } = await supabase.from('reels').delete().in('video_url', largeVideos).eq('author_id', userId);
    console.log("Deleted large reels:", delReelErr);

    // 3. Insert the 3 large videos into the posts table as video posts
    const videoPosts = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "The energy was absolutely unmatched!!! Compton let's go! 🔥",
            media_type: 'video',
            video_url: largeVideos[0],
            video_path: largeVideos[0], 
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "POV: You secured the VIP booth for the wildest R&B brunch in the city. 🍾",
            media_type: 'video',
            video_url: largeVideos[1],
            video_path: largeVideos[1], 
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "When the whole venue knows the lyrics word for word! 🎤",
            media_type: 'video',
            video_url: largeVideos[2],
            video_path: largeVideos[2], 
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];

    const { error: postErr } = await supabase.from('posts').insert(videoPosts);
    console.log("Posts Insert Err:", postErr);
}
main();
