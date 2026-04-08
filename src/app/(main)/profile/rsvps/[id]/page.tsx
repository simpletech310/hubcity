import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/server";
import ShareButton from "./ShareButton";

export const metadata = {
  title: "RSVP Details | Hub City",
  description: "Your RSVP details for this event.",
};

const categoryGradients: Record<string, string> = {
  city: "from-gold/30 via-gold/10 to-transparent",
  sports: "from-emerald/30 via-emerald/10 to-transparent",
  culture: "from-pink/30 via-pink/10 to-transparent",
  community: "from-hc-purple/30 via-hc-purple/10 to-transparent",
  school: "from-hc-blue/30 via-hc-blue/10 to-transparent",
  youth: "from-cyan/30 via-cyan/10 to-transparent",
};

const statusConfig: Record<string, { text: string; bg: string; label: string }> = {
  going: { text: "text-emerald", bg: "bg-emerald/10", label: "Going" },
  interested: { text: "text-gold", bg: "bg-gold/10", label: "Interested" },
  not_going: { text: "text-white/40", bg: "bg-white/5", label: "Not Going" },
};

function formatTime12h(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${hour12}:${m} ${ampm}`;
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function buildGoogleCalendarUrl(event: {
  title: string;
  start_date: string;
  start_time: string | null;
  end_date: string | null;
  end_time: string | null;
  location_name: string | null;
  address: string | null;
  description: string | null;
}): string {
  const base = "https://calendar.google.com/calendar/render?action=TEMPLATE";
  const title = encodeURIComponent(event.title);

  // Format dates as YYYYMMDD or YYYYMMDDTHHmmSS
  const startDate = event.start_date.replace(/-/g, "");
  const startTime = event.start_time ? event.start_time.replace(/:/g, "").slice(0, 6) : null;
  const endDate = event.end_date ? event.end_date.replace(/-/g, "") : startDate;
  const endTime = event.end_time ? event.end_time.replace(/:/g, "").slice(0, 6) : null;

  const dates = startTime
    ? `${startDate}T${startTime}/${endDate}T${endTime || startTime}`
    : `${startDate}/${endDate}`;

  const location = encodeURIComponent(
    [event.location_name, event.address].filter(Boolean).join(", ")
  );

  const details = event.description ? encodeURIComponent(event.description.slice(0, 500)) : "";

  return `${base}&text=${title}&dates=${dates}&location=${location}&details=${details}`;
}

interface Attendee {
  user_id: string;
  status: string;
  profile: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default async function RsvpDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth?redirect=/profile/rsvps/${id}`);
  }

  // Fetch RSVP with joined event data
  const { data: rsvp } = await supabase
    .from("event_rsvps")
    .select(
      "id, status, created_at, event:events(id, title, slug, description, start_date, start_time, end_date, end_time, location_name, address, category, image_url, rsvp_count, group_id)"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!rsvp || !rsvp.event || typeof rsvp.event !== "object") {
    notFound();
  }

  const event = rsvp.event as unknown as {
    id: string;
    title: string;
    slug: string | null;
    description: string | null;
    start_date: string;
    start_time: string | null;
    end_date: string | null;
    end_time: string | null;
    location_name: string | null;
    address: string | null;
    category: string | null;
    image_url: string | null;
    rsvp_count: number;
    group_id: string | null;
  };

  // Fetch attendees
  let attendees: Attendee[] = [];
  let goingCount = 0;
  let interestedCount = 0;

  try {
    const { data: rsvpAttendees } = await supabase
      .from("event_rsvps")
      .select("user_id, status, profile:profiles(display_name, avatar_url)")
      .eq("event_id", event.id)
      .in("status", ["going", "interested"]);

    if (rsvpAttendees) {
      attendees = rsvpAttendees as unknown as Attendee[];
      goingCount = attendees.filter((a) => a.status === "going").length;
      interestedCount = attendees.filter((a) => a.status === "interested").length;
    }
  } catch {
    // Attendees fetch is non-critical
  }

  const status = statusConfig[rsvp.status] ?? statusConfig.going;
  const gradient = categoryGradients[event.category ?? ""] || "from-gold/20 to-deep";
  const eventLink = `/events/${event.slug || event.id}`;
  const calendarUrl = buildGoogleCalendarUrl(event);
  const rsvpDate = new Date(rsvp.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // First 5 attendees with avatars for the stack
  const avatarAttendees = attendees
    .filter((a) => a.profile?.avatar_url)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-midnight text-white pb-28 animate-fade-in">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-midnight/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="flex items-center gap-3 px-5 py-3.5">
          <Link href="/profile/rsvps" className="press">
            <Icon name="back" size={20} className="text-white/60" />
          </Link>
          <h1 className="font-heading text-[17px] font-bold">RSVP Details</h1>
        </div>
      </div>

      {/* Event Hero */}
      <div className="relative h-56 overflow-hidden">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            className="object-cover"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${gradient} pattern-dots`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon name="calendar" size={64} className="opacity-20" />
            </div>
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/70 to-transparent" />

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h2 className="font-heading text-xl font-bold text-white leading-tight">
            {event.title}
          </h2>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-4">
        {/* RSVP Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${status.bg} border border-white/[0.06]`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                rsvp.status === "going"
                  ? "bg-emerald"
                  : rsvp.status === "interested"
                  ? "bg-gold"
                  : "bg-white/30"
              }`}
            />
            <span className={`text-[13px] font-bold ${status.text}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Event Details Card */}
        <div className="glass-card-elevated rounded-2xl p-4 space-y-3.5">
          {/* Date + Time */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/10 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="calendar" size={16} className="text-gold" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-white">
                {formatDateNice(event.start_date)}
              </p>
              {event.start_time && (
                <p className="text-[11px] text-txt-secondary mt-0.5">
                  {formatTime12h(event.start_time)}
                  {event.end_time && ` - ${formatTime12h(event.end_time)}`}
                </p>
              )}
              {event.end_date && event.end_date !== event.start_date && (
                <p className="text-[11px] text-txt-secondary mt-0.5">
                  to {formatDateNice(event.end_date)}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {(event.location_name || event.address) && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-coral/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon name="map-pin" size={16} className="text-coral" />
              </div>
              <div>
                {event.location_name && (
                  <p className="text-[13px] font-semibold text-white">
                    {event.location_name}
                  </p>
                )}
                {event.address && (
                  <p className="text-[11px] text-txt-secondary mt-0.5">
                    {event.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Category */}
          {event.category && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-hc-purple/10 flex items-center justify-center shrink-0">
                <Icon name="tag" size={16} className="text-hc-purple" />
              </div>
              <Badge variant="purple" label={event.category} />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="pt-2 border-t border-border-subtle">
              <p className="text-[12px] text-txt-secondary leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          )}
        </div>

        {/* Attendee Preview */}
        {(goingCount > 0 || interestedCount > 0) && (
          <div className="glass-card-elevated rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="users" size={16} className="text-white/40" />
                <p className="text-[12px] text-txt-secondary font-medium">
                  {goingCount > 0 && (
                    <span>
                      <span className="text-emerald font-semibold">
                        {goingCount}
                      </span>{" "}
                      going
                    </span>
                  )}
                  {goingCount > 0 && interestedCount > 0 && (
                    <span className="mx-1.5 text-white/20">&middot;</span>
                  )}
                  {interestedCount > 0 && (
                    <span>
                      <span className="text-gold font-semibold">
                        {interestedCount}
                      </span>{" "}
                      interested
                    </span>
                  )}
                </p>
              </div>

              {/* Avatar Stack */}
              {avatarAttendees.length > 0 && (
                <div className="flex -space-x-2">
                  {avatarAttendees.map((a) => (
                    <div
                      key={a.user_id}
                      className="w-7 h-7 rounded-full border-2 border-midnight overflow-hidden"
                    >
                      <Image
                        src={a.profile!.avatar_url!}
                        alt={a.profile?.display_name || "Attendee"}
                        width={28}
                        height={28}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                  {attendees.length > 5 && (
                    <div className="w-7 h-7 rounded-full border-2 border-midnight bg-white/10 flex items-center justify-center">
                      <span className="text-[9px] font-bold text-white/60">
                        +{attendees.length - 5}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <Link
            href={eventLink}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gold/10 border border-gold/20 text-gold font-semibold text-[14px] press hover:bg-gold/15 transition-colors"
          >
            <Icon name="calendar" size={16} />
            View Event
          </Link>

          <div className="flex gap-2.5">
            <ShareButton url={eventLink} />

            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl glass-card-elevated border border-border-subtle text-txt-secondary font-semibold text-[13px] press hover:border-white/20 transition-colors"
            >
              <Icon name="calendar" size={14} />
              Add to Calendar
            </a>
          </div>
        </div>

        {/* RSVP'd Date */}
        <p className="text-center text-[11px] text-white/30 pt-2 pb-4">
          RSVP&apos;d on {rsvpDate}
        </p>
      </div>
    </div>
  );
}

