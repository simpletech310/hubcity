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

    // Check for a channel
    const { data: channelData } = await supabase.from('channels').select('id').eq('owner_id', userId).single();
    let channelId = channelData?.id;

    if (!channelId) {
        channelId = crypto.randomUUID();
        const { error: chErr } = await supabase.from('channels').insert({
            id: channelId,
            owner_id: userId,
            city_id: cityId,
            name: 'LeftRight TV',
            description: 'The official channel for LeftRight Entertainment',
            icon_url: user.avatar_url,
            banner_url: '/images/leftright/comedy_showcase.png',
            follower_count: Math.floor(Math.random() * 5000),
            is_active: true
        });
        if (chErr) console.error("Channel insert:", chErr);
    } else {
        // Just update banner url
        await supabase.from('channels').update({ banner_url: '/images/leftright/comedy_showcase.png' }).eq('id', channelId);
    }

    const today = new Date();
    
    // Create 3 Events
    const events = [
        {
            id: crypto.randomUUID(),
            created_by: userId,
            city_id: cityId,
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

    // Create 3 Posts referencing the posters
    const posts = [
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Who's ready for Open Mic Night? 🎤 Come see the best local talent hit the stage!",
            image_url: '/images/leftright/comedy_open_mic.png',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "Need a prescription for joy? Come to Laugh Therapy! We've got the cure right here.",
            image_url: '/images/leftright/comedy_laugh_therapy.png',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
        },
        {
            id: crypto.randomUUID(),
            author_id: userId,
            body: "The LeftRight Comedy Showcase is officially ON. Get your tickets before they sell out!",
            image_url: '/images/leftright/comedy_showcase.png',
            like_count: Math.floor(Math.random() * 500) + 100,
            comment_count: Math.floor(Math.random() * 100) + 20,
            is_published: true,
        }
    ];

    const { error: postErr } = await supabase.from('posts').insert(posts);
    console.log("Posts Insert Err:", postErr);
}
main();
