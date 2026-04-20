/**
 * GET /api/stripe/payouts
 *
 * Returns a normalized list of Stripe payouts for the signed-in business
 * owner's connected account, plus the connected account's payout schedule.
 * Optional query params:
 *   - month=YYYY-MM   filter by month (server-side; Stripe `arrival_date`
 *                     range)
 *   - limit=N         max results (default 100, hard cap 100 per Stripe)
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

function monthRange(month: string): { gte: number; lt: number } | null {
  // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return null;
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return {
    gte: Math.floor(start.getTime() / 1000),
    lt: Math.floor(end.getTime() / 1000),
  };
}

export interface PayoutRow {
  id: string;
  amount: number; // cents
  currency: string;
  status: string;
  arrival_date: string; // ISO
  created: string; // ISO
  method: string;
  type: string;
  description: string | null;
  statement_descriptor: string | null;
  failure_message: string | null;
}

export interface PayoutSchedule {
  interval: string;
  delay_days: number | string;
  weekly_anchor?: string | null;
  monthly_anchor?: number | null;
}

export interface PayoutsResponse {
  payouts: PayoutRow[];
  schedule: PayoutSchedule | null;
  has_more: boolean;
  total_count: number;
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (bizError || !business) {
      return NextResponse.json({ error: "No business found" }, { status: 404 });
    }

    const { data: stripeAccount, error: stripeError } = await supabase
      .from("stripe_accounts")
      .select("stripe_account_id, payouts_enabled")
      .eq("business_id", business.id)
      .single();

    if (stripeError || !stripeAccount?.stripe_account_id) {
      return NextResponse.json({
        payouts: [],
        schedule: null,
        has_more: false,
        total_count: 0,
        connected: false,
      });
    }

    const stripe = getStripe();
    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const limit = Math.min(
      Number(url.searchParams.get("limit") ?? 100) || 100,
      100
    );

    const listParams: Stripe.PayoutListParams = { limit };
    if (month) {
      const range = monthRange(month);
      if (range) {
        listParams.arrival_date = { gte: range.gte, lt: range.lt };
      }
    }

    const [payoutsResp, account] = await Promise.all([
      stripe.payouts.list(listParams, {
        stripeAccount: stripeAccount.stripe_account_id,
      }),
      stripe.accounts.retrieve(stripeAccount.stripe_account_id),
    ]);

    const payouts: PayoutRow[] = payoutsResp.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrival_date: new Date(p.arrival_date * 1000).toISOString(),
      created: new Date(p.created * 1000).toISOString(),
      method: p.method,
      type: p.type,
      description: p.description,
      statement_descriptor: p.statement_descriptor,
      failure_message: p.failure_message,
    }));

    const sched = account.settings?.payouts?.schedule;
    const schedule: PayoutSchedule | null = sched
      ? {
          interval: sched.interval,
          delay_days: sched.delay_days,
          weekly_anchor: sched.weekly_anchor ?? null,
          monthly_anchor: sched.monthly_anchor ?? null,
        }
      : null;

    return NextResponse.json({
      payouts,
      schedule,
      has_more: payoutsResp.has_more,
      total_count: payouts.length,
      connected: true,
      payouts_enabled: stripeAccount.payouts_enabled,
    });
  } catch (error) {
    console.error("Stripe payouts list error:", error);
    return NextResponse.json(
      { error: "Failed to load payouts" },
      { status: 500 }
    );
  }
}
