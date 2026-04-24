import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: channels } = await supabase.from('channels').select('id, name, slug').or('name.ilike.%real%,slug.ilike.%real%');
    console.log("Real channels:", channels);
}
main();
