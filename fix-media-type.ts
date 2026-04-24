import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    
    // Set media_type to 'image' for all LeftRight posts that have an image_url but no video_url
    const { error } = await supabase.from('posts')
        .update({ media_type: 'image' })
        .eq('author_id', user.id)
        .is('video_url', null)
        .not('image_url', 'is', null);
        
    console.log("Media types fixed:", error);
}
main();
