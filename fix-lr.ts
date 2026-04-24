import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const userId = 'a8000001-0001-4000-8000-000000000003';
    
    const { data: cities, error } = await supabase.from('cities').select('*');
    console.log("Cities:", cities);

    const compton = cities?.find(c => c.name.toLowerCase().includes('compton'));
    
    if (compton) {
        console.log("Updating profile city_id to", compton.id);
        await supabase.from('profiles').update({ city_id: compton.id, bio: 'Event curation and lifestyle collective bringing the best vibes to the city. From sold out sneaker galas to R&B brunches, we set the tone. 🌴🔥' }).eq('id', userId);
        
        console.log("Updating event city_id to", compton.id);
        await supabase.from('events').update({ city_id: compton.id }).eq('created_by', userId);
    }
}
main();
