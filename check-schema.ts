import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data, error } = await supabase.rpc('get_schema_columns', { table_name: 'video_ads' });
    if (error) {
        // Fallback: just select * from the real DB view
        console.log("Error falling back...");
        const { data: cols } = await supabase.from('video_ads').select('*').limit(10);
        console.log(cols);
    } else {
        console.log(data);
    }
}
main();
