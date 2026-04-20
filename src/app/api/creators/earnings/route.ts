import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// GET /api/creators/earnings
// Optional params:
//   ?status=pending|paid     — filter by payout state
//   ?range=6mo|all           — time bucket for the chart series
//
// Returns a single object the dashboard, earnings page, and CSV exporter all
// consume so we have one source of truth for what "earnings" means.
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_creator, role")
      .eq("id", user.id)
      .maybeSingle();

    const isCreator =
      profile?.is_creator === true || profile?.role === "content_creator";
    if (!isCreator) {
      return NextResponse.json(
        { error: "Creator access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("creator_earnings")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });

    if (status && ["pending", "paid"].includes(status)) {
      query = query.eq("status", status);
    }

    const { data: earnings, error } = await query;
    if (error) throw error;
    const all = earnings ?? [];

    const total_earnings = all.reduce(
      (s, e) => s + (e.amount_cents ?? 0),
      0
    );
    const pending_payout = all
      .filter((e) => e.status === "pending")
      .reduce((s, e) => s + (e.amount_cents ?? 0), 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const this_month = all
      .filter((e) => new Date(e.created_at) >= monthStart)
      .reduce((s, e) => s + (e.amount_cents ?? 0), 0);

    // Source breakdown — power the dashboard split chart.
    const by_source = all.reduce<Record<string, number>>((acc, e) => {
      const k = e.source ?? "other";
      acc[k] = (acc[k] ?? 0) + (e.amount_cents ?? 0);
      return acc;
    }, {});

    // 6-month series for Recharts.
    const series: { month: string; subscriptions: number; ppv: number; tickets: number; ads: number; other: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const key = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      series.push({
        month: key,
        subscriptions: 0,
        ppv: 0,
        tickets: 0,
        ads: 0,
        other: 0,
      });
    }
    const seriesIndex = (date: Date) => {
      const now = new Date();
      now.setDate(1);
      now.setHours(0, 0, 0, 0);
      const months =
        (now.getFullYear() - date.getFullYear()) * 12 +
        (now.getMonth() - date.getMonth());
      return 5 - months; // 0..5
    };
    for (const e of all) {
      const d = new Date(e.created_at);
      const idx = seriesIndex(d);
      if (idx < 0 || idx > 5) continue;
      const slot = series[idx];
      if (!slot) continue;
      const cents = e.amount_cents ?? 0;
      switch (e.source) {
        case "subscription":
          slot.subscriptions += cents;
          break;
        case "ppv":
          slot.ppv += cents;
          break;
        case "event_ticket":
          slot.tickets += cents;
          break;
        case "ad_revenue":
          slot.ads += cents;
          break;
        default:
          slot.other += cents;
      }
    }

    // Subscribers count + content count.
    let subscribers = 0;
    let content_count = 0;
    let total_views = 0;
    let channelId: string | null = null;
    try {
      const { data: ch } = await supabase
        .from("channels")
        .select("id")
        .eq("owner_id", user.id)
        .limit(1)
        .maybeSingle();
      channelId = ch?.id ?? null;

      if (channelId) {
        const { count: subCount } = await supabase
          .from("channel_subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId)
          .in("status", ["active", "trialing"]);
        subscribers = subCount ?? 0;

        const { count: vidCount } = await supabase
          .from("channel_videos")
          .select("id", { count: "exact", head: true })
          .eq("channel_id", channelId);
        content_count = vidCount ?? 0;

        const { data: viewData } = await supabase
          .from("channel_videos")
          .select("view_count")
          .eq("channel_id", channelId);
        total_views = (viewData ?? []).reduce(
          (s, v) => s + (v.view_count ?? 0),
          0
        );
      }
    } catch {
      // tables/columns may not exist mid-migration; defaults are fine.
    }

    // Fetch payout history from Stripe Connect (best-effort).
    let payouts: { id: string; amount_cents: number; arrival_date: string; status: string }[] = [];
    try {
      const admin = createAdminClient();
      const { data: account } = await admin
        .from("creator_stripe_accounts")
        .select("stripe_account_id")
        .eq("creator_id", user.id)
        .maybeSingle();

      if (account?.stripe_account_id) {
        const stripe = getStripe();
        const list = await stripe.payouts.list(
          { limit: 20 },
          { stripeAccount: account.stripe_account_id }
        );
        payouts = list.data.map((p) => ({
          id: p.id,
          amount_cents: p.amount,
          arrival_date: new Date(p.arrival_date * 1000).toISOString(),
          status: p.status,
        }));
      }
    } catch (e) {
      console.error("Stripe payouts list error (non-fatal):", e);
    }

    const recent_earnings = all.slice(0, 50).map((e) => ({
      id: e.id,
      date: e.created_at,
      source: e.source ?? "other",
      description: e.description ?? null,
      amount: e.amount_cents ?? 0,
      gross: e.gross_cents ?? null,
      fee: e.platform_fee_cents ?? null,
      status: e.status as "pending" | "paid" | "cancelled",
    }));

    return NextResponse.json({
      total_earnings,
      this_month,
      pending_payout,
      subscribers,
      content_count,
      total_views,
      by_source,
      series,
      payouts,
      recent_earnings,
      channel_id: channelId,
    });
  } catch (error) {
    console.error("Creator earnings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
