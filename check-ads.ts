import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: ads } = await supabase.from('video_ads').select('*').limit(10);
    console.log("Ads:", JSON.stringify(ads, null, 2));
}
main();
