import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { error } = await supabase.from('reels')
        .update({ poster_url: '/images/leftright/leftright_reel_thumb.png', poster_path: '/images/leftright/leftright_reel_thumb.png' })
        .eq('video_url', '/images/leftright/leftright_reel_24570.mov');
    console.log("Reel poster updated:", error);
}
main();
