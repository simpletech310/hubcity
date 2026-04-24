import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: channel } = await supabase.from('channels').select('id').eq('slug', 'knect-tv-live').maybeSingle();
    if (!channel) return console.log("knect-tv-live channel not found");

    const now = new Date().toISOString();
    
    // Count total vs active
    const { count: total } = await supabase.from('scheduled_broadcasts').select('*', { count: 'exact', head: true }).eq('channel_id', channel.id);
    const { count: active } = await supabase.from('scheduled_broadcasts').select('*', { count: 'exact', head: true }).eq('channel_id', channel.id).gte('ends_at', now);
    
    console.log(`Total broadcasts: ${total}`);
    console.log(`Active (ends_at >= now): ${active}`);
}
main();
