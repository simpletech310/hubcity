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
import type { Post, ReactionEmoji, LiveStream, Poll, Survey } from "@/types/database";

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

const filters = [
  { label: "All", value: "all", icon: "🔥", color: "#F2A900" },
  { label: "City News", value: "city_official", icon: "🏛️", color: "#3B82F6" },
  { label: "Business", value: "business_owner", icon: "🏪", color: "#22C55E" },
  { label: "Community", value: "citizen", icon: "💬", color: "#8B5CF6" },
  { label: "Polls", value: "polls", icon: "📊", color: "#06B6D4" },
  { label: "Surveys", value: "surveys", icon: "📋", color: "#EC4899" },
];

const eventCategoryColors: Record<string, string> = {
  city: "#F2A900", sports: "#22C55E", culture: "#8B5CF6", community: "#3B82F6", school: "#06B6D4", youth: "#EC4899",
};

// ─── Helpers ────────────────────────────────────────
function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return { month: d.toLocaleDateString("en-US", { month: "short" }), day: d.getDate(), weekday: d.toLocaleDateString("en-US", { weekday: "short" }) };
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
}: PulseFeedProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [composeOpen, setComposeOpen] = useState(false);
  const [pollOpen, setPollOpen] = useState(false);
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);

  const isOfficial = userRole === "city_official" || userRole === "admin";

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

  const filteredPosts =
    activeFilter === "all" || activeFilter === "polls" || activeFilter === "surveys"
      ? posts
      : posts.filter((p) => p.author?.role === activeFilter);

  // Pinned / city official posts
  const pinnedPosts = posts.filter(p => p.is_pinned);
  const officialPosts = posts.filter(p => p.author?.role === "city_official" || p.author?.role === "city_ambassador" || p.author?.role === "admin");
  const businessPosts = posts.filter(p => p.author?.role === "business_owner");

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
    for (const poll of polls) {
      feedItems.push({ type: "poll", data: poll, time: poll.created_at });
    }
  }
  if (showSurveys) {
    for (const survey of surveys) {
      feedItems.push({ type: "survey", data: survey, time: survey.created_at });
    }
  }

  feedItems.sort((a, b) => {
    if (a.type === "post" && (a.data as Post).is_pinned) return -1;
    if (b.type === "post" && (b.data as Post).is_pinned) return 1;
    return new Date(b.time).getTime() - new Date(a.time).getTime();
  });

  return (
    <div className="animate-fade-in pb-safe">
      {/* ─── Hero ─── */}
      <div className="relative h-56 overflow-hidden">
        <img
          src="/images/generated/pulse-hero.png"
          alt="City Pulse"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-midnight/50 via-midnight/80 to-midnight" />
        <div className="absolute inset-0 pattern-dots opacity-20" />

        <div className="absolute inset-0 flex flex-col justify-end p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 bg-gold/15 border border-gold/25 rounded-full px-3 py-1 text-[10px] font-bold text-gold badge-shine uppercase tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              Live Feed
            </span>
            {liveStreams.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-compton-red/15 border border-compton-red/25 rounded-full px-2.5 py-1 text-[10px] font-semibold text-compton-red">
                <span className="w-1.5 h-1.5 rounded-full bg-compton-red animate-pulse" />
                {liveStreams.length} Live Now
              </span>
            )}
          </div>
          <h1 className="font-display text-3xl font-bold leading-tight mb-1">
            City <span className="text-gold-gradient">Pulse</span>
          </h1>
          <p className="text-sm text-white/50">
            News, voices, and vibes from Compton
          </p>
        </div>
      </div>

      {/* ─── Stats Strip ─── */}
      <div className="px-5 -mt-3 mb-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "Posts", value: posts.length.toString(), color: "#F2A900" },
            { label: "Polls", value: polls.length.toString(), color: "#06B6D4" },
            { label: "Events", value: events.length.toString(), color: "#22C55E" },
            { label: "Live", value: liveStreams.length.toString(), color: "#EF4444" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border-subtle rounded-xl p-2.5 text-center">
              <p className="text-base font-bold font-heading" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-[9px] text-white/30 uppercase tracking-wider mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filter Chips ─── */}
      <div className="flex gap-2 px-5 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2 text-[11px] font-semibold transition-all press"
              style={{
                background: isActive ? `${f.color}20` : "rgba(255,255,255,0.04)",
                color: isActive ? f.color : "rgba(255,255,255,0.4)",
                border: `1px solid ${isActive ? `${f.color}30` : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span>{f.icon}</span>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ─── Trending Hashtags ─── */}
      {trendingHashtags.length > 0 && activeFilter === "all" && (
        <div className="px-5 mb-5">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mb-2">Trending</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {trendingHashtags.map((t) => (
              <span
                key={t.hashtag}
                className="shrink-0 bg-gold/10 text-gold text-[11px] font-bold px-3 py-1.5 rounded-full cursor-pointer hover:bg-gold/20 transition-colors"
              >
                #{t.hashtag} <span className="text-gold/50">({t.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ─── Live Streams (prominent section) ─── */}
      {liveStreams.length > 0 && activeFilter === "all" && (
        <section className="mb-5">
          <div className="px-5 mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-compton-red" />
              Live Now
            </h2>
            <p className="text-[11px] text-white/30">Streaming from Compton</p>
          </div>
          <div className="px-5 space-y-3">
            {liveStreams.map((stream) => (
              <PulseLiveCard key={stream.id} stream={stream} />
            ))}
          </div>
        </section>
      )}

      {/* ─── City Events (horizontal scroller) ─── */}
      {events.length > 0 && activeFilter === "all" && (
        <section className="mb-5">
          <div className="flex items-center justify-between px-5 mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-hc-blue" />
                Upcoming Events
              </h2>
              <p className="text-[11px] text-white/30">What&apos;s happening this week</p>
            </div>
            <Link href="/events" className="text-[11px] text-gold font-semibold press">All Events</Link>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {events.map((event) => {
              const { month, day, weekday } = formatEventDate(event.start_date);
              const color = eventCategoryColors[event.category] || "#F2A900";
              return (
                <Link key={event.id} href={`/events/${event.id}`} className="block shrink-0 w-[200px] press">
                  <div className="relative h-[140px] rounded-2xl overflow-hidden border border-border-subtle">
                    {event.image_url ? (
                      <Image src={event.image_url} alt={event.title} fill className="object-cover" sizes="200px" />
                    ) : (
                      <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${color}20, ${color}05)` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                    {/* Date badge */}
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1 text-center border border-white/10">
                      <p className="text-[8px] font-bold uppercase" style={{ color }}>{weekday}</p>
                      <p className="text-sm font-bold leading-none">{day}</p>
                      <p className="text-[8px] text-white/50 uppercase">{month}</p>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <h3 className="font-heading font-bold text-[11px] leading-tight line-clamp-2 mb-1">{event.title}</h3>
                      {event.location_name && (
                        <p className="text-[9px] text-white/50 truncate">{event.location_name}</p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Active Polls (quick access) ─── */}
      {polls.length > 0 && activeFilter === "all" && (
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-cyan" />
                City Polls
              </h2>
              <p className="text-[11px] text-white/30">Your voice matters — vote now</p>
            </div>
            <button onClick={() => setActiveFilter("polls")} className="text-[11px] text-gold font-semibold press">See All</button>
          </div>
          <div className="space-y-3">
            {polls.slice(0, 2).map((poll) => (
              <PollCard key={`poll-hero-${poll.id}`} poll={poll} userId={userId} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Active Surveys ─── */}
      {surveys.length > 0 && activeFilter === "all" && (
        <section className="px-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-heading font-bold text-base flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-pink" />
                City Surveys
              </h2>
              <p className="text-[11px] text-white/30">Help shape Compton&apos;s future</p>
            </div>
            <button onClick={() => setActiveFilter("surveys")} className="text-[11px] text-gold font-semibold press">See All</button>
          </div>
          <div className="space-y-3">
            {surveys.slice(0, 2).map((survey) => (
              <SurveyCard key={`survey-hero-${survey.id}`} survey={survey} userId={userId} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Business Promotions ─── */}
      {promotions.length > 0 && activeFilter === "all" && (
        <section className="mb-5">
          <div className="px-5 mb-3">
            <h2 className="font-heading font-bold text-base flex items-center gap-2">
              <div className="w-1 h-5 rounded-full bg-gold" />
              Business Promos
            </h2>
            <p className="text-[11px] text-white/30">Deals from local businesses</p>
          </div>
          <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide pb-2">
            {promotions.map((promo) => {
              const biz = promo.business as Promotion["business"];
              const typeColors: Record<string, string> = {
                bogo: "#FF6B6B", discount: "#22C55E", free_item: "#06B6D4", bundle: "#F2A900", loyalty: "#8B5CF6",
              };
              const typeIcons: Record<string, string> = {
                bogo: "🎁", discount: "💰", free_item: "🆓", bundle: "📦", loyalty: "⭐",
              };
              const color = typeColors[promo.promo_type] || "#F2A900";
              return (
                <Link
                  key={promo.id}
                  href={biz?.slug ? `/business/${biz.slug}` : "#"}
                  className="block shrink-0 w-[200px] press"
                >
                  <div className="bg-card rounded-2xl border border-border-subtle p-3.5 h-full hover:border-white/10 transition-all" style={{ borderTopWidth: 2, borderTopColor: color }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}12` }}>
                        <span className="text-sm">{typeIcons[promo.promo_type] || "🏷️"}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-white/30 truncate">{biz?.name || "Local Business"}</p>
                        <span className="text-[9px] font-bold rounded-full px-1.5 py-0.5" style={{ background: `${color}15`, color }}>
                          {promo.promo_type === "bogo" ? "BOGO" : promo.promo_type === "discount" ? `${promo.discount_percent}% Off` : promo.promo_type}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-heading font-bold text-[12px] leading-tight line-clamp-2 mb-1">{promo.title}</h3>
                    {promo.promo_code && (
                      <span className="text-[10px] font-mono bg-white/[0.04] px-2 py-0.5 rounded text-gold border border-white/[0.06]">
                        {promo.promo_code}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Main Feed ─── */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-base flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gold" />
            {activeFilter === "all" ? "Latest Feed" :
             activeFilter === "city_official" ? "City News" :
             activeFilter === "business_owner" ? "Business Updates" :
             activeFilter === "citizen" ? "Community Voices" :
             activeFilter === "polls" ? "All Polls" :
             "All Surveys"}
          </h2>
          <span className="text-[10px] text-white/20">{feedItems.length} items</span>
        </div>

        <div className="space-y-3 stagger">
          {feedItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">
                  {activeFilter === "polls" ? "📊" : activeFilter === "surveys" ? "📋" : "📡"}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">
                {activeFilter === "polls"
                  ? "No active polls"
                  : activeFilter === "surveys"
                    ? "No active surveys"
                    : "No posts yet"}
              </p>
              <p className="text-xs text-white/30">
                {activeFilter === "polls" || activeFilter === "surveys"
                  ? "Check back soon!"
                  : "Be the first to share something!"}
              </p>
            </div>
          ) : (
            feedItems.map((item) => {
              if (item.type === "post") {
                const post = item.data as Post;
                return (
                  <PostCard
                    key={`post-${post.id}`}
                    post={post}
                    userReactions={userReactions[post.id] || []}
                    userId={userId}
                  />
                );
              }
              if (item.type === "poll") {
                const poll = item.data as Poll;
                return <PollCard key={`poll-${poll.id}`} poll={poll} userId={userId} />;
              }
              if (item.type === "survey") {
                const survey = item.data as Survey;
                return <SurveyCard key={`survey-${survey.id}`} survey={survey} userId={userId} />;
              }
              return null;
            })
          )}
        </div>
      </section>

      {/* ─── Compton CTA ─── */}
      <section className="px-5 mt-6 mb-8">
        <div className="relative overflow-hidden rounded-2xl border border-gold/20 p-5" style={{ background: "linear-gradient(135deg, rgba(242,169,0,0.08), rgba(242,169,0,0.02))" }}>
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10">
            <svg viewBox="0 0 100 100" fill="none" stroke="#F2A900" strokeWidth="1">
              <circle cx="80" cy="20" r="40" />
              <circle cx="80" cy="20" r="25" />
            </svg>
          </div>
          <div className="relative">
            <span className="text-2xl block mb-2">📡</span>
            <h3 className="font-heading font-bold text-lg mb-1">Stay Connected</h3>
            <p className="text-[12px] text-white/40 leading-relaxed mb-3">
              City Pulse is your direct line to Compton — government updates, community voices, business news, and everything in between.
            </p>
            <div className="flex gap-2">
              <Link
                href="/live"
                className="inline-flex items-center gap-2 bg-gold text-midnight rounded-full px-4 py-2.5 text-[12px] font-bold press hover:bg-gold-light transition-colors"
              >
                Watch Live
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2.5 text-[12px] font-medium press border border-white/10"
              >
                Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAB ─── */}
      {userId && (
        <>
          {fabExpanded && (
            <div className="fixed inset-0 z-30" onClick={() => setFabExpanded(false)} />
          )}

          {fabExpanded && (
            <div
              className="fixed bottom-40 z-40 flex flex-col gap-2 items-end animate-fade-in"
              style={{ right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))" }}
            >
              <button
                onClick={() => { setFabExpanded(false); setComposeOpen(true); }}
                className="flex items-center gap-2 bg-card border border-border-subtle rounded-full pl-4 pr-3 py-2.5 press hover:border-gold/30 transition-colors shadow-lg"
              >
                <span className="text-[12px] font-semibold">New Post</span>
                <span className="text-base">📝</span>
              </button>
              {isOfficial && (
                <>
                  <button
                    onClick={() => { setFabExpanded(false); setPollOpen(true); }}
                    className="flex items-center gap-2 bg-card border border-cyan/20 rounded-full pl-4 pr-3 py-2.5 press hover:border-cyan/40 transition-colors shadow-lg"
                  >
                    <span className="text-[12px] font-semibold text-cyan">New Poll</span>
                    <span className="text-base">📊</span>
                  </button>
                  <button
                    onClick={() => { setFabExpanded(false); setSurveyOpen(true); }}
                    className="flex items-center gap-2 bg-card border border-hc-purple/20 rounded-full pl-4 pr-3 py-2.5 press hover:border-hc-purple/40 transition-colors shadow-lg"
                  >
                    <span className="text-[12px] font-semibold text-hc-purple">New Survey</span>
                    <span className="text-base">📋</span>
                  </button>
                </>
              )}
            </div>
          )}

          <button
            onClick={() => {
              if (isOfficial) setFabExpanded(!fabExpanded);
              else setComposeOpen(true);
            }}
            className={`fixed bottom-24 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center text-midnight press z-40 hover:scale-105 transition-transform ${fabExpanded ? "rotate-45" : ""}`}
            style={{ right: "max(1rem, calc((100vw - 430px) / 2 + 1rem))" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </>
      )}

      {/* Modals */}
      {userId && (
        <>
          <ComposeModal isOpen={composeOpen} onClose={() => setComposeOpen(false)} userId={userId} userName={userName} />
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
