import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    
    // Set the slug to 'leftright'
    const { error } = await supabase.from('channels')
        .update({ slug: 'leftright', scope: 'national' }) // setting scope to national just in case city context fails on their client
        .eq('owner_id', user.id);
        
    console.log("Channel Slug Fix:", error);
}
main();
