import { createClient } from "@/lib/supabase/server";
import NotificationsList from "@/components/notifications/NotificationsList";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="culture-surface animate-fade-in min-h-dvh">
        <div
          className="px-[18px] pt-6 pb-4"
          style={{ borderBottom: "3px solid var(--rule-strong-c)" }}
        >
          <div className="c-kicker">§ THE WIRE</div>
          <h1
            className="c-display mt-2"
            style={{ fontSize: 56, lineHeight: 0.85 }}
          >
            DISPATCHES.
          </h1>
          <p
            className="c-serif-it mt-2"
            style={{ fontSize: 13 }}
          >
            Stay in the loop.
          </p>
        </div>
        <div className="text-center py-16 px-5">
          <div className="c-kicker mb-3" style={{ opacity: 0.5 }}>
            § SIGN IN REQUIRED
          </div>
          <p className="c-card-t" style={{ fontSize: 16 }}>
            Sign in to view notifications.
          </p>
          <p
            className="mt-2"
            style={{
              fontFamily: "var(--font-body), Inter, sans-serif",
              fontSize: 13,
              color: "var(--ink-soft)",
            }}
          >
            Get updates on events, resources, and more in your community.
          </p>
          <a
            href="/login"
            className="c-btn c-btn-accent inline-block mt-4"
            style={{ padding: "12px 18px" }}
          >
            SIGN IN
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

  return (
    <div className="culture-surface min-h-dvh">
      <NotificationsList notifications={notifications || []} userId={user.id} />
    </div>
  );
}
