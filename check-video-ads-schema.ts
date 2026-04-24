import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: cols } = await supabase.rpc('get_schema_columns', { table_name: 'video_ads' });
    console.log(cols || "No rpc, let's query the table.");
    // just try to select image_url to see if it throws!
    const { data, error } = await supabase.from('video_ads').select('image_url').limit(1);
    console.log("Error selecting image_url:", error?.message || "Success! Column exists.");
}
main();
