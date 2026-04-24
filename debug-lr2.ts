import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const userId = 'a8000001-0001-4000-8000-000000000003';
    
    let { data: d1 } = await supabase.from('profiles').select('id, handle, role').eq('id', userId);
    console.log("No filters:", d1);

    let { data: d2 } = await supabase.from('profiles').select('id, handle, role').eq('id', userId).not('handle', 'is', null);
    console.log("With handle not null:", d2);

    let { data: d3 } = await supabase.from('profiles').select('id, handle, role').eq('id', userId).in('role', ['content_creator', 'city_ambassador', 'resource_provider', 'chamber_admin']);
    console.log("With role in array:", d3);
}
main();
