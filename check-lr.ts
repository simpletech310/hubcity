import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const userId = 'a8000001-0001-4000-8000-000000000003';
    
    console.log("Checking profile...");
    const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId);
    console.log(profile, error);

    console.log("Checking events...");
    const { data: events, error: err2 } = await supabase.from('events').select('*').eq('created_by', userId);
    console.log(events, err2);
}
main();
