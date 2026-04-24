import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    // We Need More Real Channel exists (c6000001-0001-4000-8000-000000000310)
    // Beflyla user exists.
    
    // We will just create exactly what the user asked by plucking 2 random Mux Playback IDs
    // and labeling them as ads for these entities.
    const { data: randomVideos } = await supabase.from('channel_videos')
        .select('id, title, mux_asset_id, mux_playback_id, duration')
        .not('mux_playback_id', 'is', null)
        .neq('mux_playback_id', 'OQ81200s6tTa9sA1SscR015Ps3zxa3aoVS8G6XrQDJBJc') // not walmart
        .limit(10);
    
    const beflylaPlbk = randomVideos[3];
    const realPlbk = randomVideos[4];

    const newAds = [
        {
            id: crypto.randomUUID(),
            title: `Beflyla Official Promo`,
            mux_asset_id: beflylaPlbk.mux_asset_id,
            mux_playback_id: beflylaPlbk.mux_playback_id,
            ad_type: "pre_roll",
            duration: beflylaPlbk.duration,
            cta_text: "Shop Beflyla",
            cta_url: "/user/beflyla",
            is_active: true,
            impression_count: 0,
            click_count: 0
        },
        {
            id: crypto.randomUUID(),
            title: `We Need More Real Official Event Promo`,
            mux_asset_id: realPlbk.mux_asset_id,
            mux_playback_id: realPlbk.mux_playback_id,
            ad_type: "pre_roll",
            duration: realPlbk.duration,
            cta_text: "Get Tickets",
            cta_url: "/live/channel/we-need-more-real",
            is_active: true,
            impression_count: 0,
            click_count: 0
        }
    ];

    const { error: adErr } = await supabase.from('video_ads').insert(newAds);
    if(adErr) console.log("Insert Error:", adErr);

    // List all
    const { data: ads } = await supabase.from('video_ads').select('title').eq('is_active', true).eq('ad_type', 'pre_roll');
    console.log("Active commercials in full rotation pool:", ads?.map(a => a.title).join('\n'));
}
main();
