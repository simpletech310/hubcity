import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: q } = await supabase.from('posts').select('id, image_url, user_id').not('image_url', 'is', null).limit(10);
    console.log("Post Images:", q);
}
main();
