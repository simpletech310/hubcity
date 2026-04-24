import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function main() {
    const { data: cities } = await supabase.from('cities').select('id').eq('slug', 'compton').single();
    if (!cities) return;
    
    console.log("Compton ID:", cities.id);

    const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_published", true)
        .or("visibility.eq.public,visibility.is.null")
        .eq("city_id", cities.id)
        .order("is_featured", { ascending: false })
        .order("start_date", { ascending: true });
        
    console.log("Total events:", events?.length);
    console.log("Error:", error);
    
    const lrEvent = events?.find(e => e.title.includes('R&B Brunch'));
    if (lrEvent) {
        console.log("LR Event found:", lrEvent.id, lrEvent.start_date, lrEvent.category);
    } else {
        console.log("LR EVENT IS ENTIRELY MISSING FOR ANON KEY!");
    }
}
main();
