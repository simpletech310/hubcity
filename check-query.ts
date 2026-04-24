import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: cities } = await supabase.from('cities').select('id, name').eq('slug', 'compton').single();
    if (!cities) return;
    
    console.log("Compton ID:", cities.id);

    const { data: events } = await supabase
        .from("events")
        .select("id, title, city_id, is_ticketed")
        .eq("is_published", true)
        .eq("city_id", cities.id)
        .or("visibility.eq.public,visibility.is.null")
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
        
    console.log("Events:", events);

    const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['content_creator', 'city_ambassador', 'resource_provider', 'chamber_admin'])
        .not('handle', 'is', null);

    console.log("Creators:", profiles?.map(p => p.handle));
}
main();
