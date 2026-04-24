import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // 1. Get the leftright channel
    const { data: channel } = await supabase.from('channels').select('id, owner_id').eq('slug', 'leftright').single();
    if (!channel) return console.log("channel not found");

    // 2. Fetch the existing broken LeftRight videos
    const { data: lrVideos } = await supabase.from('channel_videos').select('id, title').eq('channel_id', channel.id);
    if (!lrVideos || lrVideos.length === 0) return console.log("LeftRight videos not found");

    // 3. Find 4 real mux videos
    const { data: muxVideos } = await supabase.from('channel_videos')
        .select('mux_asset_id, mux_playback_id, duration')
        .not('mux_playback_id', 'is', null)
        .neq('channel_id', channel.id) // Get from other channels
        .limit(4);

    if (!muxVideos || muxVideos.length < 4) return console.log("Not enough mux videos found");

    // 4. Update the LR videos
    const updates = [
        {
            id: lrVideos[0].id,
            video_type: 'featured', // 'mux' might not be in the constraint, earlier check showed 'original', 'featured'. If we use Mux, it is usually handled as 'featured' or 'original'. Wait!
            mux_playback_id: muxVideos[0].mux_playback_id,
            mux_asset_id: muxVideos[0].mux_asset_id,
            duration: muxVideos[0].duration,
            video_url: null,
            thumbnail_url: '/images/leftright/comedy_showcase.png'
        },
        {
            id: lrVideos[1].id,
            video_type: 'featured',
            mux_playback_id: muxVideos[1].mux_playback_id,
            mux_asset_id: muxVideos[1].mux_asset_id,
            duration: muxVideos[1].duration,
            video_url: null,
            thumbnail_url: '/images/leftright/comedy_laugh_therapy.png'
        },
        {
            id: lrVideos[2].id,
            video_type: 'featured',
            mux_playback_id: muxVideos[2].mux_playback_id,
            mux_asset_id: muxVideos[2].mux_asset_id,
            duration: muxVideos[2].duration,
            video_url: null,
            thumbnail_url: '/images/leftright/comedy_open_mic.png'
        },
        {
            id: lrVideos[3].id,
            video_type: 'featured',
            mux_playback_id: muxVideos[3].mux_playback_id,
            mux_asset_id: muxVideos[3].mux_asset_id,
            duration: muxVideos[3].duration,
            video_url: null,
            thumbnail_url: '/images/leftright/IMG_3112.jpg'
        }
    ];

    for (const update of updates) {
        const { error } = await supabase.from('channel_videos').update({
            video_type: update.video_type,
            mux_playback_id: update.mux_playback_id,
            mux_asset_id: update.mux_asset_id,
            duration: update.duration,
            video_url: update.video_url,
            thumbnail_url: update.thumbnail_url
        }).eq('id', update.id);
        if (error) console.log("Update err for", update.id, error);
    }
    
    console.log("Videos updated to use MUX placeholders!");
}
main();
