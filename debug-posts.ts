import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: bUser } = await supabase.from('profiles').select('id, handle').eq('handle', 'beflyla').single();
    const { data: realUser } = await supabase.from('profiles').select('id, handle').eq('handle', 'andrespicer').single(); // "We Need More Real" might be andrespicer
    const { data: realChannel } = await supabase.from('channels').select('id, owner_id').eq('slug', 'we-need-more-real').single();
    
    // check posts with videos
    if (bUser) {
        const { data: bp } = await supabase.from('posts').select('id, video_url').eq('user_id', bUser.id).not('video_url', 'is', null);
        console.log("Beflyla Video Posts:", bp?.length);
        console.log(bp);
    }
    
    if (realChannel) {
        const { data: rp } = await supabase.from('posts').select('id, video_url').eq('user_id', realChannel.owner_id).not('video_url', 'is', null);
        console.log("Real Channel Video Posts:", rp?.length);
        console.log(rp);
    }
}
main();
