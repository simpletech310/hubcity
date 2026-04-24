import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const eventId = 'a8000001-0001-4000-8000-000000000004';
    console.log("Setting LeftRight event to featured...");
    const { error } = await supabase.from('events').update({ is_featured: true }).eq('id', eventId);
    console.log("Done:", error);
}
main();
