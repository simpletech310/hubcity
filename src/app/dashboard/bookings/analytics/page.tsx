import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";

export const dynamic = "force-dynamic";

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function startOfWeek(ref: Date = new Date()): Date {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  // Monday as week start — change to Sunday if we standardize elsewhere.
  const day = d.getDay();
  const diffToMonday = (day + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function BookingAnalyticsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="px-4 py-5">
        <p className="text-sm">Please sign in to view booking analytics.</p>
      </div>
    );
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    return (
      <div className="px-4 py-5">
        <p className="text-sm">No business found for your account.</p>
      </div>
    );
  }

  const weekStart = startOfWeek();
  const today = new Date();
  const weekStartYmd = ymd(weekStart);
  const todayYmd = ymd(today);

  // ─── This week's bookings ───────────────────────────────────
  const { data: weekBookings } = await supabase
    .from("bookings")
    .select("id, status, price, staff_id, staff_name")
    .eq("business_id", business.id)
    .gte("date", weekStartYmd)
    .lte("date", todayYmd);

  const bookingsThisWeek = weekBookings?.length ?? 0;
  const revenueThisWeek =
    weekBookings
      ?.filter((b) => b.status === "confirmed" || b.status === "completed")
      .reduce((sum, b) => sum + (b.price ?? 0), 0) ?? 0;

  // No-show %: of bookings in completed states (completed + no_show + cancelled
  // in the past), what share were no_show? Keep it simple for the stub.
  const pastTerminal =
    weekBookings?.filter((b) =>
      ["completed", "no_show", "cancelled"].includes(b.status)
    ).length ?? 0;
  const noShows = weekBookings?.filter((b) => b.status === "no_show").length ?? 0;
  const noShowPct = pastTerminal > 0 ? (noShows / pastTerminal) * 100 : 0;

  // Top 3 staff by bookings this week.
  const staffCounts = new Map<string, { name: string; count: number }>();
  for (const b of weekBookings ?? []) {
    if (!b.staff_id) continue;
    const entry = staffCounts.get(b.staff_id) ?? {
      name: b.staff_name ?? "Staff",
      count: 0,
    };
    entry.count += 1;
    // Prefer a real name if a later row has it.
    if (b.staff_name && entry.name === "Staff") entry.name = b.staff_name;
    staffCounts.set(b.staff_id, entry);
  }
  const topStaff = Array.from(staffCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  return (
    <div className="px-4 py-5 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold">Booking Analytics</h1>
        <Link
          href="/dashboard/bookings"
          className="text-xs text-gold font-semibold"
        >
          Back to bookings
        </Link>
      </div>
      <p className="text-xs text-txt-secondary">
        Week starting {weekStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      </p>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-[11px] uppercase tracking-wide text-txt-secondary">Bookings</p>
          <p className="text-2xl font-bold mt-1">{bookingsThisWeek}</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">this week</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide text-txt-secondary">Revenue</p>
          <p className="text-2xl font-bold mt-1">{formatCents(revenueThisWeek)}</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">confirmed + completed</p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide text-txt-secondary">No-show rate</p>
          <p className="text-2xl font-bold mt-1">{noShowPct.toFixed(1)}%</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">
            {noShows} of {pastTerminal} closed
          </p>
        </Card>
        <Card>
          <p className="text-[11px] uppercase tracking-wide text-txt-secondary">Active staff</p>
          <p className="text-2xl font-bold mt-1">{staffCounts.size}</p>
          <p className="text-[11px] text-txt-secondary mt-0.5">with bookings</p>
        </Card>
      </div>

      {/* Top staff */}
      {topStaff.length > 0 && (
        <Card>
          <h2 className="text-sm font-bold mb-2">Top staff this week</h2>
          <ul className="space-y-1.5">
            {topStaff.map((s, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span>
                  <span className="text-gold font-bold mr-2">{i + 1}.</span>
                  {s.name}
                </span>
                <span className="text-txt-secondary text-xs">
                  {s.count} booking{s.count === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {topStaff.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-sm text-txt-secondary">
            No staff assignments yet this week. Assign staff to bookings to see rankings.
          </p>
        </Card>
      )}
    </div>
  );
}
