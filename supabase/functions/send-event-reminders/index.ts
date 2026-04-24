import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async () => {
  const now = new Date();

  // Find events happening in 24h (between 23h and 25h from now)
  const in24h_start = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const in24h_end   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // Find events happening in 1h (between 50min and 70min from now)
  const in1h_start  = new Date(now.getTime() + 50 * 60 * 1000).toISOString();
  const in1h_end    = new Date(now.getTime() + 70 * 60 * 1000).toISOString();

  const reminderWindows = [
    { start: in24h_start, end: in24h_end, type: "24h" as const, label: "tomorrow" },
    { start: in1h_start,  end: in1h_end,  type: "1h"  as const, label: "in 1 hour" },
  ];

  let totalSent = 0;

  for (const window of reminderWindows) {
    // Get events in this window with their RSVPs
    const { data: events } = await supabase
      .from("events")
      .select("id, title, starts_at")
      .gte("starts_at", window.start)
      .lte("starts_at", window.end)
      .eq("is_published", true);

    if (!events?.length) continue;

    for (const event of events) {
      // Get RSVPs for this event
      const { data: rsvps } = await supabase
        .from("event_rsvps")
        .select("user_id")
        .eq("event_id", event.id)
        .eq("status", "confirmed");

      if (!rsvps?.length) continue;

      for (const rsvp of rsvps) {
        // Skip if already sent this reminder type
        const { data: existing } = await supabase
          .from("event_reminder_logs")
          .select("id")
          .eq("event_id", event.id)
          .eq("user_id", rsvp.user_id)
          .eq("reminder_type", window.type)
          .maybeSingle();

        if (existing) continue;

        // Insert notification
        await supabase.from("notifications").insert({
          user_id: rsvp.user_id,
          title: `${event.title} is ${window.label}`,
          body: `Don't forget — you're going to ${event.title}. It starts ${window.label}.`,
          link: `/events/${event.id}`,
        });

        // Log the reminder
        await supabase.from("event_reminder_logs").insert({
          event_id: event.id,
          user_id: rsvp.user_id,
          reminder_type: window.type,
        });

        totalSent++;
      }
    }
  }

  return new Response(JSON.stringify({ sent: totalSent }), {
    headers: { "Content-Type": "application/json" },
  });
});
