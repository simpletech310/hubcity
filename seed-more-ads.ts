import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: channel } = await supabase.from('channels').select('id, owner_id').eq('slug', 'leftright').single();

    // Grab LeftRight TV videos that have mux playbacks attached
    const { data: lrVideos } = await supabase.from('channel_videos')
        .select('id, title, mux_asset_id, mux_playback_id, duration')
        .eq('channel_id', channel.id)
        .not('mux_playback_id', 'is', null)
        .limit(3);

    if (!lrVideos || lrVideos.length === 0) return console.log("LeftRight TV videos not found");

    const newAds = lrVideos.map((v, i) => ({
        id: crypto.randomUUID(),
        title: `Event Promo — LeftRight: ${v.title}`,
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
