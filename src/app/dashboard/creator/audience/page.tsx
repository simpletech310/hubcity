"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";

interface CityBreakdown {
  city: string;
  count: number;
  pct: number;
}

interface TopContent {
  id: string;
  label: string;
  type: "reel" | "video";
  metric: number; // view_count or like_count
  thumbnail_url?: string | null;
}

interface AudienceData {
  subscriberCount: number;
  growthCount: number;       // new subs last 30 days
  growthPriorCount: number;  // new subs prior 30 days (for delta)
  topCities: CityBreakdown[];
  topContent: TopContent[];
  recentSubscribers: {
    id: string;
    display_name: string;
    avatar_url?: string | null;
  }[];
  engagementRate: number | null; // likes / views on reels, as %
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatGrowthDelta(current: number, prior: number): {
  label: string;
  positive: boolean | null;
} {
  if (prior === 0 && current === 0) return { label: "No change", positive: null };
  if (prior === 0) return { label: `+${current} this month`, positive: true };
  const pct = ((current - prior) / prior) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    label: `${sign}${pct.toFixed(0)}% vs last month`,
    positive: pct >= 0,
  };
}

export default function AudiencePage() {
  const [data, setData] = useState<AudienceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAudience() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // ── Get the creator's channel (owner_id is the correct column) ──
        const { data: channel } = await supabase
          .from("channels")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (!channel) {
          setData({
            subscriberCount: 0,
            growthCount: 0,
            growthPriorCount: 0,
            topCities: [],
            topContent: [],
            recentSubscribers: [],
            engagementRate: null,
          });
          return;
        }

        const channelId = channel.id;
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

        // ── 1. Total active subscriber count ──────────────────────────────
        const { count: totalCount } = await supabase
          .from("channel_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId)
          .eq("status", "active");

        const subscriberCount = totalCount ?? 0;

        // ── 2. Growth: last 30 days vs prior 30 days ──────────────────────
        const { count: growthCount } = await supabase
          .from("channel_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId)
          .eq("status", "active")
          .gte("created_at", thirtyDaysAgo);

        const { count: growthPriorCount } = await supabase
          .from("channel_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId)
          .eq("status", "active")
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo);

        // ── 3. City breakdown — join channel_subscriptions → profiles → cities
        //    Fetch all active subs with their subscriber profile city_id
        const { data: subsWithCity } = await supabase
          .from("channel_subscriptions")
          .select(
            "user_id, subscriber:profiles!channel_subscriptions_user_id_fkey(city_id)"
          )
          .eq("channel_id", channelId)
          .eq("status", "active");

        // Count by city_id
        const cityCountMap: Record<string, number> = {};
        let totalWithCity = 0;
        for (const sub of subsWithCity ?? []) {
          const rawSub = sub.subscriber;
          const profile = (
            Array.isArray(rawSub) ? rawSub[0] : rawSub
          ) as { city_id?: string | null } | null;
          if (profile?.city_id) {
            cityCountMap[profile.city_id] = (cityCountMap[profile.city_id] ?? 0) + 1;
            totalWithCity++;
          }
        }

        // Resolve top 5 city IDs to names
        const topCityEntries = Object.entries(cityCountMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        let topCities: CityBreakdown[] = [];
        if (topCityEntries.length > 0) {
          const topCityIds = topCityEntries.map(([id]) => id);
          const { data: cityRows } = await supabase
            .from("cities")
            .select("id, name")
            .in("id", topCityIds);

          const denom = totalWithCity > 0 ? totalWithCity : 1;
          topCities = topCityEntries.map(([id, count]) => ({
            city: cityRows?.find((c) => c.id === id)?.name ?? "Unknown",
            count,
            pct: Math.round((count / denom) * 100),
          }));
        }

        // ── 4. Recent subscribers (avatar row — up to 8) ─────────────────
        const { data: recentSubs } = await supabase
          .from("channel_subscriptions")
          .select(
            "user_id, subscriber:profiles!channel_subscriptions_user_id_fkey(id, display_name, avatar_url)"
          )
          .eq("channel_id", channelId)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8);

        const recentSubscribers = (recentSubs ?? []).map((sub) => {
          // Supabase may return the joined row as an object or array depending on cardinality inference
          const rawProfile = sub.subscriber;
          const profile = (
            Array.isArray(rawProfile) ? rawProfile[0] : rawProfile
          ) as { id: string; display_name: string; avatar_url?: string | null } | null;
          return {
            id: profile?.id ?? sub.user_id,
            display_name: profile?.display_name ?? "Subscriber",
            avatar_url: profile?.avatar_url ?? null,
          };
        });

        // ── 5a. Top reels — by view_count desc, then like_count as fallback ──
        //   reels uses: author_id, view_count, like_count, caption, poster_url
        const { data: reelsData } = await supabase
          .from("reels")
          .select("id, caption, view_count, like_count, poster_url")
          .eq("author_id", user.id)
          .eq("is_published", true)
          .order("view_count", { ascending: false })
          .order("like_count", { ascending: false })
          .limit(5);

        // ── 5b. Top channel videos — by view_count desc ───────────────────
        const { data: videosData } = await supabase
          .from("channel_videos")
          .select("id, title, view_count, thumbnail_url")
          .eq("channel_id", channelId)
          .eq("is_published", true)
          .order("view_count", { ascending: false, nullsFirst: false })
          .limit(5);

        // Merge reels + videos, sort by metric, take top 5
        const reelItems: TopContent[] = (reelsData ?? []).map((r) => ({
          id: r.id,
          label: r.caption ?? "Reel",
          type: "reel",
          metric: r.view_count ?? r.like_count ?? 0,
          thumbnail_url: r.poster_url,
        }));

        const videoItems: TopContent[] = (videosData ?? []).map((v) => ({
          id: v.id,
          label: v.title ?? "Video",
          type: "video",
          metric: v.view_count ?? 0,
          thumbnail_url: v.thumbnail_url,
        }));

        const topContent = [...reelItems, ...videoItems]
          .sort((a, b) => b.metric - a.metric)
          .slice(0, 5);

        // ── 6. Engagement rate: total likes / total views on reels ─────────
        let engagementRate: number | null = null;
        if (reelsData && reelsData.length > 0) {
          const totalLikes = reelsData.reduce((s, r) => s + (r.like_count ?? 0), 0);
          const totalViews = reelsData.reduce((s, r) => s + (r.view_count ?? 0), 0);
          if (totalViews > 0) {
            engagementRate = (totalLikes / totalViews) * 100;
          } else if (totalLikes > 0) {
            // No view data — use like count as proxy indicator
            engagementRate = null;
          }
        }

        setData({
          subscriberCount,
          growthCount: growthCount ?? 0,
          growthPriorCount: growthPriorCount ?? 0,
          topCities,
          topContent,
          recentSubscribers,
          engagementRate,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAudience();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-5 space-y-4">
        <div className="h-6 skeleton rounded w-1/3" />
        <div className="h-28 skeleton rounded-2xl" />
        <div className="h-16 skeleton rounded-2xl" />
        <div className="h-20 skeleton rounded-2xl" />
        <div className="h-40 skeleton rounded-2xl" />
      </div>
    );
  }

  const d = data ?? {
    subscriberCount: 0,
    growthCount: 0,
    growthPriorCount: 0,
    topCities: [],
    topContent: [],
    recentSubscribers: [],
    engagementRate: null,
  };

  const maxCityCount = d.topCities[0]?.count ?? 1;
  const growth = formatGrowthDelta(d.growthCount, d.growthPriorCount);

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-lg text-white">Audience</h1>
        <p className="text-xs text-white/40 mt-0.5">Who&apos;s watching you</p>
      </div>

      {/* Subscriber count — hero */}
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-2">
          Subscribers
        </p>
        <p className="font-heading text-4xl font-bold text-white">
          {d.subscriberCount.toLocaleString()}
        </p>
        {/* Growth delta */}
        {growth.positive !== null ? (
          <p
            className={`text-xs mt-1.5 font-medium ${
              growth.positive ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {growth.label}
          </p>
        ) : (
          <p className="text-xs text-white/40 mt-1.5">
            {d.subscriberCount === 0
              ? "Share your channel to grow your audience"
              : "Keep creating — your community is growing"}
          </p>
        )}
        {growth.positive === null && d.growthCount > 0 && (
          <p className="text-xs text-emerald-400 mt-1">
            +{d.growthCount} new this month
          </p>
        )}
      </div>

      {/* Engagement rate pill */}
      {d.engagementRate !== null && (
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-white/50 font-medium">Reel Engagement</p>
            <p className="text-sm font-bold text-gold">
              {d.engagementRate.toFixed(1)}%
            </p>
          </div>
          <div className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 flex items-center justify-between">
            <p className="text-xs text-white/50 font-medium">New This Month</p>
            <p className="text-sm font-bold text-white">{d.growthCount}</p>
          </div>
        </div>
      )}

      {/* Recent subscribers */}
      {d.recentSubscribers.length > 0 && (
        <div>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
            Recent Subscribers
          </h2>
          <Card>
            <div className="flex flex-wrap gap-3">
              {d.recentSubscribers.map((sub) => (
                <div key={sub.id} className="flex flex-col items-center gap-1.5">
                  {sub.avatar_url ? (
                    <img
                      src={sub.avatar_url}
                      alt={sub.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-gold">
                        {getInitials(sub.display_name)}
                      </span>
                    </div>
                  )}
                  <span className="text-[9px] text-white/50 max-w-[40px] text-center truncate">
                    {sub.display_name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Cities breakdown */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          Top Cities
        </h2>
        {d.topCities.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-sm text-white/40">Not enough data yet</p>
            <p className="text-xs text-white/25 mt-1">
              City insights appear once subscribers verify their address
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {d.topCities.map((city, i) => (
                <div key={city.city} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="text-xs font-bold text-white/30 w-4 text-center">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-white truncate">
                        {city.city}
                      </p>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="text-xs text-white/40">{city.pct}%</span>
                        <span className="text-xs font-semibold text-gold">
                          {city.count}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold to-gold-light"
                        style={{
                          width: `${(city.count / maxCityCount) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Top content */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          Top Content
        </h2>
        {d.topContent.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-sm text-white/40">No content yet</p>
            <p className="text-xs text-white/25 mt-1">
              Your top reels and videos will appear here
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {d.topContent.map((item, i) => (
              <Card key={item.id} className="flex items-center gap-3">
                {/* Rank */}
                <span className="text-xs font-bold text-white/30 w-4 shrink-0 text-center">
                  {i + 1}
                </span>
                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
                  {item.thumbnail_url ? (
                    <img
                      src={item.thumbnail_url}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {item.type === "reel" ? (
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="text-white/20"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125A1.125 1.125 0 012.25 18.375V6.375m0 0A1.125 1.125 0 013.375 5.25h1.5C5.496 5.25 6 5.754 6 6.375m-3.75 0h18m-18 0A1.125 1.125 0 012.25 6.375v12M18 6.375A1.125 1.125 0 0119.125 5.25h1.5c.621 0 1.125.504 1.125 1.125v12a1.125 1.125 0 01-1.125 1.125h-1.5A1.125 1.125 0 0118 18.375V6.375z"
                          />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          className="text-white/20"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {/* Label + type badge */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5 capitalize">
                    {item.type}
                  </p>
                </div>
                {/* Metric */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg
                    width="12"
                    height="12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-gold">
                    {item.metric >= 1000
                      ? `${(item.metric / 1000).toFixed(1)}k`
                      : item.metric}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
