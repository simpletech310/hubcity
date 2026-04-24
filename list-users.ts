import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: users } = await supabase.from('profiles').select('id, handle, display_name');
    console.log("Users:", users?.map(u => u.handle + ' / ' + u.display_name));
}
main();
