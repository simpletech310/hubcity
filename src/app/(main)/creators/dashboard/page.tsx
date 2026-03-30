"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import CreatorBadge from "@/components/creators/CreatorBadge";

type CreatorTier = "starter" | "rising" | "partner" | "premium";

interface CreatorProfile {
  id: string;
  display_name: string;
  handle: string | null;
  avatar_url: string | null;
  role: string;
  is_creator: boolean;
  creator_tier: CreatorTier;
}

interface ChannelInfo {
  id: string;
  name: string;
  slug: string;
  follower_count: number;
  is_verified: boolean;
}

interface Earning {
  id: string;
  date: string;
  source: string;
  amount: number;
  status: "pending" | "paid" | "processing";
}

interface EarningsData {
  total_earnings: number;
  this_month: number;
  pending_payout: number;
  content_count: number;
  total_views: number;
  recent_earnings: Earning[];
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [channel, setChannel] = useState<ChannelInfo | null>(null);
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login?redirect=/creators/dashboard");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, display_name, handle, avatar_url, role, is_creator, creator_tier")
      .eq("id", user.id)
      .single();

    if (!profileData || (!profileData.is_creator && profileData.role !== "content_creator")) {
      router.push("/creators/apply");
      return;
    }

    setProfile(profileData as CreatorProfile);

    // Fetch channel
    const { data: channelData } = await supabase
      .from("channels")
      .select("id, name, slug, follower_count, is_verified")
      .eq("owner_id", user.id)
      .limit(1)
      .single();

    if (channelData) {
      setChannel(channelData as ChannelInfo);
    }

    // Fetch earnings
    try {
      const res = await fetch("/api/creators/earnings");
      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
      }
    } catch {
      // Earnings API may not be set up yet — use defaults
    }

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="animate-fade-in pb-safe px-5 pt-5">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="h-6 bg-white/5 rounded w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const tier = (profile.creator_tier || "starter") as CreatorTier;
  const displayName = profile.display_name || "Creator";
  const earningsData = earnings || {
    total_earnings: 0,
    this_month: 0,
    pending_payout: 0,
    content_count: 0,
    total_views: 0,
    recent_earnings: [],
  };

  const kpis = [
    { label: "Total Earnings", value: formatCurrency(earningsData.total_earnings), color: "#F2A900", icon: "💰" },
    { label: "This Month", value: formatCurrency(earningsData.this_month), color: "#22C55E", icon: "📈" },
    { label: "Pending Payout", value: formatCurrency(earningsData.pending_payout), color: "#8B5CF6", icon: "⏳" },
    { label: "Content Count", value: String(earningsData.content_count), color: "#3B82F6", icon: "🎬" },
  ];

  return (
    <div className="animate-fade-in pb-safe">
      {/* Creator Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-deep to-hc-purple/6" />
        <div className="absolute inset-0 pattern-dots opacity-15" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-midnight to-transparent" />

        <div className="relative z-10 px-5 pt-6 pb-5">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={displayName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-midnight shadow-lg shadow-gold/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center text-midnight font-heading font-bold text-xl ring-4 ring-midnight shadow-lg shadow-gold/20">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="font-heading text-xl font-bold truncate">{displayName}</h1>
                <CreatorBadge tier={tier} />
              </div>
              <p className="text-sm text-txt-secondary">{profile.handle || "@creator"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: kpi.color }} />
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${kpi.color}12` }}
                >
                  <span className="text-lg">{kpi.icon}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-heading font-bold text-lg leading-none" style={{ color: kpi.color }}>
                    {kpi.value}
                  </p>
                  <p className="text-[9px] text-txt-secondary font-semibold uppercase tracking-wider mt-0.5">
                    {kpi.label}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Channel Section */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Your Channel</h2>
        </div>
        {channel ? (
          <Link href={`/channels/${channel.slug}`}>
            <Card hover className="relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center">
                    <span className="text-xl">📺</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-bold text-sm">{channel.name}</p>
                      {channel.is_verified && (
                        <Badge label="Verified" variant="emerald" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-txt-secondary">
                        <span className="text-white font-bold">{channel.follower_count}</span> followers
                      </span>
                      <span className="text-[10px] text-txt-secondary">
                        <span className="text-white font-bold">{earningsData.total_views}</span> views
                      </span>
                    </div>
                  </div>
                </div>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-txt-secondary/50">
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </div>
            </Card>
          </Link>
        ) : (
          <Card>
            <div className="text-center py-4">
              <p className="text-sm text-txt-secondary mb-3">No channel created yet</p>
              <Button variant="outline" size="sm">Create Channel</Button>
            </div>
          </Card>
        )}
      </section>

      {/* Recent Earnings */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-emerald" />
          <h2 className="font-heading font-bold text-base">Recent Earnings</h2>
        </div>
        {earningsData.recent_earnings.length > 0 ? (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {earningsData.recent_earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold">{earning.source}</p>
                    <p className="text-[10px] text-txt-secondary">
                      {new Date(earning.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-sm text-emerald">
                      {formatCurrency(earning.amount)}
                    </span>
                    <Badge
                      label={earning.status}
                      variant={earning.status === "paid" ? "emerald" : earning.status === "processing" ? "blue" : "gold"}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-6">
              <span className="text-3xl block mb-2">📊</span>
              <p className="text-xs text-txt-secondary">
                Earnings will appear here once you start creating content
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* Quick Actions */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-hc-blue" />
          <h2 className="font-heading font-bold text-base">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { label: "Go Live", icon: "🔴", color: "#FF6B6B", href: "/live" },
            { label: "Upload Video", icon: "📹", color: "#3B82F6", href: channel ? `/live/channel/${channel.id}` : "/live" },
            { label: "Podcasts", icon: "🎙️", color: "#8B5CF6", href: "/podcasts" },
          ].map((action) => (
            <Link key={action.label} href={action.href}>
              <Card hover className="relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: action.color }} />
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${action.color}12` }}
                >
                  <span className="text-xl">{action.icon}</span>
                </div>
                <p className="text-[11px] font-bold">{action.label}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Revenue Split Reminder */}
      <section className="px-5 mb-8">
        <div className="rounded-2xl bg-white/[0.03] border border-border-subtle p-4">
          <p className="text-[10px] font-bold text-txt-secondary uppercase tracking-wider mb-2">Revenue Split</p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <span className="text-gold font-bold">40% Creator</span>
            <span className="text-white/20">/</span>
            <span className="text-hc-blue font-bold">30% Platform</span>
            <span className="text-white/20">/</span>
            <span className="text-emerald font-bold">30% Community Fund</span>
          </div>
        </div>
      </section>
    </div>
  );
}
