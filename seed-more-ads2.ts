import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // Grab 3 random Mux videos from the platform to act as Event Promos
    const { data: randomVideos } = await supabase.from('channel_videos')
        .select('id, title, mux_asset_id, mux_playback_id, duration')
        .not('mux_playback_id', 'is', null)
        .neq('mux_playback_id', 'OQ81200s6tTa9sA1SscR015Ps3zxa3aoVS8G6XrQDJBJc') // Not walmart
        .limit(3);

    if (!randomVideos || randomVideos.length === 0) return console.log("Random videos not found");

    const newAds = randomVideos.map((v, i) => ({
        id: crypto.randomUUID(),
        title: `LeftRight Entertainment Promo — Event ${i+1}`,
        mux_asset_id: v.mux_asset_id,
        mux_playback_id: v.mux_playback_id,
        ad_type: "pre_roll",
        duration: v.duration,
        cta_text: "Get Tickets",
        cta_url: "/user/leftright",
        is_active: true,
        impression_count: 0,
        click_count: 0
    }));

    const { error: adErr } = await supabase.from('video_ads').insert(newAds);
    console.log("Ads Insert Err:", adErr);
}
main();
