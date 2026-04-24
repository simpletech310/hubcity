import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: ads } = await supabase.from('video_ads').select('title').eq('is_active', true).eq('ad_type', 'pre_roll');
    console.log("Active commercials in rotation pool:", ads?.map(a => a.title).join('\n'));
}
main();
