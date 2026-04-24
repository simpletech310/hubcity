import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const { data: user } = await supabase.from('profiles').select('*').eq('handle', 'leftright').single();
    const userId = user.id;

    // Compton city_id
    const { data: compton } = await supabase.from('cities').select('id').eq('slug', 'compton').single();
    const cityId = compton.id;

    const today = new Date();
    
    // Create 3 Events
    const events = [
        {
            id: crypto.randomUUID(),
            created_by: userId,
            city_id: cityId,
            slug: 'open-mic-night-' + Date.now(),
            title: 'Open Mic Night',
            description: 'Laughter, drinks & good vibes. Come see local talent, stand-up, and improv.',
            category: 'culture',
            start_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '19:30',
            location_name: 'The Laughing Owl',
            address: '147 Dark Avenue, Cityville',
            image_url: '/images/leftright/comedy_open_mic.png',
            is_ticketed: true,
            is_published: true,
            visibility: 'public',
        },
        {
            id: crypto.randomUUID(),
            created_by: userId,
            city_id: cityId,
            slug: 'laugh-therapy-' + Date.now(),
            title: 'Laugh Therapy',
            description: 'A Stand-up Comedy Show! Featuring top comedians.',
            category: 'culture',
            start_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '20:00',
            location_name: 'The Comedy Attic',
            address: '123 Laughter Lane',
            image_url: '/images/leftright/comedy_laugh_therapy.png',
            is_ticketed: true,
            is_published: true,
            visibility: 'public',
        },
        {
            id: crypto.randomUUID(),
            created_by: userId,
            city_id: cityId,
            slug: 'leftright-comedy-showcase-' + Date.now(),
            title: 'LeftRight Comedy Showcase',
            description: 'A night of laughter, lies, & live stand-up.',
            category: 'culture',
            start_date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            start_time: '20:00',
            location_name: 'The Laugh Pad',
            address: '123 Urban Ave',
            image_url: '/images/leftright/comedy_showcase.png',
            is_ticketed: true,
            is_published: true,
            visibility: 'public',
            is_featured: true
        }
    ];

    const { error: evErr } = await supabase.from('events').insert(events);
    console.log("Events Insert Err:", evErr);
}
main();
