import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: cols } = await supabase.rpc('query_schema', {}).select('*'); 
    // Supabase JS doesn't have an easy schema viewer without direct sql, let's just try to select 1 row from event_ticket_config to see the keys.
    const { data: config } = await supabase.from('event_ticket_config').select('*').limit(1);
    console.log("config keys:", config ? Object.keys(config[0] || {}) : null);
}
main();
