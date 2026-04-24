import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('id').eq('handle', 'leftright').single();
    
    const { data } = await supabase.from('posts').select('id, media_type, video_url, video_status, image_url').eq('author_id', user.id).eq('media_type', 'video');
        
    console.log("Video Posts State:", JSON.stringify(data, null, 2));
}
main();
