import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/city-context";
import Icon from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";

const CREATOR_ROLES = [
  "content_creator",
  "creator",
  "city_ambassador",
  "resource_provider",
  "chamber_admin",
] as const;

type BadgeVariant = "gold" | "emerald" | "coral" | "cyan" | "pink" | "purple" | "blue";

const ROLE_BADGE: Record<string, { label: string; variant: BadgeVariant }> = {
  content_creator: { label: "Creator", variant: "coral" },
  creator: { label: "Creator", variant: "coral" },
  city_ambassador: { label: "Ambassador", variant: "purple" },
  resource_provider: { label: "Community", variant: "cyan" },
  chamber_admin: { label: "Chamber", variant: "gold" },
};

const CITY_BADGE_VARIANT: BadgeVariant = "blue";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `Discover | Knect`,
    description: `Watch, follow, and discover creators across every Knect city.`,
  };
}

type CreatorProfile = {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  verification_status: string | null;
  profile_tags: string[] | null;
  city: { slug: string; name: string } | null;
};

type CreatorPost = {
  id: string;
  image_url: string | null;
  video_url: string | null;
  media_type: string | null;
  body: string;
  author_id: string;
  created_at: string;
};

type CreatorReel = {
  id: string;
  video_url: string;
  poster_url: string | null;
  caption: string | null;
  author_id: string;
  like_count: number;
};

type CreatorChannel = {
  id: string;
  slug: string | null;
  name: string;
  owner_id: string;
  follower_count: number;
};

type CreatorVideo = {
  id: string;
  title: string;
  thumbnail_url: string | null;
  mux_playback_id: string | null;
  duration: number | null;
  channel_id: string;
};

export default async function CreatorsPage() {
  const supabase = await createClient();
  const activeCity = await getActiveCity();

  // Global roster — NOT scoped to the active city. Discover is supposed
  // to surface every creator type across every Knect city so users can
  // find people they wouldn't otherwise bump into.
  const { data: creatorRows } = await supabase
    .from("profiles")
    .select(
      "id, display_name, handle, avatar_url, bio, role, verification_status, profile_tags, city:cities!profiles_city_id_fkey(slug, name)"
    )
    .in("role", CREATOR_ROLES as unknown as string[])
    .not("handle", "is", null)
    .order("display_name", { ascending: true });

  const creators = (creatorRows ?? []) as unknown as CreatorProfile[];
  if (creators.length === 0) {
    return (
      <div className="animate-fade-in pb-safe px-5 pt-6">
        <h1 className="font-heading text-2xl font-bold mb-1">Discover</h1>
        <p className="text-sm text-txt-secondary mb-8">
          No creators on the platform yet.
        </p>
      </div>
    );
  }

  const creatorIds = creators.map((c) => c.id);
  const nowISO = new Date().toISOString();

  // Parallel fetch of the supporting content for every creator on this page.
  const [postsRes, reelsRes, channelsRes] = await Promise.all([
    supabase
      .from("posts")
      .select("id, image_url, video_url, media_type, body, author_id, created_at")
      .in("author_id", creatorIds)
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(120),
    supabase
      .from("reels")
      .select("id, video_url, poster_url, caption, author_id, like_count")
      .in("author_id", creatorIds)
      .eq("is_published", true)
      .or(`expires_at.is.null,expires_at.gt.${nowISO}`)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("channels")
      .select("id, slug, name, owner_id, follower_count")
      .in("owner_id", creatorIds)
      .eq("is_active", true),
  ]);

  const posts = (postsRes.data ?? []) as CreatorPost[];
  const reels = (reelsRes.data ?? []) as CreatorReel[];
  const channels = (channelsRes.data ?? []) as CreatorChannel[];

  // Channel videos — one query keyed by channel.id rather than N-per-creator.
  const channelIds = channels.map((c) => c.id);
  let videos: CreatorVideo[] = [];
  if (channelIds.length > 0) {
    const { data: videoRows } = await supabase
      .from("channel_videos")
      .select("id, title, thumbnail_url, mux_playback_id, duration, channel_id")
      .in("channel_id", channelIds)
      .eq("is_published", true)
      .eq("status", "ready")
      .order("published_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(60);
    videos = (videoRows ?? []) as CreatorVideo[];
  }

  // Indexes for constant-time per-creator lookup.
  const postsByCreator = new Map<string, CreatorPost[]>();
  for (const p of posts) {
    const arr = postsByCreator.get(p.author_id) ?? [];
    arr.push(p);
    postsByCreator.set(p.author_id, arr);
  }
  const reelsByCreator = new Map<string, CreatorReel[]>();
  for (const r of reels) {
    const arr = reelsByCreator.get(r.author_id) ?? [];
    arr.push(r);
    reelsByCreator.set(r.author_id, arr);
  }
  const channelByOwner = new Map<string, CreatorChannel>();
  for (const ch of channels) channelByOwner.set(ch.owner_id, ch);
  const videosByChannel = new Map<string, CreatorVideo[]>();
  for (const v of videos) {
    const arr = videosByChannel.get(v.channel_id) ?? [];
    arr.push(v);
    videosByChannel.set(v.channel_id, arr);
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-hc-purple/20 via-midnight to-midnight" />
        <div className="relative px-5 pt-6 pb-5">
          <h1 className="font-heading text-2xl font-bold mb-1">Discover</h1>
          <p className="text-sm text-txt-secondary">
            Cool things to watch from creators across every Knect city
            {activeCity ? ` — including ${activeCity.name}` : ""}.
          </p>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-8 pt-2">
        {creators.map((creator) => {
          const creatorPosts = (postsByCreator.get(creator.id) ?? []).slice(0, 6);
          const creatorReels = (reelsByCreator.get(creator.id) ?? []).slice(0, 4);
          const channel = channelByOwner.get(creator.id);
          const creatorVideos = channel
            ? (videosByChannel.get(channel.id) ?? []).slice(0, 4)
            : [];

          const initials = creator.display_name
            .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

          return (
            <section
              key={creator.id}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden"
            >
              {/* Creator header */}
              <div className="p-4 flex items-center gap-3">
                <Link
                  href={`/user/${creator.handle}`}
                  className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/15 bg-gradient-to-br from-royal to-hc-purple"
                >
                  {creator.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gold font-heading font-bold text-base">
                      {initials}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link href={`/user/${creator.handle}`} className="font-heading font-bold text-[15px] truncate hover:underline">
                      {creator.display_name}
                    </Link>
                    {creator.verification_status === "verified" && (
                      <Icon name="verified" size={11} className="text-cyan" />
                    )}
                    {(() => {
                      const rb = creator.role ? ROLE_BADGE[creator.role] : null;
                      return rb ? <Badge label={rb.label} variant={rb.variant} /> : null;
                    })()}
                    {creator.city && (
                      <Badge label={creator.city.name} variant={CITY_BADGE_VARIANT} />
                    )}
                  </div>
                  <p className="text-[11px] text-white/40">@{creator.handle}</p>
                  {creator.bio && (
                    <p className="text-[12px] text-white/60 mt-1 line-clamp-2">{creator.bio}</p>
                  )}
                  {creator.profile_tags && creator.profile_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {creator.profile_tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium text-white/50 bg-white/[0.04] border border-white/[0.06] rounded-full px-2 py-0.5"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Link
                  href={`/user/${creator.handle}`}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold bg-gold text-midnight press hover:bg-gold-light transition-colors"
                >
                  Visit
                </Link>
              </div>

              {/* Reels rail — if this creator has reels */}
              {creatorReels.length > 0 && (
                <div className="pb-3">
                  <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-white/50">
                      Reels
                    </span>
                    <Link href="/reels" className="text-[10px] text-gold font-semibold press">
                      Watch
                    </Link>
                  </div>
                  <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-1">
                      {creatorReels.map((r) => (
                        <Link
                          key={r.id}
                          href="/reels"
                          className="shrink-0 w-[104px] aspect-[9/16] rounded-xl overflow-hidden relative group press"
                        >
                          {r.poster_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={r.poster_url} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-black via-deep to-midnight flex items-center justify-center">
                              <Icon name="video" size={22} className="text-white/30" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center gap-1">
                            <Icon name="video" size={10} className="text-white" />
                            <span className="text-[10px] font-bold text-white">
                              {r.like_count.toLocaleString()}
                            </span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Recent posts grid — 3 across, aspect-square */}
              {creatorPosts.length > 0 && (
                <div className="pb-3">
                  <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-white/50">
                      Recent posts
                    </span>
                    <Link href={`/user/${creator.handle}`} className="text-[10px] text-gold font-semibold press">
                      See all
                    </Link>
                  </div>
                  <div className="grid grid-cols-3 gap-0.5 mx-4 rounded-lg overflow-hidden">
                    {creatorPosts.map((p) => (
                      <Link
                        key={p.id}
                        href={`/user/${creator.handle}`}
                        className="relative aspect-square bg-white/[0.04] group overflow-hidden"
                      >
                        {p.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image_url} alt="" className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" />
                        ) : p.media_type === "video" ? (
                          <div className="w-full h-full bg-gradient-to-br from-black via-deep to-midnight flex items-center justify-center">
                            <Icon name="video" size={18} className="text-white/30" />
                          </div>
                        ) : (
                          <div className="w-full h-full p-2 flex items-center">
                            <p className="text-[9px] text-white/70 line-clamp-5 leading-snug">{p.body}</p>
                          </div>
                        )}
                        {p.media_type === "video" && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/60 flex items-center justify-center">
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20" /></svg>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Channel videos if this creator has a channel */}
              {channel && creatorVideos.length > 0 && (
                <div className="pt-1 pb-4 border-t border-white/[0.04]">
                  <div className="px-4 mt-3 mb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-white/50">
                        From their channel
                      </span>
                      <p className="text-[12px] font-bold text-white mt-0.5">{channel.name}</p>
                    </div>
                    <Link
                      href={`/live/channel/${channel.slug || channel.id}`}
                      className="text-[10px] text-gold font-semibold press"
                    >
                      Watch channel
                    </Link>
                  </div>
                  <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                    <div className="flex gap-2 pb-1">
                      {creatorVideos.map((v) => {
                        const thumb = v.thumbnail_url
                          ?? (v.mux_playback_id ? `https://image.mux.com/${v.mux_playback_id}/thumbnail.webp?width=320&height=180&time=5` : null);
                        return (
                          <Link
                            key={v.id}
                            href={`/live/watch/${v.id}`}
                            className="shrink-0 w-[180px] group press"
                          >
                            <div className="relative aspect-video rounded-lg overflow-hidden bg-black/40">
                              {thumb ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={thumb} alt={v.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Icon name="film" size={18} className="text-white/30" />
                                </div>
                              )}
                              {v.duration && (
                                <span className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5 text-[9px] font-mono text-white">
                                  {Math.floor(v.duration / 60)}:{Math.floor(v.duration % 60).toString().padStart(2, "0")}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-white line-clamp-1 mt-1">{v.title}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
