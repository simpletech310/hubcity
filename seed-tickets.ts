import { createClient } from '@supabase/supabase-js';
import { loadEnvConfig } from '@next/env';
import crypto from 'crypto';

loadEnvConfig(process.cwd());
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const eventId = 'a8000001-0001-4000-8000-000000000004';
    
    // Check if venue_sections needs a venue_id, or if we can just create venue sections.
    const { data: vConfig } = await supabase.from('venue_sections').select('*').limit(1);
    console.log("Venue section columns:", vConfig ? Object.keys(vConfig[0] || {}) : null);

    // Let's see if we can create a fake venue for AY MI PA!
    const venueId = crypto.randomUUID();
    const { error: venueErr } = await supabase.from('venues').insert({
        id: venueId,
        name: 'AY MI PA! Dine and Lounge',
        city_id: '398a39cc-367b-4604-b6b2-1042fde1a041', // Compton city ID or similar
        address: 'Riverside, CA',
        capacity: 200
    });
    console.log("Venue insert err:", venueErr);

    // Attach venue to event
    await supabase.from('events').update({ venue_id: venueId }).eq('id', eventId);

    // Create sections
    const section1 = crypto.randomUUID();
    const section2 = crypto.randomUUID();
    const section3 = crypto.randomUUID();
    
    const { error: secErr } = await supabase.from('venue_sections').insert([
        { id: section1, venue_id: venueId, name: 'General Admission', description: 'Entry to brunch. Food not included.', color: '#F2A900', sort_order: 1 },
        { id: section2, venue_id: venueId, name: 'VIP Booth', description: 'Includes a bottle of champagne and seating for 4.', color: '#FF006E', sort_order: 2 },
        { id: section3, venue_id: venueId, name: 'Bottomless Mimosas Add-On', description: 'Add-on only. Must purchase GA or VIP.', color: '#3B82F6', sort_order: 3 }
    ]);
    console.log("Sections err:", secErr);

    // Create tickets
    const { error: tixErr } = await supabase.from('event_ticket_config').insert([
        { id: crypto.randomUUID(), event_id: eventId, venue_section_id: section1, price: 2500, capacity: 100, available_count: 100, max_per_order: 4, is_active: true },
        { id: crypto.randomUUID(), event_id: eventId, venue_section_id: section2, price: 15000, capacity: 10, available_count: 5, max_per_order: 1, is_active: true },
        { id: crypto.randomUUID(), event_id: eventId, venue_section_id: section3, price: 3000, capacity: 50, available_count: 50, max_per_order: 4, is_active: true }
    ]);
    console.log("Tickets err:", tixErr);
}
main();
