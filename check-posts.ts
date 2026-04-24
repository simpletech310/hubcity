import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data } = await supabase.from('posts').select('*').limit(1);
    console.log("posts columns:", data ? Object.keys(data[0] || {}) : "No records");
}
main();
