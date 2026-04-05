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

interface MeetingCardProps {
  meeting: CityMeeting;
  isPast?: boolean;
}

const TYPE_BADGES: Record<string, string> = {
  regular: "bg-cyan-500/20 text-cyan-400",
  special: "bg-yellow-500/20 text-yellow-400",
  emergency: "bg-red-500/20 text-red-400",
  workshop: "bg-purple-500/20 text-purple-400",
};

export function MeetingCard({ meeting, isPast }: MeetingCardProps) {
  const dateObj = new Date(meeting.date + "T12:00:00");
  const dayNum = dateObj.getDate();
  const month = dateObj.toLocaleDateString("en-US", { month: "short" });
  const badgeClass = TYPE_BADGES[meeting.meeting_type] ?? TYPE_BADGES.regular;

  return (
    <div
      className={`rounded-2xl bg-royal p-4 ${isPast ? "opacity-60" : ""}`}
    >
      <div className="flex gap-4">
        {/* Date block */}
        <div className="flex shrink-0 flex-col items-center justify-center rounded-xl bg-white/5 px-3 py-2">
          <span className="text-2xl font-bold text-gold">{dayNum}</span>
          <span className="text-xs uppercase text-white/50">{month}</span>
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate font-semibold text-white">{meeting.title}</h3>
          </div>

          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {meeting.meeting_type}
            </span>
            {meeting.is_public_comment_open && !isPast && (
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                Public Comment Open
              </span>
            )}
          </div>

          {meeting.location && (
            <p className="mb-2 text-sm text-white/50">{meeting.location}</p>
          )}

          {meeting.start_time && (
            <p className="mb-2 text-xs text-white/40">
              {meeting.start_time}
              {meeting.end_time ? ` - ${meeting.end_time}` : ""}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {meeting.agenda_url && (
              <a
                href={meeting.agenda_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
              >
                Agenda
              </a>
            )}
            {meeting.minutes_url && (
              <a
                href={meeting.minutes_url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 hover:bg-white/10 transition-colors"
              >
                Minutes
              </a>
            )}
            {meeting.livestream_id && !isPast && (
              <a
                href={`/watch/${meeting.livestream_id}`}
                className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 transition-colors"
              >
                Watch Live
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
