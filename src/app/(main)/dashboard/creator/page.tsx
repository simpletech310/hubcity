import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import StripeOnboardCard from "@/components/creator/StripeOnboardCard";

function fmt(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(cents / 100);
}

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/dashboard/creator");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, role, is_creator, creator_tier")
    .eq("id", user.id)
    .single();

  const isCreator =
    profile?.is_creator === true || profile?.role === "content_creator";
  if (!isCreator) redirect("/creators/apply");

  const { data: channel } = await supabase
    .from("channels")
    .select(
      "id, name, slug, follower_count, is_verified, subscription_price_cents, subscription_currency"
    )
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle();

  // Stripe connect snapshot.
  const { data: stripeAccount } = await supabase
    .from("creator_stripe_accounts")
    .select("onboarding_complete, charges_enabled, payouts_enabled")
    .eq("creator_id", user.id)
    .maybeSingle();

  // Last 30d earnings + subscriber count.
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [{ data: earnings }, { count: subCount }, { data: topVideos }] = await Promise.all([
    supabase
      .from("creator_earnings")
      .select("amount_cents, source, created_at")
      .eq("creator_id", user.id)
      .gte("created_at", since.toISOString()),
    channel?.id
      ? supabase
          .from("channel_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channel.id)
          .in("status", ["active", "trialing"])
      : Promise.resolve({ count: 0 }),
    channel?.id
      ? supabase
          .from("channel_videos")
          .select("id, title, view_count, access_type, price_cents")
          .eq("channel_id", channel.id)
          .order("view_count", { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const allEarnings = earnings ?? [];
  const earningsThisPeriod = allEarnings.reduce(
    (s, e) => s + (e.amount_cents ?? 0),
    0
  );
  const ppvCount = allEarnings.filter((e) => e.source === "ppv").length;

  // Upcoming paid events (event_tickets table only exists if ticketing is wired)
  const today = new Date().toISOString().split("T")[0];
  let upcomingEvents: { id: string; title: string; start_date: string }[] = [];
  try {
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date")
      .eq("is_published", true)
      .gte("start_date", today)
      .eq("organizer_id", user.id)
      .order("start_date")
      .limit(3);
    upcomingEvents = (data ?? []) as typeof upcomingEvents;
  } catch {
    /* events.organizer_id may not exist — skip gracefully */
  }

  return (
    <div className="animate-fade-in pb-safe">
      {/* Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/8 via-deep to-hc-purple/6" />
        <div className="absolute inset-0 pattern-dots opacity-15" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-midnight to-transparent" />
        <div className="relative z-10 px-5 pt-6 pb-5">
          <p className="text-[10px] font-bold text-gold uppercase tracking-wider mb-1">
            Creator Dashboard
          </p>
          <h1 className="font-heading text-2xl font-bold">
            Welcome back, {profile?.display_name || "Creator"}
          </h1>
          <p className="text-xs text-txt-secondary mt-1">
            Here&apos;s how your channel is performing in the last 30 days.
          </p>
        </div>
      </div>

      {/* Stripe onboarding card */}
      <section className="px-5 mt-4 mb-5">
        <StripeOnboardCard
          initial={{
            connected: Boolean(stripeAccount),
            onboarding_complete: stripeAccount?.onboarding_complete ?? false,
            charges_enabled: stripeAccount?.charges_enabled ?? false,
            payouts_enabled: stripeAccount?.payouts_enabled ?? false,
          }}
        />
      </section>

      {/* KPIs */}
      <section className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gold" />
            <p className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider mb-1">
              Earnings (30d)
            </p>
            <p className="font-heading font-bold text-2xl text-gold leading-none">
              {fmt(earningsThisPeriod)}
            </p>
          </Card>
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald" />
            <p className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider mb-1">
              Subscribers
            </p>
            <p className="font-heading font-bold text-2xl text-emerald leading-none">
              {subCount ?? 0}
            </p>
          </Card>
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-hc-purple" />
            <p className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider mb-1">
              PPV Sales (30d)
            </p>
            <p className="font-heading font-bold text-2xl text-hc-purple leading-none">
              {ppvCount}
            </p>
          </Card>
          <Card variant="glass" className="relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-hc-blue" />
            <p className="text-[10px] font-semibold text-txt-secondary uppercase tracking-wider mb-1">
              Followers
            </p>
            <p className="font-heading font-bold text-2xl text-hc-blue leading-none">
              {channel?.follower_count ?? 0}
            </p>
          </Card>
        </div>
      </section>

      {/* Quick links */}
      <section className="px-5 mb-6">
        <div className="grid grid-cols-2 gap-3">
          <Link href="/dashboard/creator/earnings">
            <Card hover className="text-center">
              <Icon name="dollar" size={24} className="text-gold mx-auto mb-1" />
              <p className="text-xs font-bold">Earnings</p>
              <p className="text-[10px] text-txt-secondary">View full breakdown</p>
            </Card>
          </Link>
          <Link href="/dashboard/creator/monetization">
            <Card hover className="text-center">
              <Icon name="sparkle" size={24} className="text-emerald mx-auto mb-1" />
              <p className="text-xs font-bold">Monetization</p>
              <p className="text-[10px] text-txt-secondary">Pricing & access</p>
            </Card>
          </Link>
        </div>
      </section>

      {/* Top videos */}
      <section className="px-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-5 rounded-full bg-gold" />
          <h2 className="font-heading font-bold text-base">Top videos</h2>
        </div>
        {topVideos && topVideos.length > 0 ? (
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {topVideos.map((v) => (
                <Link
                  key={v.id}
                  href={`/live/watch/${v.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold truncate">{v.title}</p>
                    <p className="text-[10px] text-txt-secondary">
                      {(v.view_count ?? 0).toLocaleString()} views
                    </p>
                  </div>
                  <Badge
                    label={
                      v.access_type === "ppv"
                        ? `PPV ${fmt(v.price_cents ?? 0)}`
                        : v.access_type === "subscribers"
                          ? "Subscribers"
                          : "Free"
                    }
                    variant={
                      v.access_type === "ppv"
                        ? "gold"
                        : v.access_type === "subscribers"
                          ? "purple"
                          : "blue"
                    }
                  />
                </Link>
              ))}
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-xs text-txt-secondary text-center py-4">
              No videos yet. Upload your first one from your channel page.
            </p>
          </Card>
        )}
      </section>

      {/* Upcoming paid events */}
      {upcomingEvents.length > 0 && (
        <section className="px-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 rounded-full bg-hc-blue" />
            <h2 className="font-heading font-bold text-base">Upcoming events</h2>
          </div>
          <Card padding={false}>
            <div className="divide-y divide-border-subtle">
              {upcomingEvents.map((e) => (
                <div key={e.id} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-xs font-semibold truncate">{e.title}</p>
                  <p className="text-[10px] text-txt-secondary">
                    {new Date(e.start_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
