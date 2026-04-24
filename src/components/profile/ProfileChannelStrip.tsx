import Link from "next/link";
import Icon from "@/components/ui/Icon";
import type { Channel, ChannelVideo, ChannelType } from "@/types/database";

const TYPE_LABEL: Record<ChannelType, string> = {
  school: "School",
  city: "City",
  organization: "Org",
  media: "Media",
  community: "Community",
  museum: "Museum",
  food: "Food",
  home: "Home",
  art: "Art",
  fashion: "Fashion",
  wellness: "Wellness",
  comedy: "Comedy",
  talk: "Talk",
  business: "Business",
  tech: "Tech",
  education: "Learn",
  civic: "Civic",
  music: "Music",
  faith: "Faith",
  sports: "Sports",
};

function formatDuration(seconds: number | null) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface ProfileChannelStripProps {
  channel: Channel;
  videos: ChannelVideo[];
}

export default function ProfileChannelStrip({ channel, videos }: ProfileChannelStripProps) {
  const label = (TYPE_LABEL[channel.type] || "Community").toUpperCase();
  const channelHref = `/live/channel/${channel.slug || channel.id}`;

  return (
    <div
      className="mb-4 p-3"
      style={{
        border: "2px solid var(--rule-strong-c)",
        background: "var(--paper)",
      }}
    >
      {/* Header row */}
      <div className="flex items-stretch gap-3 mb-3">
        <div
          className="c-frame-strong shrink-0 overflow-hidden"
          style={{ width: 72, height: 72 }}
        >
          {channel.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={channel.avatar_url}
              alt={channel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center c-display"
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                fontSize: 24,
              }}
            >
              {initials(channel.name)}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className="c-kicker" style={{ color: "var(--ink-mute)" }}>
              § CHANNEL
            </span>
            {channel.is_verified && (
              <span className="c-kicker" style={{ color: "var(--gold-c)" }}>
                · VERIFIED
              </span>
            )}
          </div>
          <p
            className="c-card-t truncate"
            style={{ fontSize: 18, marginTop: 4 }}
          >
            {channel.name}
          </p>
          <div
            className="mt-1 flex items-center gap-3 c-meta"
            style={{ color: "var(--ink-mute)" }}
          >
            <span
              style={{
                background: "var(--ink-strong)",
                color: "var(--gold-c)",
                padding: "2px 6px",
                fontWeight: 700,
              }}
            >
              {label}
            </span>
            <span>{channel.follower_count.toLocaleString()} FOLLOWERS</span>
          </div>
        </div>

        <Link
          href={channelHref}
          className="c-ui shrink-0 press self-center"
          style={{
            background: "var(--ink-strong)",
            color: "var(--gold-c)",
            padding: "10px 14px",
          }}
        >
          VIEW
        </Link>
      </div>

      {/* Video thumbs */}
      {videos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {videos.slice(0, 3).map((video) => (
            <Link
              key={video.id}
              href={`/live/watch/${video.id}`}
              className="group press block"
            >
              <div
                className="relative aspect-video c-frame overflow-hidden"
                style={{ background: "var(--ink-strong)" }}
              >
                {video.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnail_url}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : video.mux_playback_id ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=240&height=135&time=5`}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ color: "var(--gold-c)" }}
                  >
                    <Icon name="film" size={18} />
                  </div>
                )}
                {video.duration && (
                  <span
                    className="c-meta absolute bottom-1 right-1"
                    style={{
                      background: "var(--ink-strong)",
                      color: "var(--gold-c)",
                      padding: "1px 4px",
                      fontWeight: 700,
                    }}
                  >
                    {formatDuration(video.duration)}
                  </span>
                )}
              </div>
              <p
                className="c-kicker mt-1 line-clamp-1"
                style={{ fontSize: 9, color: "var(--ink-soft)" }}
              >
                {video.title}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
