import { createClient } from "@/lib/supabase/server";
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
      <div className="px-5 pt-4">
        <h1 className="font-display text-2xl text-white mb-1">Cultural Events</h1>
        <p className="text-sm text-txt-secondary">Don&apos;t miss what&apos;s happening in Compton.</p>
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
