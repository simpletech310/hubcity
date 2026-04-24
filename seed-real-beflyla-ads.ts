import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // We Need More Real Channel
    const { data: realChannel } = await supabase.from('channels').select('id, name, owner_id').eq('slug', 'we-need-more-real').single();
    // Beflyla Channel 
    // They might not have a channel, let's grab their user id
    const { data: beUser } = await supabase.from('profiles').select('id').eq('handle', 'beflyla').single();
    
    // Grab videos for both
    let realVideos = [];
    if (realChannel) {
        const { data: v } = await supabase.from('channel_videos')
            .select('id, title, mux_asset_id, mux_playback_id, duration')
            .eq('channel_id', realChannel.id)
            .not('mux_playback_id', 'is', null)
            .limit(2);
        if (v) realVideos = v;
    }

    let beVideos = [];
    if (beUser) {
        // Did they use channel or reels? Let's check reels or channel_videos
        const { data: cb } = await supabase.from('channels').select('id').eq('owner_id', beUser.id).single();
        if (cb) {
            const { data: v2 } = await supabase.from('channel_videos')
                .select('id, title, mux_asset_id, mux_playback_id, duration')
                .eq('channel_id', cb.id)
                .not('mux_playback_id', 'is', null)
                .limit(2);
            if (v2) beVideos = v2;
        } else {
            console.log("No beflyla channel found");
        }
    }

    const allVideos = [...realVideos, ...beVideos];
    if (allVideos.length === 0) return console.log("No videos found to act as ads");

    const newAds = allVideos.map((v, i) => ({
        id: crypto.randomUUID(),
        title: `Sponsored Content: ${v.title}`,
        mux_asset_id: v.mux_asset_id,
        mux_playback_id: v.mux_playback_id,
        ad_type: "pre_roll",
        duration: v.duration,
        cta_text: "Shop Now",
        cta_url: "/user/beflyla", // default
        is_active: true,
        impression_count: 0,
        click_count: 0
    }));

    const { error: adErr } = await supabase.from('video_ads').insert(newAds);
    console.log(`Inserted ${newAds.length} video ads. Err:`, adErr);

    // List them
    const { data: ads } = await supabase.from('video_ads').select('title').eq('is_active', true).eq('ad_type', 'pre_roll');
    console.log("Active commercials now in pool:", ads?.map(a => a.title).join('\n'));
}
main();
