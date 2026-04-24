import { createClient } from "@/lib/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import { MeetingCard } from "@/components/city-data/MeetingCard";

interface CityMeeting {
  id: string;
  title: string;
  meeting_type: string;
  description: string | null;
  date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  agenda_url: string | null;
  minutes_url: string | null;
  livestream_id: string | null;
  is_public_comment_open: boolean;
  created_at: string;
}

export const metadata = {
  title: "City Meetings - Culture",
  description: "Compton city council meetings, agendas, and minutes.",
};

export default async function MeetingsPage() {
  const supabase = await createClient();

  const { data: meetings } = await supabase
    .from("city_meetings")
    .select("*")
    .order("date", { ascending: true });

  const now = new Date().toISOString().split("T")[0];
  const upcoming = (meetings as CityMeeting[] | null)?.filter((m) => m.date >= now) ?? [];
  const past = (meetings as CityMeeting[] | null)?.filter((m) => m.date < now).reverse() ?? [];

  return (
    <div className="culture-surface min-h-dvh">
      <div
        className="px-[18px] pt-5 pb-5"
        style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
      >
        <div className="c-kicker" style={{ opacity: 0.65 }}>§ CITY DATA · MEETINGS</div>
        <h1 className="c-hero mt-2" style={{ fontSize: 48, lineHeight: 0.9 }}>City Meetings.</h1>
        <p className="c-serif-it mt-2" style={{ fontSize: 13 }}>
          Council meetings, agendas, and public comment.
        </p>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="sr-only">
          <SectionHeader
            title="City Meetings"
            subtitle="Council meetings, agendas, and public comment"
          />
        </div>

        {/* Upcoming Meetings */}
        <h2 className="mb-4 text-xl font-semibold text-gold">Upcoming</h2>
        {upcoming.length > 0 ? (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {upcoming.map((meeting) => (
              <MeetingCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div className="mb-8 rounded-2xl bg-royal/50 p-8 text-center">
            <p className="text-white/50">No upcoming meetings scheduled.</p>
            <p className="mt-1 text-sm text-white/30">
              Check back soon for the next city council meeting.
            </p>
          </div>
        )}

        {/* Past Meetings */}
        {past.length > 0 && (
          <>
            <h2 className="mb-4 text-xl font-semibold text-white/70">Past Meetings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {past.slice(0, 10).map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} isPast />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
