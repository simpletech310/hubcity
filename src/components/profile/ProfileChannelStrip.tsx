import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import type { Channel, ChannelVideo, ChannelType } from "@/types/database";

type TypeBadgeVariant = "gold" | "blue" | "coral" | "emerald" | "cyan" | "purple" | "pink";

const TYPE_BADGE: Record<ChannelType, { label: string; variant: TypeBadgeVariant }> = {
  school: { label: "School", variant: "emerald" },
  city: { label: "City", variant: "cyan" },
  organization: { label: "Org", variant: "purple" },
  media: { label: "Media", variant: "pink" },
  community: { label: "Community", variant: "blue" },
  museum: { label: "Museum", variant: "cyan" },
  food: { label: "Food", variant: "coral" },
  home: { label: "Home", variant: "emerald" },
  art: { label: "Art", variant: "purple" },
  fashion: { label: "Fashion", variant: "pink" },
  wellness: { label: "Wellness", variant: "emerald" },
  comedy: { label: "Comedy", variant: "gold" },
  talk: { label: "Talk", variant: "blue" },
  business: { label: "Business", variant: "gold" },
  tech: { label: "Tech", variant: "cyan" },
  education: { label: "Learn", variant: "blue" },
  civic: { label: "Civic", variant: "cyan" },
  music: { label: "Music", variant: "purple" },
  faith: { label: "Faith", variant: "gold" },
  sports: { label: "Sports", variant: "coral" },
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
  const badge = TYPE_BADGE[channel.type] || TYPE_BADGE.community;
  const channelHref = `/live/channel/${channel.slug || channel.id}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/[0.06] mb-4">
      {/* Banner backdrop */}
      <div className="absolute inset-0">
        {channel.banner_url ? (
          <img
            src={channel.banner_url}
            alt=""
            className="w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-royal via-hc-purple/40 to-midnight" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black/80" />
      </div>

      <div className="relative p-4">
        {/* Top row: avatar + name + follow/view */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/15 bg-white/[0.06]">
            {channel.avatar_url ? (
              <img
                src={channel.avatar_url}
                alt={channel.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold font-heading font-bold text-sm">
                {initials(channel.name)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                Channel
              </p>
              {channel.is_verified && (
                <Icon name="verified" size={11} className="text-cyan" />
              )}
            </div>
            <p className="text-[15px] font-heading font-bold truncate">{channel.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge label={badge.label} variant={badge.variant} />
              <span className="text-[10px] text-white/50">
                {channel.follower_count.toLocaleString()} followers
              </span>
            </div>
          </div>
          <Link
            href={channelHref}
            className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gold text-midnight press hover:bg-gold-light transition-colors"
          >
            View
          </Link>
        </div>

        {/* Video thumbnails */}
        {videos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {videos.slice(0, 3).map((video) => (
              <Link
                key={video.id}
                href={`/live/watch/${video.id}`}
                className="group press"
              >
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                    />
                  ) : video.mux_playback_id ? (
                    <img
                      src={`https://image.mux.com/${video.mux_playback_id}/thumbnail.webp?width=240&height=135&time=5`}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon name="film" size={16} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  {video.duration && (
                    <span className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5 text-[8px] font-mono text-white">
                      {formatDuration(video.duration)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-white line-clamp-1 mt-1">
                  {video.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
