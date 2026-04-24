import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: v } = await supabase.from('channel_videos').select('id, title, mux_playback_id').ilike('title', '%walmart%');
    console.log("Videos:", v);
}
main();
