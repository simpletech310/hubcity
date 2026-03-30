import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import type { Order, StripeAccount, GrantApplication, Resource } from "@/types/database";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function timeAgo(date: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const orderStatusColors: Record<string, "gold" | "emerald" | "cyan" | "coral" | "purple"> = {
  pending: "gold",
  confirmed: "cyan",
  preparing: "purple",
  ready: "emerald",
  picked_up: "emerald",
  delivered: "emerald",
  cancelled: "coral",
};

const appStatusColors: Record<string, "gold" | "emerald" | "cyan" | "coral"> = {
  submitted: "gold",
  under_review: "cyan",
  approved: "emerald",
  denied: "coral",
};

export default async function DashboardOverview() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Get user role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role ?? "citizen";
  const isBusinessOwner = userRole === "business_owner";
  const isResourceManager = userRole === "city_official" || userRole === "admin";

  // ── Business owner data ─────────────────────────────────
  let business: { id: string } | null = null;
  let todayCount = 0;
  let bookingCount = 0;
  let monthRevenue = 0;
  let orders: (Order & { customer: { display_name: string } | null })[] = [];
  let stripe: StripeAccount | null = null;

  if (isBusinessOwner) {
    const { data: biz } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    business = biz;

    if (business) {
      const today = new Date().toISOString().split("T")[0];
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1
      ).toISOString();

      const [ordersToday, pendingBookings, monthlyOrders, recentOrders, stripeAccount] =
        await Promise.all([
          supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .eq("business_id", business.id)
            .gte("created_at", today),
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("business_id", business.id)
            .eq("status", "pending"),
          supabase
            .from("orders")
            .select("total")
            .eq("business_id", business.id)
            .gte("created_at", monthStart),
          supabase
            .from("orders")
            .select("*, customer:profiles!orders_customer_id_fkey(display_name)")
            .eq("business_id", business.id)
            .order("created_at", { ascending: false })
            .limit(5),
          supabase
            .from("stripe_accounts")
            .select("*")
            .eq("business_id", business.id)
            .single(),
        ]);

      todayCount = ordersToday.count ?? 0;
      bookingCount = pendingBookings.count ?? 0;
      monthRevenue = (monthlyOrders.data ?? []).reduce(
        (sum: number, o: { total: number }) => sum + o.total,
        0
      );
      orders = (recentOrders.data ?? []) as (Order & {
        customer: { display_name: string } | null;
      })[];
      stripe = stripeAccount.data as StripeAccount | null;
    }
  }

  // ── Resource manager data ───────────────────────────────
  let totalResources = 0;
  let totalApplications = 0;
  let pendingApplications = 0;
  let recentApplications: (GrantApplication & {
    applicant: { display_name: string } | null;
    resource: { name: string } | null;
  })[] = [];

  if (isResourceManager) {
    // Get resource IDs for this manager
    let resourceQuery = supabase.from("resources").select("id");
    if (userRole === "city_official") {
      resourceQuery = resourceQuery.eq("created_by", user.id);
    }
    const { data: resourceRows } = await resourceQuery;
    const resourceIds = (resourceRows ?? []).map((r: { id: string }) => r.id);
    totalResources = resourceIds.length;

    if (resourceIds.length > 0) {
      const [allApps, pendingApps, recentApps] = await Promise.all([
        supabase
          .from("grant_applications")
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds),
        supabase
          .from("grant_applications")
          .select("id", { count: "exact", head: true })
          .in("resource_id", resourceIds)
          .eq("status", "submitted"),
        supabase
          .from("grant_applications")
          .select("*, applicant:profiles(display_name), resource:resources(name)")
          .in("resource_id", resourceIds)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      totalApplications = allApps.count ?? 0;
      pendingApplications = pendingApps.count ?? 0;
      recentApplications = (recentApps.data ?? []) as typeof recentApplications;
    }
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* ── Business Owner Stats ─────────────────────────── */}
      {isBusinessOwner && business && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-gold">{todayCount}</p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Today&apos;s Orders</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-cyan">{bookingCount}</p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Pending Bookings</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-emerald">
                {formatCents(monthRevenue)}
              </p>
              <p className="text-[10px] text-txt-secondary mt-0.5">This Month</p>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-sm font-semibold text-txt-secondary mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/orders">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">View Orders</span>
                </Card>
              </Link>
              <Link href="/dashboard/menu">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Edit Menu</span>
                </Card>
              </Link>
              <Link href="/dashboard/bookings">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Manage Bookings</span>
                </Card>
              </Link>
              <Link href="/dashboard/settings">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-hc-purple/10 flex items-center justify-center text-hc-purple">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </Card>
              </Link>
            </div>
          </div>

          {/* Stripe Connect Status */}
          {!stripe || !stripe.onboarding_complete ? (
            <Card glow>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/15 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gold">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Set Up Payments</p>
                  <p className="text-xs text-txt-secondary">
                    Connect Stripe to accept orders and bookings
                  </p>
                </div>
                <Link
                  href="/dashboard/settings"
                  className="px-3 py-1.5 bg-gradient-to-r from-gold to-gold-light text-midnight text-xs font-semibold rounded-lg"
                >
                  Setup
                </Link>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald/15 flex items-center justify-center">
                  <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-emerald">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Payments Active</p>
                  <p className="text-xs text-txt-secondary">
                    Stripe connected &middot; Ready to accept payments
                  </p>
                </div>
                <Badge label="Live" variant="emerald" />
              </div>
            </Card>
          )}

          {/* Recent Orders */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-txt-secondary">
                Recent Orders
              </h2>
              <Link
                href="/dashboard/orders"
                className="text-xs text-gold font-medium"
              >
                View All
              </Link>
            </div>
            {orders.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-txt-secondary text-sm">No orders yet</p>
                <p className="text-xs text-txt-secondary mt-1">
                  Orders will appear here once customers start ordering
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <Link key={order.id} href={`/dashboard/orders/${order.id}`}>
                    <Card hover className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            #{order.order_number}
                          </span>
                          <Badge
                            label={order.status}
                            variant={orderStatusColors[order.status] || "gold"}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-txt-secondary mt-0.5">
                          {order.customer?.display_name || "Customer"} &middot;{" "}
                          {timeAgo(order.created_at)}
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gold">
                        {formatCents(order.total)}
                      </span>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Resource Manager Stats ───────────────────────── */}
      {isResourceManager && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-gold">{totalApplications}</p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Total Apps</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-cyan">{pendingApplications}</p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Pending</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-heading font-bold text-emerald">{totalResources}</p>
              <p className="text-[10px] text-txt-secondary mt-0.5">Resources</p>
            </Card>
          </div>

          {/* Quick Actions for Resource Managers */}
          <div>
            <h2 className="text-sm font-semibold text-txt-secondary mb-3">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/dashboard/applications">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Review Apps</span>
                </Card>
              </Link>
              <Link href="/dashboard/resources">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald/10 flex items-center justify-center text-emerald">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">My Resources</span>
                </Card>
              </Link>
              <Link href="/dashboard/resources/new">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan/10 flex items-center justify-center text-cyan">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">New Resource</span>
                </Card>
              </Link>
              <Link href="/dashboard/settings">
                <Card hover className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-hc-purple/10 flex items-center justify-center text-hc-purple">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Settings</span>
                </Card>
              </Link>
            </div>
          </div>

          {/* Recent Applications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-txt-secondary">
                Recent Applications
              </h2>
              <Link
                href="/dashboard/applications"
                className="text-xs text-gold font-medium"
              >
                View All
              </Link>
            </div>
            {recentApplications.length === 0 ? (
              <Card className="text-center py-8">
                <p className="text-txt-secondary text-sm">No applications yet</p>
                <p className="text-xs text-txt-secondary mt-1">
                  Applications will appear here when people apply to your resources
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {recentApplications.map((app) => (
                  <Link key={app.id} href="/dashboard/applications">
                    <Card hover className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">
                            {app.applicant?.display_name || "Applicant"}
                          </span>
                          <Badge
                            label={app.status.replace("_", " ")}
                            variant={appStatusColors[app.status] || "gold"}
                            size="sm"
                          />
                        </div>
                        <p className="text-xs text-txt-secondary mt-0.5">
                          {app.resource?.name || "Resource"} &middot;{" "}
                          {timeAgo(app.created_at)}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
