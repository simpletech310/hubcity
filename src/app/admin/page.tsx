import Card from "@/components/ui/Card";
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
    { label: "Businesses", value: (businessCount ?? 0).toString(), icon: "🏪", change: "Live" },
    { label: "Events", value: (eventCount ?? 0).toString(), icon: "📅", change: "Active" },
    { label: "Resources", value: (resourceCount ?? 0).toString(), icon: "💡", change: "Published" },
    { label: "Posts", value: (postCount ?? 0).toString(), icon: "📢", change: "Feed" },
    { label: "Polls", value: (pollCount ?? 0).toString(), icon: "📊", change: "Pulse" },
    { label: "Surveys", value: (surveyCount ?? 0).toString(), icon: "📋", change: "Pulse" },
  ];

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-txt-secondary mb-6">
        Hub City App admin overview
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-xl">
                {stat.icon}
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-gold">{stat.value}</p>
                <p className="text-xs text-txt-secondary">{stat.label} · {stat.change}</p>
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
