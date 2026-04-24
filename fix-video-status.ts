import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    
    // Update the 3 video posts to have status = 'ready'
    const { error } = await supabase.from('posts')
        .update({ video_status: 'ready' })
        .eq('author_id', user.id)
        .eq('media_type', 'video')
        .is('video_status', null);
        
    console.log("Video status fixed:", error);
}
main();
