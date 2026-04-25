import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/bookings/:id/mark-balance-paid
 *
 * Business owner action — invoked when the customer arrives and pays the
 * remaining balance (or doesn't owe anything because the deposit covered
 * the full price). Records the balance amount, the payment method the
 * staffer collected it through, and flips the booking to `completed`.
 *
 * Body (all optional):
 *   amount_cents:  number  // defaults to (price - deposit_paid_cents - balance_paid_cents)
 *   method:        'cash' | 'card_at_appointment' | 'platform' | 'other'  (default 'cash')
 *   complete:      boolean // mark the booking 'completed' too. default true.
 */
const VALID_METHODS = new Set(["platform", "cash", "card_at_appointment", "other"]);

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      amount_cents?: number;
      method?: string;
      complete?: boolean;
    };
    const method = (body.method ?? "cash").toLowerCase();
    if (!VALID_METHODS.has(method)) {
      return NextResponse.json(
        { error: `Invalid method. Must be one of: ${[...VALID_METHODS].join(", ")}` },
        { status: 400 },
      );
    }

    // Authorize: only the business owner (or an admin) can mark a balance paid.
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select(
        "id, business_id, price, deposit_paid_cents, balance_paid_cents, status, business:businesses(owner_id)",
      )
      .eq("id", id)
      .maybeSingle();

    if (bErr || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Supabase typed `business` as an array even though we maybeSingle'd it;
    // unwrap and read owner_id.
    const businessRow = booking.business as unknown as
      | { owner_id: string | null }
      | { owner_id: string | null }[]
      | null;
    const ownerId = Array.isArray(businessRow)
      ? businessRow[0]?.owner_id ?? null
      : businessRow?.owner_id ?? null;
    if (ownerId !== user.id) {
      // Allow admins as a fallback.
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    if (booking.status === "cancelled") {
      return NextResponse.json(
        { error: "Cancelled bookings can't be settled" },
        { status: 400 },
      );
    }

    const total = booking.price ?? 0;
    const alreadyPaid =
      (booking.deposit_paid_cents ?? 0) + (booking.balance_paid_cents ?? 0);
    const remaining = Math.max(0, total - alreadyPaid);

    // If amount_cents wasn't provided, settle the full remaining balance.
    let amount = body.amount_cents ?? remaining;
    if (amount < 0) amount = 0;
    if (amount > remaining + 50) {
      return NextResponse.json(
        { error: `Amount exceeds remaining balance of $${(remaining / 100).toFixed(2)}` },
        { status: 400 },
      );
    }

    const newBalancePaid = (booking.balance_paid_cents ?? 0) + amount;
    const shouldComplete = body.complete !== false;

    const { error: uErr } = await supabase
      .from("bookings")
      .update({
        balance_paid_cents: newBalancePaid,
        balance_paid_at: new Date().toISOString(),
        balance_payment_method: method,
        ...(shouldComplete ? { status: "completed" } : {}),
      })
      .eq("id", id);

    if (uErr) throw uErr;

    return NextResponse.json({
      ok: true,
      balance_paid_cents: newBalancePaid,
      remaining_cents: Math.max(0, remaining - amount),
      status: shouldComplete ? "completed" : booking.status,
    });
  } catch (err) {
    console.error("mark-balance-paid error:", err);
    return NextResponse.json(
      { error: "Failed to mark balance paid" },
      { status: 500 },
    );
  }
}
