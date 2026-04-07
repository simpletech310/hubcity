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
  { label: "Jobs", value: "jobs", icon: "💼", color: "#F59E0B" },
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
      : activeFilter === "jobs"
        ? posts.filter((p) => p.hashtags?.includes("jobs") || p.hashtags?.includes("hiring"))
        : posts.filter((p) => p.author?.role === activeFilter);

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
      {/* ─── Filter Chips ─── */}
      <div className="flex gap-2 px-5 pt-4 mb-3 overflow-x-auto scrollbar-hide pb-1">
        {filters.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className="flex items-center gap-1.5 shrink-0 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-all press"
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

      {/* ─── Trending Hashtags (inline chips) ─── */}
      {trendingHashtags.length > 0 && activeFilter === "all" && (
        <div className="flex items-center gap-2 px-5 mb-4 overflow-x-auto scrollbar-hide pb-1">
          <span className="text-[10px] text-white/30 uppercase tracking-wider font-semibold shrink-0">Trending</span>
          {trendingHashtags.map((t) => (
            <span
              key={t.hashtag}
              className="shrink-0 bg-gold/8 text-gold/80 text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer hover:bg-gold/15 transition-colors"
            >
              #{t.hashtag}
            </span>
          ))}
        </div>
      )}

      {/* ─── Main Feed ─── */}
      <section className="px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-heading font-bold text-base flex items-center gap-2">
            <div className="w-1 h-5 rounded-full bg-gold" />
            {activeFilter === "all" ? "Latest Feed" :
             activeFilter === "city_official" ? "City News" :
             activeFilter === "business_owner" ? "Business Updates" :
             activeFilter === "jobs" ? "Jobs & Opportunities" :
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
                  {activeFilter === "polls" ? "📊" : activeFilter === "surveys" ? "📋" : activeFilter === "jobs" ? "💼" : "📡"}
                </span>
              </div>
              <p className="text-sm font-semibold mb-1">
                {activeFilter === "polls"
                  ? "No active polls yet"
                  : activeFilter === "surveys"
                    ? "No active surveys yet"
                    : activeFilter === "jobs"
                      ? "No job posts yet"
                      : "No posts yet"}
              </p>
              <p className="text-xs text-white/30">
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

      {/* ─── Discover More ─── */}
      {activeFilter === "all" && (liveStreams.length > 0 || events.length > 0 || polls.length > 0 || surveys.length > 0 || promotions.length > 0) && (
        <div className="mt-6">
          <div className="px-5 mb-4">
            <h2 className="font-heading font-bold text-base flex items-center gap-2 text-white/60">
              <div className="w-1 h-5 rounded-full bg-white/20" />
              Discover More
            </h2>
          </div>

          {/* Live Streams */}
          {liveStreams.length > 0 && (
            <section className="mb-5">
              <div className="px-5 mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-compton-red" />
                  Live Now
                </h3>
              </div>
              <div className="px-5 space-y-3">
                {liveStreams.map((stream) => (
                  <PulseLiveCard key={stream.id} stream={stream} />
                ))}
              </div>
            </section>
          )}

          {/* City Events (horizontal scroller) */}
          {events.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center justify-between px-5 mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-hc-blue" />
                  Upcoming Events
                </h3>
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
                          <h4 className="font-heading font-bold text-[11px] leading-tight line-clamp-2 mb-1">{event.title}</h4>
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

          {/* Active Polls (quick access) */}
          {polls.length > 0 && (
            <section className="px-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-cyan" />
                  City Polls
                </h3>
                <button onClick={() => setActiveFilter("polls")} className="text-[11px] text-gold font-semibold press">See All</button>
              </div>
              <div className="space-y-3">
                {polls.slice(0, 2).map((poll) => (
                  <PollCard key={`poll-hero-${poll.id}`} poll={poll} userId={userId} />
                ))}
              </div>
            </section>
          )}

          {/* Active Surveys */}
          {surveys.length > 0 && (
            <section className="px-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-pink" />
                  City Surveys
                </h3>
                <button onClick={() => setActiveFilter("surveys")} className="text-[11px] text-gold font-semibold press">See All</button>
              </div>
              <div className="space-y-3">
                {surveys.slice(0, 2).map((survey) => (
                  <SurveyCard key={`survey-hero-${survey.id}`} survey={survey} userId={userId} />
                ))}
              </div>
            </section>
          )}

          {/* Business Promotions */}
          {promotions.length > 0 && (
            <section className="mb-5">
              <div className="px-5 mb-3">
                <h3 className="font-heading font-bold text-sm flex items-center gap-2">
                  <div className="w-1 h-4 rounded-full bg-gold" />
                  Business Promos
                </h3>
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
                        <h4 className="font-heading font-bold text-[12px] leading-tight line-clamp-2 mb-1">{promo.title}</h4>
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
        </div>
      )}

      {/* Bottom spacer */}
      <div className="h-8" />

      {/* ─── FAB — only for non-citizen roles (business_owner, city_official, admin, etc.) ─── */}
      {userId && userRole !== "citizen" && (
        <>
          {fabExpanded && (
            <div className="fixed inset-0 z-30" onClick={() => setFabExpanded(false)} />
          )}

          {fabExpanded && (
            <div className="fixed right-5 bottom-40 z-40 flex flex-col gap-2 items-end animate-fade-in">
              <button
                onClick={() => { setFabExpanded(false); setComposeOpen(true); }}
                className="flex items-center gap-2 bg-card border border-border-subtle rounded-full pl-4 pr-3 py-2.5 press hover:border-gold/30 transition-colors shadow-lg"
              >
                <span className="text-[12px] font-semibold">New Post</span>
                <span className="text-base">📝</span>
              </button>
              {(userRole === "city_official" || userRole === "admin") && (
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
            onClick={() => setFabExpanded(!fabExpanded)}
            className={`fixed right-5 bottom-28 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light shadow-lg shadow-gold/30 flex items-center justify-center text-midnight press z-40 hover:scale-105 transition-transform ${fabExpanded ? "rotate-45" : ""}`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </>
      )}

      {/* Modals — only for non-citizen roles */}
      {userId && userRole !== "citizen" && (
        <>
          <ComposeModal isOpen={composeOpen} onClose={() => setComposeOpen(false)} userId={userId} userName={userName} />
          {(userRole === "city_official" || userRole === "admin") && (
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
