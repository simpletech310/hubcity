import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: users } = await supabase.from('profiles').select('id, handle, display_name').or('handle.ilike.%beflyyla%,handle.ilike.%real%');
    console.log("Users:", JSON.stringify(users, null, 2));
}
main();
