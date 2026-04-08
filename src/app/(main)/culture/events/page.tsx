import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import MuseumNav from "@/components/culture/MuseumNav";
import CultureCalendarClient from "../calendar/CultureCalendarClient";

export const metadata = {
  title: "Cultural Events | Compton Culture | Hub City",
  description: "Upcoming cultural events in Compton.",
};

export default async function CultureEventsPage() {
  const supabase = await createClient();
  const now = new Date();

  const startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0);

  const { data: events } = await supabase
    .from("events")
    .select("id, title, start_date, end_date, location, category, description")
    .eq("category", "culture")
    .gte("start_date", startDate.toISOString())
    .lte("start_date", endDate.toISOString())
    .order("start_date", { ascending: true });

  return (
    <div className="space-y-6 pb-20">
      <CultureHero
        title="Cultural Events"
        subtitle="Don't miss what's happening in Compton."
        imageUrl="/images/art/IMG_2787.jpg"
      />

      <div className="sticky top-0 z-30 bg-midnight/95 backdrop-blur-lg border-b border-border-subtle">
        <div className="px-5">
          <MuseumNav />
        </div>
      </div>

      <div className="px-5">
        <CultureCalendarClient
          events={events ?? []}
          initialMonth={now.getMonth()}
          initialYear={now.getFullYear()}
        />
      </div>
    </div>
  );
}
