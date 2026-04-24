import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: bUser } = await supabase.from('profiles').select('id').eq('handle', 'beflyla').single();
    const { data: realChannel } = await supabase.from('channels').select('id, owner_id').eq('slug', 'we-need-more-real').single();
    
    // Check reels
    if (bUser) {
        const { data: br } = await supabase.from('reels').select('id, mux_playback_id').eq('author_id', bUser.id);
        console.log("Beflyla Reels:", br?.length);
    }
    
    if (realChannel) {
        const { data: rc } = await supabase.from('channel_videos').select('id, mux_playback_id').eq('channel_id', realChannel.id);
        console.log("Real Channel Videos:", rc?.length, "Has Mux:", rc?.filter(v => v.mux_playback_id).length);
        const { data: rr } = await supabase.from('reels').select('id, mux_playback_id').eq('author_id', realChannel.owner_id);
        console.log("Real Reels:", rr?.length);
    }
}
main();
