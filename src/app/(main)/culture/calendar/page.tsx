import { createClient } from "@/lib/supabase/server";
import CultureHero from "@/components/culture/CultureHero";
import CultureCalendarClient from "./CultureCalendarClient";

export const metadata = {
  title: "Cultural Calendar | Compton Culture | Knect",
  description: "Upcoming cultural events in Compton.",
};

export default async function CultureCalendarPage() {
  const supabase = await createClient();
  const now = new Date();

  // Fetch events for +/- 2 months to allow client nav
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
    <div className="space-y-8 pb-20">
      <CultureHero
        title="Cultural Calendar"
        subtitle="Don't miss what's happening in Compton."
        imageUrl="/images/art/IMG_2787.jpg"
      />
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
