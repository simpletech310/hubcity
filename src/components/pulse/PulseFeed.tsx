"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import PostCard from "./PostCard";
import PollCard from "./PollCard";
import SurveyCard from "./SurveyCard";
import ComposeModal from "./ComposeModal";
import CreatePollModal from "./CreatePollModal";
import CreateSurveyModal from "./CreateSurveyModal";
import PulseLiveCard from "./PulseLiveCard";
import Icon from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import Badge from "@/components/ui/Badge";
import ReelsRail from "@/components/reels/ReelsRail";
import { ROLE_BADGE_MAP } from "@/lib/constants";
import type { Post, ReactionEmoji, LiveStream, Poll, Survey, Reel } from "@/types/database";

// ─── Types ──────────────────────────────────────────
interface CityEvent {
  id: string;
  title: string;
  slug?: string;
  start_date: string;
  start_time: string | null;
  location_name: string | null;
  category: string;
  image_url: string | null;
  rsvp_count: number;
}

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  promo_type: string;
  promo_code: string | null;
  discount_percent: number | null;
  business: { id: string; name: string; slug: string; image_urls: string[] } | null;
}

interface SuggestedProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url: string | null;
  role: string;
  verification_status: string;
  bio: string | null;
}

const filters = [
  { label: "All", value: "all", iconName: "flame" as const, color: "#F2A900" },
  { label: "City News", value: "city_official", iconName: "landmark" as const, color: "#3B82F6" },
  { label: "Business", value: "business_owner", iconName: "store" as const, color: "#22C55E" },
  { label: "Jobs", value: "jobs", iconName: "briefcase" as const, color: "#F59E0B" },
  { label: "Community", value: "citizen", iconName: "chat" as const, color: "#8B5CF6" },
  { label: "Polls", value: "polls", iconName: "chart" as const, color: "#06B6D4" },
  { label: "Surveys", value: "surveys", iconName: "document" as const, color: "#EC4899" },
];

const eventCategoryColors: Record<string, string> = {
  city: "#F2A900", sports: "#22C55E", culture: "#8B5CF6", community: "#3B82F6", school: "#06B6D4", youth: "#EC4899",
};

// ─── Helpers ────────────────────────────────────────
function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return { month: d.toLocaleDateString("en-US", { month: "short" }), day: d.getDate(), weekday: d.toLocaleDateString("en-US", { weekday: "short" }) };
}

// ─── Inline Timeline Cards ─────────────────────────

function SuggestedProfilesCard({ profiles }: { profiles: SuggestedProfile[] }) {
  if (profiles.length === 0) return null;
  return (
    <div className="overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="c-card-t text-[13px] font-bold flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
          <div className="w-5 h-5 rounded-full bg-gold/15 flex items-center justify-center">
            <Icon name="users" size={10} className="text-gold" />
          </div>
          People to Follow
        </h3>
        <Link href="/people" className="c-kicker text-[11px] text-gold font-semibold press">See All</Link>
      </div>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {profiles.map((profile) => {
          const badge = ROLE_BADGE_MAP[profile.role];
          return (
            <Link key={profile.id} href={`/user/${profile.handle}`} className="shrink-0 w-[120px] press">
              <div className="flex flex-col items-center text-center py-3 px-2 transition-all" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    width={52}
                    height={52}
                    className="w-13 h-13 rounded-full object-cover ring-2 ring-black/10 mb-2"
                  />
                ) : (
                  <div
                    className="w-13 h-13 rounded-full flex items-center justify-center font-heading font-bold text-lg mb-2"
                    style={{ background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}
                  >
                    {profile.display_name.charAt(0)}
                  </div>
                )}
                <p className="text-[11px] font-semibold truncate w-full" style={{ color: "var(--ink-strong)" }}>{profile.display_name}</p>
                <p className="text-[10px] truncate w-full mb-1.5" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>@{profile.handle}</p>
                {badge && <Badge label={badge.label} variant={badge.variant} />}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function InlineEventsCard({ events }: { events: CityEvent[] }) {
  if (events.length === 0) return null;
  return (
    <div className="overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="c-card-t text-[13px] font-bold flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
          <div className="w-5 h-5 rounded-full bg-hc-blue/15 flex items-center justify-center">
            <Icon name="calendar" size={10} className="text-hc-blue" />
          </div>
          Happening Soon
        </h3>
        <Link href="/events" className="c-kicker text-[11px] text-gold font-semibold press">All Events</Link>
      </div>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {events.map((event) => {
          const { month, day, weekday } = formatEventDate(event.start_date);
          const color = eventCategoryColors[event.category] || "#F2A900";
          return (
            <Link key={event.id} href={`/events/${event.id}`} className="block shrink-0 w-[180px] press">
              <div className="c-frame relative h-[130px] overflow-hidden">
                {event.image_url ? (
                  <Image src={event.image_url} alt={event.title} fill className="object-cover" sizes="180px" />
                ) : (
                  <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}25, ${color}08)` }} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                {/* Date badge */}
                <div className="absolute top-2 left-2 bg-black/60 px-1.5 py-1 text-center" style={{ border: "2px solid rgba(255,255,255,0.15)" }}>
                  <p className="text-[7px] font-bold uppercase" style={{ color }}>{weekday}</p>
                  <p className="text-sm font-bold leading-none tabular-nums" style={{ color: "#fff" }}>{day}</p>
                  <p className="text-[7px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>{month}</p>
                </div>

                {/* RSVP count */}
                {event.rsvp_count > 0 && (
                  <div className="absolute top-2 right-2 bg-black/50 rounded-full px-1.5 py-0.5 text-[8px] font-semibold tabular-nums" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {event.rsvp_count} going
                  </div>
                )}

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <h4 className="c-card-t font-bold text-[11px] leading-tight line-clamp-2 mb-0.5" style={{ color: "#fff" }}>{event.title}</h4>
                  {event.location_name && (
                    <p className="text-[9px] truncate flex items-center gap-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                      <Icon name="pin" size={8} className="shrink-0" />
                      {event.location_name}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function InlineDealsCard({ promotions }: { promotions: Promotion[] }) {
  if (promotions.length === 0) return null;
  const typeColors: Record<string, string> = {
    bogo: "#FF6B6B", discount: "#22C55E", free_item: "#06B6D4", bundle: "#F2A900", loyalty: "#8B5CF6",
  };
  const typeIcons: Record<string, IconName> = {
    bogo: "tag", discount: "dollar", free_item: "sparkle", bundle: "cart", loyalty: "star",
  };
  const typeLabels: Record<string, string> = {
    bogo: "BOGO", discount: "Discount", free_item: "Freebie", bundle: "Bundle", loyalty: "Loyalty",
  };

  return (
    <div className="overflow-hidden" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h3 className="c-card-t text-[13px] font-bold flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
          <div className="w-5 h-5 rounded-full bg-emerald/15 flex items-center justify-center">
            <Icon name="tag" size={10} className="text-emerald" />
          </div>
          Local Deals
        </h3>
        <Link href="/food/specials" className="c-kicker text-[11px] text-gold font-semibold press">All Deals</Link>
      </div>
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
        {promotions.map((promo) => {
          const biz = promo.business;
          const color = typeColors[promo.promo_type] || "#F2A900";
          return (
            <Link
              key={promo.id}
              href={biz?.slug ? `/food/vendor/${biz.slug}` : "#"}
              className="block shrink-0 w-[160px] press"
            >
              <div className="p-3 h-full transition-all relative overflow-hidden" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: `linear-gradient(90deg, ${color}, transparent)`, opacity: 0.5 }} />
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 flex items-center justify-center" style={{ background: `${color}15`, border: "2px solid var(--rule-strong-c)" }}>
                    <Icon name={typeIcons[promo.promo_type] || "tag"} size={14} style={{ color }} />
                  </div>
                  <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5" style={{ background: `${color}15`, color }}>
                    {promo.promo_type === "discount" && promo.discount_percent ? `${promo.discount_percent}% Off` : typeLabels[promo.promo_type] || promo.promo_type}
                  </span>
                </div>
                <h4 className="c-card-t font-bold text-[11px] leading-tight line-clamp-2 mb-1" style={{ color: "var(--ink-strong)" }}>{promo.title}</h4>
                <p className="text-[9px] truncate" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>{biz?.name || "Local Business"}</p>
                {promo.promo_code && (
                  <span className="mt-2 inline-block text-[9px] font-mono px-2 py-0.5 text-gold" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
                    {promo.promo_code}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── Props ──────────────────────────────────────────
interface PulseFeedProps {
  posts: Post[];
  userReactions: Record<string, ReactionEmoji[]>;
  userId: string | null;
  userName: string;
  userRole?: string;
  liveStreams?: LiveStream[];
  polls?: Poll[];
  surveys?: Survey[];
  events?: CityEvent[];
  promotions?: Promotion[];
  /** Kept on the interface for back-compat with callers that still pass
   *  it; the weather/traffic strip was removed from /pulse so this is
   *  no longer rendered. */
  trafficAlertCount?: number;
  suggestedProfiles?: SuggestedProfile[];
  reels?: Reel[];
  /** IDs of profiles the signed-in user follows. Drives Following mode. */
  followedIds?: string[];
}

export default function PulseFeed({
  posts,
  userReactions,
  userId,
  userName,
  userRole = "citizen",
  liveStreams = [],
  polls = [],
  surveys = [],
  events = [],
  promotions = [],
  // trafficAlertCount: deliberately not destructured — see prop comment.
  suggestedProfiles = [],
  reels = [],
  followedIds = [],
}: PulseFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  // Mode toggle: discover (everything) vs following (only people I follow).
  // Defaults to following when the user actually follows somebody — otherwise
  // discover so a fresh account isn't staring at an empty feed.
  const [mode, setMode] = useState<"discover" | "following">(
    followedIds.length > 0 ? "following" : "discover",
  );

  const followedSet = useState(() => new Set(followedIds))[0];
  // Keep the set in sync if the prop ever changes (e.g. after a refresh).
  useEffect(() => {
    followedSet.clear();
    for (const id of followedIds) followedSet.add(id);
  }, [followedIds, followedSet]);

  const isOfficial = userRole === "city_official" || userRole === "admin";
  const canPost = userId && userRole !== "citizen";
  const inFollowing = mode === "following";

  // Trending hashtags
  const [trendingHashtags, setTrendingHashtags] = useState<{ hashtag: string; count: number }[]>([]);

  useEffect(() => {
    fetch("/api/hashtags/trending")
      .then((res) => res.json())
      .then((data) => {
        if (data.trending) setTrendingHashtags(data.trending);
      })
      .catch(() => {});
  }, []);

  // Filter logic
  const showPolls = activeFilter === "all" || activeFilter === "polls";
  const showSurveys = activeFilter === "all" || activeFilter === "surveys";
  const showPosts = activeFilter !== "polls" && activeFilter !== "surveys";

  // Apply role/category filter, then narrow to followed accounts when in
  // Following mode.
  const roleFiltered =
    activeFilter === "all" || activeFilter === "polls" || activeFilter === "surveys"
      ? posts
      : activeFilter === "jobs"
        ? posts.filter((p) => p.hashtags?.includes("jobs") || p.hashtags?.includes("hiring"))
        : posts.filter((p) => p.author?.role === activeFilter);

  const filteredPosts = inFollowing
    ? roleFiltered.filter((p) => p.author_id && followedSet.has(p.author_id))
    : roleFiltered;

  const visiblePolls = inFollowing
    ? polls.filter((p) => p.author_id && followedSet.has(p.author_id))
    : polls;
  const visibleSurveys = inFollowing
    ? surveys.filter((s) => s.author_id && followedSet.has(s.author_id))
    : surveys;
  const visibleReels = inFollowing
    ? reels.filter((r) => r.author_id && followedSet.has(r.author_id))
    : reels;
  const visibleLiveStreams = inFollowing
    ? liveStreams.filter((s) => s.created_by && followedSet.has(s.created_by))
    : liveStreams;

  // Build unified feed
  type FeedItem =
    | { type: "post"; data: Post; time: string }
    | { type: "poll"; data: Poll; time: string }
    | { type: "survey"; data: Survey; time: string };

  const feedItems: FeedItem[] = [];

  if (showPosts) {
    for (const post of filteredPosts) {
      feedItems.push({ type: "post", data: post, time: post.created_at });
    }
  }
  if (showPolls) {
    for (const poll of visiblePolls) {
      feedItems.push({ type: "poll", data: poll, time: poll.created_at });
    }
  }
  if (showSurveys) {
    for (const survey of visibleSurveys) {
      feedItems.push({ type: "survey", data: survey, time: survey.created_at });
    }
  }

  feedItems.sort((a, b) => {
    if (a.type === "post" && (a.data as Post).is_pinned) return -1;
    if (b.type === "post" && (b.data as Post).is_pinned) return 1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  // Determine insertion positions for inline cards. Inline rails are
  // discovery-flavored, so they're hidden in Following mode.
  const PROFILES_INSERT_AT = 3;
  const EVENTS_INSERT_AT = 7;
  const DEALS_INSERT_AT = 12;
  const showInlineCards = activeFilter === "all" && !inFollowing;

  return (
    <div className="animate-fade-in pb-safe">
      {/* ─── Reels Rail ─── */}
      {(visibleReels.length > 0 || (canPost && !inFollowing)) && (
        <div className="pt-4">
          <ReelsRail reels={visibleReels} canPost={!!canPost && !inFollowing} />
        </div>
      )}

      {/* ─── Mode toggle: Discover / Following ─── */}
      {userId && (
        <div className="px-5 mt-4 mb-3 flex items-center gap-2">
          <div
            className="inline-flex rounded-full p-0.5"
            style={{
              background: "var(--paper)",
              border: "2px solid var(--rule-strong-c)",
            }}
          >
            <button
              onClick={() => setMode("discover")}
              className={`c-chip ${mode === "discover" ? "active gold" : ""} press`}
              aria-pressed={mode === "discover"}
            >
              Discover
            </button>
            <button
              onClick={() => setMode("following")}
              className={`c-chip ${mode === "following" ? "active gold" : ""} press`}
              aria-pressed={mode === "following"}
            >
              Following
              {followedIds.length > 0 && (
                <span className={`ml-1.5 tabular-nums ${mode === "following" ? "opacity-80" : "opacity-60"}`}>
                  · {followedIds.length}
                </span>
              )}
            </button>
          </div>
          {inFollowing && followedIds.length === 0 && (
            <span className="text-[10px] c-serif-it" style={{ color: "var(--ink-strong)", opacity: 0.45 }}>
              Follow creators on the Discover tab to fill this in.
            </span>
          )}
        </div>
      )}

      {/* ─── Inline Compose Bar ─── */}
      {canPost && (
        <div className="mx-5 mb-3">
          <div className="flex items-center gap-3 px-4 py-3" style={{ background: "var(--paper)", border: "2px solid var(--rule-strong-c)" }}>
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-xs shrink-0"
              style={{ background: "var(--ink-strong)", color: "var(--gold-c)", border: "2px solid var(--ink-strong)" }}
            >
              {userName
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <button
              onClick={() => setComposeOpen(true)}
              className="flex-1 text-left text-sm press"
              style={{ color: "var(--ink-strong)", opacity: 0.55 }}
            >
              What&apos;s happening in Compton?
            </button>
            <div className="flex items-center gap-1">
              {isOfficial && (
                <>
                  <button
                    onClick={() => setPollOpen(true)}
                    className="w-8 h-8 rounded-full bg-cyan/10 flex items-center justify-center press hover:bg-cyan/20 transition-colors"
                    title="New Poll"
                  >
                    <Icon name="chart" size={14} className="text-cyan" />
                  </button>
                  <button
                    onClick={() => setSurveyOpen(true)}
                    className="w-8 h-8 rounded-full bg-hc-purple/10 flex items-center justify-center press hover:bg-hc-purple/20 transition-colors"
                    title="New Survey"
                  >
                    <Icon name="document" size={14} className="text-gold" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Filter Chips ─── */}
      <div className="flex gap-2 px-5 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex items-center gap-1.5 shrink-0 px-4 py-2.5 text-[13px] font-semibold transition-all press"
              style={{
                background: isActive ? `${f.color}20` : "var(--paper-warm)",
                color: isActive ? f.color : "var(--ink-strong)",
                border: `2px solid ${isActive ? `${f.color}60` : "var(--rule-strong-c)"}`,
              }}
            >
              <Icon name={f.iconName} size={14} className="opacity-80" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ─── Trending Hashtags (inline chips) ─── */}
      {trendingHashtags.length > 0 && activeFilter === "all" && (
        <div className="flex items-center gap-2 mx-5 mb-4 px-3 py-2 glass-surface overflow-x-auto scrollbar-hide" style={{ border: "2px solid var(--rule-strong-c)" }}>
          <Icon name="trending" size={12} className="text-gold/60 shrink-0" />
          <span className="c-kicker text-[10px] uppercase tracking-wider font-semibold shrink-0" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>Trending</span>
          {trendingHashtags.map((t) => (
            <span
              key={t.hashtag}
              className="c-chip gold shrink-0 cursor-pointer"
            >
              #{t.hashtag}
            </span>
          ))}
        </div>
      )}

      {/* ─── Live Streams (always at top when active) ─── */}
      {visibleLiveStreams.length > 0 && activeFilter === "all" && (
        <section className="px-5 mb-4">
          <div className="mb-2">
            <h3 className="c-card-t font-bold text-sm flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
              <div className="w-2 h-2 rounded-full bg-coral animate-pulse" />
              Live Now
            </h3>
          </div>
          <div className="space-y-3">
            {visibleLiveStreams.map((stream) => (
              <PulseLiveCard key={stream.id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Main Feed with Interspersed Content ─── */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="c-card-t font-bold text-base flex items-center gap-2" style={{ color: "var(--ink-strong)" }}>
            <div className="w-1 h-5 rounded-full bg-gold" />
            {activeFilter === "all" ? "Latest Feed" :
             activeFilter === "city_official" ? "City News" :
             activeFilter === "business_owner" ? "Business Updates" :
             activeFilter === "jobs" ? "Jobs & Opportunities" :
             activeFilter === "citizen" ? "Community Voices" :
             activeFilter === "polls" ? "All Polls" :
             "All Surveys"}
          </h2>
          <span className="text-[10px] tabular-nums" style={{ color: "var(--ink-strong)", opacity: 0.4 }}>{feedItems.length} items</span>
        </div>

        <div className="space-y-3 stagger">
          {feedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4" style={{ background: "var(--paper-warm)", border: "2px solid var(--rule-strong-c)" }}>
                <Icon
                  name={activeFilter === "polls" ? "chart" : activeFilter === "surveys" ? "document" : activeFilter === "jobs" ? "briefcase" : "pulse"}
                  size={28}
                  style={{ color: "var(--ink-strong)", opacity: 0.55 }}
                />
              </div>
              <p className="c-card-t text-sm font-semibold mb-1" style={{ color: "var(--ink-strong)" }}>
                {activeFilter === "polls"
                  ? "No active polls yet"
                  : activeFilter === "surveys"
                    ? "No active surveys yet"
                    : activeFilter === "jobs"
                      ? "No job posts yet"
                      : "No posts yet"}
              </p>
              <p className="text-xs" style={{ color: "var(--ink-strong)", opacity: 0.55 }}>
                {activeFilter === "polls"
                  ? "Polls will appear here when created by city officials."
                  : activeFilter === "surveys"
                    ? "Surveys will appear here when created by city officials."
                    : activeFilter === "jobs"
                      ? "Job and volunteer opportunities will appear here when posted."
                      : "Be the first to share something with Compton!"}
              </p>
            </div>
          ) : (
            <>
              {feedItems.map((item, index) => (
                <div key={`feed-${item.type}-${item.type === "post" ? (item.data as Post).id : item.type === "poll" ? (item.data as Poll).id : (item.data as Survey).id}`}>
                  {/* Interspersed: Suggested Profiles */}
                  {showInlineCards && index === PROFILES_INSERT_AT && suggestedProfiles.length > 0 && (
                    <div className="mb-3">
                      <SuggestedProfilesCard profiles={suggestedProfiles} />
                    </div>
                  )}

                  {/* Interspersed: Events */}
                  {showInlineCards && index === EVENTS_INSERT_AT && events.length > 0 && (
                    <div className="mb-3">
                      <InlineEventsCard events={events} />
                    </div>
                  )}

                  {/* Interspersed: Deals */}
                  {showInlineCards && index === DEALS_INSERT_AT && promotions.length > 0 && (
                    <div className="mb-3">
                      <InlineDealsCard promotions={promotions} />
                    </div>
                  )}

                  {/* Render the feed item */}
                  {item.type === "post" && (
                    <PostCard
                      post={item.data as Post}
                      userReactions={userReactions[(item.data as Post).id] || []}
                      userId={userId}
                    />
                  )}
                  {item.type === "poll" && (
                    <PollCard poll={item.data as Poll} userId={userId} />
                  )}
                  {item.type === "survey" && (
                    <SurveyCard survey={item.data as Survey} userId={userId} />
                  )}
                </div>
              ))}

              {/* If feed is shorter than insertion points, show remaining cards at end */}
              {showInlineCards && feedItems.length <= PROFILES_INSERT_AT && suggestedProfiles.length > 0 && (
                <SuggestedProfilesCard profiles={suggestedProfiles} />
              )}
              {showInlineCards && feedItems.length <= EVENTS_INSERT_AT && events.length > 0 && (
                <InlineEventsCard events={events} />
              )}
              {showInlineCards && feedItems.length <= DEALS_INSERT_AT && promotions.length > 0 && (
                <InlineDealsCard promotions={promotions} />
              )}
            </>
          )}
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-8" />

      {/* Modals */}
      {canPost && (
        <>
          <ComposeModal
            isOpen={composeOpen}
            onClose={() => setComposeOpen(false)}
            userId={userId}
            userName={userName}
          />
          {isOfficial && (
            <>
              <CreatePollModal isOpen={pollOpen} onClose={() => setPollOpen(false)} />
              <CreateSurveyModal isOpen={surveyOpen} onClose={() => setSurveyOpen(false)} />
            </>
          )}
        </>
      )}

    </div>
  );
}
