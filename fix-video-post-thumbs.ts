import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    
    // Update the 3 posts
    await supabase.from('posts').update({ image_url: '/images/leftright/leftright_reel_19601_thumb.png' })
        .eq('video_url', '/images/leftright/leftright_reel_19601.mov')
        .eq('author_id', user.id);

    await supabase.from('posts').update({ image_url: '/images/leftright/leftright_reel_21021_thumb.png' })
        .eq('video_url', '/images/leftright/leftright_reel_21021.mov')
        .eq('author_id', user.id);

    await supabase.from('posts').update({ image_url: '/images/leftright/leftright_reel_28959_thumb.png' })
        .eq('video_url', '/images/leftright/leftright_reel_28959.mov')
        .eq('author_id', user.id);
        
    console.log("Post thumbnails updated!");
}
main();
