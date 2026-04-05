import Card from "@/components/ui/Card";
import AnimatedCounter from "@/components/ui/AnimatedCounter";
import SparkLine from "@/components/charts/SparkLine";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: businessCount },
    { count: eventCount },
    { count: resourceCount },
    { count: postCount },
    { count: pollCount },
    { count: surveyCount },
  ] = await Promise.all([
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
    supabase.from("resources").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("polls").select("*", { count: "exact", head: true }),
    supabase.from("surveys").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Businesses", value: businessCount ?? 0, icon: "🏪", change: "Live", color: "#F2A900", spark: [3, 5, 4, 7, 6, 8, 9] },
    { label: "Events", value: eventCount ?? 0, icon: "📅", change: "Active", color: "#22C55E", spark: [2, 4, 3, 6, 5, 7, 8] },
    { label: "Resources", value: resourceCount ?? 0, icon: "💡", change: "Published", color: "#06B6D4", spark: [1, 3, 2, 4, 5, 4, 6] },
    { label: "Posts", value: postCount ?? 0, icon: "📢", change: "Feed", color: "#8B5CF6", spark: [5, 7, 6, 9, 8, 11, 12] },
    { label: "Polls", value: pollCount ?? 0, icon: "📊", change: "Pulse", color: "#FF6B6B", spark: [1, 2, 1, 3, 2, 4, 3] },
    { label: "Surveys", value: surveyCount ?? 0, icon: "📋", change: "Pulse", color: "#3B82F6", spark: [2, 1, 3, 2, 4, 3, 5] },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-txt-secondary mb-6">
        Hub City App admin overview
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label} className="card-lift">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-xl">
                  {stat.icon}
                </div>
                <div>
                  <p className="font-heading text-2xl font-bold tabular-nums" style={{ color: stat.color }}>
                    <AnimatedCounter value={stat.value} />
                  </p>
                  <p className="text-xs text-txt-secondary">{stat.label} · {stat.change}</p>
                </div>
              </div>
              <div className="shrink-0 mt-1">
                <SparkLine data={stat.spark} color={stat.color} width={64} height={28} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="font-heading font-semibold text-lg mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {[
          { label: "Add Business", icon: "🏪", href: "/admin/businesses" },
          { label: "Create Event", icon: "📅", href: "/admin/events" },
          { label: "Add Resource", icon: "💡", href: "/admin/resources" },
          { label: "Manage Posts", icon: "📢", href: "/admin/posts" },
          { label: "Manage Polls", icon: "📊", href: "/admin/polls" },
          { label: "Manage Surveys", icon: "📋", href: "/admin/surveys" },
          { label: "Send Notification", icon: "🔔", href: "/admin/notifications" },
        ].map((action) => (
          <a key={action.label} href={action.href}>
            <Card hover>
              <div className="flex items-center gap-3">
                <span className="text-xl">{action.icon}</span>
                <span className="text-sm font-semibold">{action.label}</span>
              </div>
            </Card>
          </a>
        ))}
      </div>

      {/* Recent Activity */}
      <h2 className="font-heading font-semibold text-lg mb-3">
        Recent Activity
      </h2>
      <div className="space-y-2">
        {[
          { action: "New user registered", detail: "john.doe@email.com", time: "5 min ago" },
          { action: "Event created", detail: "Youth Basketball Signup", time: "1 hour ago" },
          { action: "Business listing updated", detail: "Bludso's BBQ hours changed", time: "2 hours ago" },
          { action: "Broadcast sent", detail: "Holiday schedule update — 4,200 recipients", time: "4 hours ago" },
          { action: "Resource added", detail: "Emergency Housing Assistance program", time: "6 hours ago" },
        ].map((item, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-txt-secondary">{item.detail}</p>
              </div>
              <span className="text-[10px] text-txt-secondary shrink-0">
                {item.time}
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
