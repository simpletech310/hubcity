import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const userId = 'a8000001-0001-4000-8000-000000000003';
    console.log("Updating handle, display_name, and avatar_url...");
    const { error } = await supabase.from('profiles').update({ 
        handle: 'leftright',
        display_name: 'LeftRight Entertainment',
        avatar_url: '/images/leftright/IMG_3114.jpg',
        role: 'content_creator',
        verification_status: 'verified',
        is_creator: true
    }).eq('id', userId);
    
    console.log("Error? ", error);

    const { data: d2 } = await supabase.from('profiles').select('id, handle, role').eq('id', userId).not('handle', 'is', null);
    console.log("Fixed profile:", d2);
}
main();
