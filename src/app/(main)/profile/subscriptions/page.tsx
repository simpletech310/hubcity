import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Badge from "@/components/ui/Badge";
import Icon from "@/components/ui/Icon";
import OpenPortalButton from "./OpenPortalButton";

function fmt(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/profile/subscriptions");

  const { data: subs } = await supabase
    .from("channel_subscriptions")
    .select(
      "id, status, current_period_end, cancel_at_period_end, amount_cents, currency, channel:channels(id, name, slug, avatar_url)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = (subs ?? []) as Array<{
    id: string;
    status: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    amount_cents: number | null;
    currency: string | null;
    channel:
      | { id: string; name: string; slug: string; avatar_url: string | null }
      | { id: string; name: string; slug: string; avatar_url: string | null }[]
      | null;
  }>;

  return (
    <div className="culture-surface min-h-dvh animate-fade-in pb-safe">
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "3px solid var(--rule-strong-c)" }}>
        <Link
          href="/profile"
          className="inline-flex items-center gap-1 text-xs mb-3"
          style={{ color: "var(--ink-strong)" }}
        >
          <Icon name="back" size={14} /> Back to profile
        </Link>
        <p className="c-kicker">§ PROFILE · SUBSCRIPTIONS</p>
        <h1 className="c-hero">Subscriptions.</h1>
        <p className="c-serif-it">
          Channels you support, billing, and receipts.
        </p>
      </div>

      <div className="px-5 mb-4 pt-4">
        <OpenPortalButton />
      </div>

      <div className="px-5 space-y-3 mb-8">
        {list.length === 0 ? (
          <div className="c-frame p-4" style={{ background: "var(--paper-soft)" }}>
            <div className="text-center py-6">
              <Icon
                name="dollar"
                size={28}
                className="mx-auto mb-2"
                style={{ color: "var(--ink-strong)", opacity: 0.5 }}
              />
              <p className="c-body" style={{ fontSize: 13 }}>
                You haven&apos;t subscribed to any creators yet.
              </p>
              <Link href="/live" className="c-kicker mt-2 inline-block press" style={{ color: "var(--ink-strong)", textDecoration: "underline", fontSize: 11 }}>
                BROWSE CHANNELS
              </Link>
            </div>
          </div>
        ) : (
          list.map((sub) => {
            const channel = Array.isArray(sub.channel)
              ? sub.channel[0]
              : sub.channel;
            if (!channel) return null;
            return (
              <div key={sub.id} className="c-frame p-3" style={{ background: "var(--paper-soft)" }}>
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 flex items-center justify-center overflow-hidden shrink-0"
                    style={{
                      background: "var(--gold-c)",
                      border: "2px solid var(--rule-strong-c)",
                    }}
                  >
                    {channel.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={channel.avatar_url}
                        alt={channel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="c-hero" style={{ fontSize: 14, color: "var(--ink-strong)" }}>
                        {channel.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/live/channel/${channel.id}`}
                      className="c-card-t truncate block"
                      style={{ fontSize: 14 }}
                    >
                      {channel.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        label={sub.status}
                        variant={
                          sub.status === "active" || sub.status === "trialing"
                            ? "emerald"
                            : sub.status === "past_due" ||
                                sub.status === "unpaid"
                              ? "coral"
                              : "gold"
                        }
                      />
                      {sub.amount_cents ? (
                        <span className="c-meta">
                          {fmt(sub.amount_cents, sub.currency ?? "usd")}/mo
                        </span>
                      ) : null}
                    </div>
                    {sub.current_period_end && (
                      <p className="c-meta mt-1">
                        {sub.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                        {new Date(sub.current_period_end).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
