import { createClient } from "@/lib/supabase/server";
import NotificationsList from "@/components/notifications/NotificationsList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="animate-fade-in">
        <div className="px-5 pt-4 mb-4">
          <h1 className="font-heading text-2xl font-bold mb-1">Notifications</h1>
          <p className="text-sm text-txt-secondary">Stay in the loop</p>
        </div>
        <div className="text-center py-16 px-5">
          <span className="text-5xl block mb-3">{"\u{1F514}"}</span>
          <p className="text-sm font-medium mb-1">Sign in to view notifications</p>
          <p className="text-xs text-txt-secondary mb-4">
            Get updates on events, resources, and more in your community.
          </p>
          <a
            href="/login"
            className="inline-block bg-gold text-midnight px-6 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationsList notifications={notifications || []} userId={user.id} />;
}
