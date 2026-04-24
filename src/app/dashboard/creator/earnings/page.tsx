"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

interface EarningsData {
  hasStripe: boolean;
  subscriptionPrice: number | null;
  subscriberCount: number;
  subscriptionEarnings: number;
  adEarnings: number;
  ppvEarnings: number;
  tipEarnings: number;
  collabEarnings: number;
  totalEarnings: number;
  pendingPayout: number;
  recentPayouts: Payout[];
}

interface Payout {
  id: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  created_at: string;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const payoutStatusVariants: Record<Payout["status"], "emerald" | "gold" | "coral"> = {
  paid: "emerald",
  pending: "gold",
  failed: "coral",
};

export default function EarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEarnings() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get channel info
        const { data: channel } = await supabase
          .from("channels")
          .select("id, subscription_price, stripe_account_id")
          .eq("user_id", user.id)
          .single();

        const hasStripe = !!channel?.stripe_account_id;
        const channelId = channel?.id ?? null;

        // Subscriber count
        let subscriberCount = 0;
        if (channelId) {
          const { count } = await supabase
            .from("channel_subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("channel_id", channelId)
            .eq("status", "active");
          subscriberCount = count ?? 0;
        }

        // Payouts
        let recentPayouts: Payout[] = [];
        if (channelId) {
          const { data: payoutsData } = await supabase
            .from("creator_payouts")
            .select("id, amount, status, created_at")
            .eq("channel_id", channelId)
            .order("created_at", { ascending: false })
            .limit(5);
          recentPayouts = (payoutsData ?? []) as Payout[];
        }

        // Earnings breakdown — sum from creator_earnings table if it exists
        let subscriptionEarnings = 0;
        let adEarnings = 0;
        let ppvEarnings = 0;
        let tipEarnings = 0;
        let collabEarnings = 0;

        if (channelId) {
          const { data: earningsRows } = await supabase
            .from("creator_earnings")
            .select("amount, type")
            .eq("channel_id", channelId);

          for (const row of earningsRows ?? []) {
            switch (row.type) {
              case "subscription":
                subscriptionEarnings += row.amount ?? 0;
                break;
              case "ad":
                adEarnings += row.amount ?? 0;
                break;
              case "ppv":
                ppvEarnings += row.amount ?? 0;
                break;
              case "tip":
                tipEarnings += row.amount ?? 0;
                break;
              case "collab":
                collabEarnings += row.amount ?? 0;
                break;
            }
          }
        }

        const totalEarnings =
          subscriptionEarnings + adEarnings + ppvEarnings + tipEarnings + collabEarnings;

        // Pending payout sum
        const pendingPayout = recentPayouts
          .filter((p) => p.status === "pending")
          .reduce((sum, p) => sum + p.amount, 0);

        setData({
          hasStripe,
          subscriptionPrice: channel?.subscription_price ?? null,
          subscriberCount,
          subscriptionEarnings,
          adEarnings,
          ppvEarnings,
          tipEarnings,
          collabEarnings,
          totalEarnings,
          pendingPayout,
          recentPayouts,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchEarnings();
  }, []);

  if (loading) {
    return (
      <div className="px-4 py-5 space-y-4">
        <div className="h-6 skeleton rounded w-1/3" />
        <div className="h-28 skeleton rounded-2xl" />
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const d = data ?? {
    hasStripe: false,
    subscriptionPrice: null,
    subscriberCount: 0,
    subscriptionEarnings: 0,
    adEarnings: 0,
    ppvEarnings: 0,
    tipEarnings: 0,
    collabEarnings: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    recentPayouts: [],
  };

  const canWithdraw = d.pendingPayout >= 2500; // $25 in cents

  return (
    <div className="px-4 py-5 space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-heading font-bold text-lg text-white">Earnings</h1>
        <p className="text-xs text-white/40 mt-0.5">Your creator revenue overview</p>
      </div>

      {/* Connect Stripe CTA */}
      {!d.hasStripe && (
        <Card glow>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center shrink-0">
              <svg
                width="20"
                height="20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                className="text-gold"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Connect Stripe</p>
              <p className="text-xs text-white/40 mt-0.5">
                Link your bank to receive payouts
              </p>
            </div>
            <Link
              href="/dashboard/creator/settings/stripe"
              className="px-3 py-1.5 bg-gradient-to-r from-gold to-gold-light text-midnight text-xs font-semibold rounded-lg shrink-0"
            >
              Connect
            </Link>
          </div>
        </Card>
      )}

      {/* Total earnings — gold bordered hero card */}
      <div className="rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-2">
          Total Earnings
        </p>
        <p className="font-heading text-3xl font-bold text-white">
          {d.hasStripe ? formatCents(d.totalEarnings) : "--"}
        </p>
        {d.hasStripe && d.subscriberCount > 0 && (
          <p className="text-xs text-white/40 mt-1.5">
            {d.subscriberCount} active subscriber
            {d.subscriberCount !== 1 ? "s" : ""}
            {d.subscriptionPrice
              ? ` · $${(d.subscriptionPrice / 100).toFixed(2)}/mo`
              : ""}
          </p>
        )}
      </div>

      {/* Breakdown rows */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          Breakdown
        </h2>
        <Card padding={false}>
          <div className="divide-y divide-border-subtle">
            {[
              {
                label: "Subscriptions",
                amount: d.subscriptionEarnings,
                icon: (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                    />
                  </svg>
                ),
              },
              {
                label: "Ads",
                amount: d.adEarnings,
                icon: (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-cyan"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46"
                    />
                  </svg>
                ),
              },
              {
                label: "PPV",
                amount: d.ppvEarnings,
                icon: (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                ),
              },
              {
                label: "Tips",
                amount: d.tipEarnings,
                icon: (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1012 10.125 2.625 2.625 0 0012 4.875zm0 0V21"
                    />
                  </svg>
                ),
              },
              {
                label: "Collabs",
                amount: d.collabEarnings,
                icon: (
                  <svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-gold"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                    />
                  </svg>
                ),
              },
            ].map(({ label, amount, icon }) => (
              <div
                key={label}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <span className="flex-1 text-sm font-medium text-white">
                  {label}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    d.hasStripe && amount > 0 ? "text-gold" : "text-white/30"
                  }`}
                >
                  {d.hasStripe ? formatCents(amount) : "--"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Withdraw */}
      <div className="flex items-center gap-3">
        <button
          disabled={!canWithdraw || !d.hasStripe}
          className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
            canWithdraw && d.hasStripe
              ? "bg-gradient-to-r from-gold to-gold-light text-midnight"
              : "bg-white/5 text-white/25 cursor-not-allowed"
          }`}
        >
          Withdraw
          {d.pendingPayout > 0 && d.hasStripe
            ? ` ${formatCents(d.pendingPayout)}`
            : ""}
        </button>
        {(!canWithdraw || !d.hasStripe) && (
          <p className="text-xs text-white/30 leading-tight">
            {!d.hasStripe
              ? "Connect Stripe first"
              : `Min. $25 to withdraw`}
          </p>
        )}
      </div>

      {/* Recent payouts */}
      <div>
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 mb-3">
          Recent Payouts
        </h2>
        {d.recentPayouts.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-sm text-white/40">No payouts yet</p>
            <p className="text-xs text-white/25 mt-1">
              Payouts appear here once processed
            </p>
          </Card>
        ) : (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {d.recentPayouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {formatCents(payout.amount)}
                    </p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {timeAgo(payout.created_at)}
                    </p>
                  </div>
                  <Badge
                    label={payout.status}
                    variant={payoutStatusVariants[payout.status]}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
