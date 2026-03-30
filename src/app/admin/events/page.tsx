import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import type { Event } from "@/types/database";

export default async function AdminEventsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });

  const events = (data as Event[]) ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Events</h1>
          <p className="text-sm text-txt-secondary">{events.length} total events</p>
        </div>
        <Link href="/admin/events/new"><Button>+ New Event</Button></Link>
      </div>

      <div className="space-y-2">
        {events.map((event) => (
          <Card key={event.id} hover>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold">{event.title}</h3>
                  {event.is_featured && <Badge label="Featured" variant="gold" />}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge label={event.category} variant="purple" />
                  <span className="text-xs text-txt-secondary">
                    📅 {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="text-xs text-txt-secondary">
                    👥 {event.rsvp_count} RSVPs
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  label={event.is_published ? "Published" : "Draft"}
                  variant={event.is_published ? "emerald" : "gold"}
                />
                <Link href={`/admin/events/${event.id}/edit`}><Button variant="ghost" size="sm">Edit</Button></Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
