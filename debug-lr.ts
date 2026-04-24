import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const userId = 'a8000001-0001-4000-8000-000000000003';
    console.log("Checking exact match...");
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, handle, role')
        .eq('id', userId)
        .in('role', ['content_creator', 'city_ambassador', 'resource_provider', 'chamber_admin'])
        .not('handle', 'is', null);

    console.log("Match returned:", profile, error);
}
main();
