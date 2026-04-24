import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: events } = await supabase
        .from("events")
        .select("id, title, city_id, is_published, visibility, created_at")
        .order("created_at", { ascending: false })
        .limit(5);
        
    console.log("Recent Events:", events);
}
main();
